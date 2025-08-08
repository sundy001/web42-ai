import type {
  AckMessageResponse,
  Message,
  PullMessagesResponse,
  StopOptions,
} from "../types.js";
import {
  validateConsumerOptions,
  type ConsumerOptions,
} from "../utils/validation.js";
import { queuesClient } from "./cloudflare.js";

export class Consumer {
  private config: ConsumerOptions;
  private pollingTimeoutId: NodeJS.Timeout | undefined;
  private stopped = true;
  public abortController!: AbortController;

  // Performance optimization properties
  private pendingAcks: Message[] = [];
  private pendingRetries: Message[] = [];
  private ackBatchTimeout?: NodeJS.Timeout;

  constructor(options: ConsumerOptions) {
    this.config = validateConsumerOptions(options);
  }

  public start(): void {
    if (!this.stopped) {
      return;
    }

    this.abortController = new AbortController();
    this.stopped = false;
    this.poll();
  }

  private get fetchOptions(): { signal: AbortSignal } {
    return {
      signal: this.abortController.signal,
    };
  }

  public stop(options?: StopOptions): void {
    if (this.stopped) {
      return;
    }

    this.stopped = true;
    this.clearPollingTimeout();

    if (options?.abort) {
      this.abortController.abort();
    }
  }

  public destroy(): void {
    this.stop({ abort: true });
    this.clearAckBatchTimeout();
    this.flushPendingAcknowledgments();
  }

  private clearPollingTimeout(): void {
    if (this.pollingTimeoutId) {
      clearTimeout(this.pollingTimeoutId);
      this.pollingTimeoutId = undefined;
    }
  }

  private clearAckBatchTimeout(): void {
    if (this.ackBatchTimeout) {
      clearTimeout(this.ackBatchTimeout);
      this.ackBatchTimeout = undefined;
    }
  }

  private async poll(): Promise<void> {
    if (this.stopped) {
      return;
    }

    try {
      const output = await this.receiveMessage();
      await this.handleQueueResponse(output);
    } catch {
      // Error is ignored as polling will continue in the next cycle
    }

    this.clearPollingTimeout();
    this.pollingTimeoutId = setTimeout(
      () => this.poll(),
      this.config.pollingWaitTimeMs,
    );
  }

  private hasMessages(response: PullMessagesResponse): boolean {
    return (
      Array.isArray(response?.result?.messages) &&
      response.result.messages.length > 0
    );
  }

  private async receiveMessage(): Promise<PullMessagesResponse> {
    return queuesClient<PullMessagesResponse>({
      ...this.fetchOptions,
      path: "messages/pull",
      method: "POST",
      body: {
        batch_size: this.config.batchSize,
        visibility_timeout_ms: this.config.visibilityTimeoutMs,
      },
      accountId: this.config.accountId,
      queueId: this.config.queueId,
    });
  }

  private async handleQueueResponse(
    response: PullMessagesResponse,
  ): Promise<void> {
    if (!response.success || !this.hasMessages(response)) {
      return;
    }

    const messages = response.result.messages;
    try {
      const ackedMessages: Message[] = await this.executeBatchHandler(messages);

      if (ackedMessages?.length > 0) {
        await this.acknowledgeMessage(ackedMessages, []);
      }
    } catch {
      if (this.config.retryMessagesOnError) {
        await this.acknowledgeMessage([], messages);
      }
    }
  }

  private async executeBatchHandler(messages: Message[]): Promise<Message[]> {
    try {
      const result: void | Message[] =
        await this.config.handleMessageBatch(messages);

      return !this.config.alwaysAcknowledge && result instanceof Object
        ? result
        : messages;
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(`Unexpected message handler failure: ${err.message}`);
      }
      throw new Error(String(err));
    }
  }

  private async acknowledgeMessage(
    acks: Message[],
    retries: Message[],
  ): Promise<AckMessageResponse | void> {
    try {
      const retriesWithDelay = retries.map((message) => ({
        ...message,
        delay_seconds: this.config.retryMessageDelay,
      }));
      const input = { acks, retries: retriesWithDelay };

      const result = await queuesClient<AckMessageResponse>({
        ...this.fetchOptions,
        path: "messages/ack",
        method: "POST",
        body: input,
        accountId: this.config.accountId,
        queueId: this.config.queueId,
      });

      if (!result.success) {
        throw new Error("Message Acknowledgement did not succeed.");
      }

      return result;
    } catch {
      // Return void on error as indicated by return type
      return;
    }
  }

  private async flushPendingAcknowledgments(): Promise<void> {
    this.clearAckBatchTimeout();

    if (this.pendingAcks.length === 0 && this.pendingRetries.length === 0) {
      return;
    }

    const acksToProcess = [...this.pendingAcks];
    const retriesToProcess = [...this.pendingRetries];

    // Clear the arrays
    this.pendingAcks.length = 0;
    this.pendingRetries.length = 0;

    try {
      if (acksToProcess.length > 0 || retriesToProcess.length > 0) {
        await this.acknowledgeMessage(acksToProcess, retriesToProcess);
      }
    } catch (error) {
      console.debug("Failed to flush acknowledgments", { error });
    }
  }
}
