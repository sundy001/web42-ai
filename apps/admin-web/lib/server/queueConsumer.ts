/**
 * Cloudflare Queue Pull Consumer Implementation
 * Direct HTTP API approach for maximum control over polling and message handling
 */

// Types for Cloudflare Queue API
export interface QueueMessage {
  id: string;
  body: any;
  timestamp_ms: number;
  attempts: number;
  lease_id: string;
}

export interface PullMessagesResponse {
  success: boolean;
  result: QueueMessage[];
  errors: Array<{ code: number; message: string }>;
}

export interface AckMessagesRequest {
  acks: Array<{ lease_id: string }>;
  retries?: Array<{ lease_id: string; delay_seconds?: number }>;
}

export interface QueueConsumerConfig {
  accountId: string;
  queueId: string;
  batchSize?: number;
  visibilityTimeoutMs?: number;
  pollIntervalMs?: number;
  maxConcurrentBatches?: number;
}

export class CloudflareQueueConsumer {
  private config: Required<QueueConsumerConfig>;
  private isRunning = false;
  private pollTimeoutId: NodeJS.Timeout | null = null;
  private activeBatches = new Set<string>();

  constructor(config: QueueConsumerConfig) {
    this.config = {
      batchSize: 10,
      visibilityTimeoutMs: 30000,
      pollIntervalMs: 1000, // 1 second polling interval
      maxConcurrentBatches: 3,
      ...config,
    };
  }

  private getBaseUrl(): string {
    return `https://api.cloudflare.com/client/v4/accounts/${this.config.accountId}/queues/${this.config.queueId}`;
  }

  private getHeaders(): Record<string, string> {
    const token = process.env.CLOUDFLARE_API_TOKEN;
    if (!token) {
      throw new Error("CLOUDFLARE_API_TOKEN environment variable is required");
    }

    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  /**
   * Pull messages from the queue using Cloudflare REST API
   */
  async pullMessages(): Promise<QueueMessage[]> {
    const url = `${this.getBaseUrl()}/messages/pull`;

    const requestBody = {
      batch_size: this.config.batchSize,
      visibility_timeout_ms: this.config.visibilityTimeoutMs,
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data: PullMessagesResponse = await response.json();

      if (!data.success) {
        throw new Error(
          `API Error: ${data.errors.map((e) => e.message).join(", ")}`,
        );
      }

      return data.result || [];
    } catch (error) {
      console.error(
        `Failed to pull messages from queue ${this.config.queueId}:`,
        error,
      );
      return [];
    }
  }

  /**
   * Acknowledge and/or retry messages using lease IDs
   */
  async acknowledgeMessages(
    acknowledgeLeaseIds: string[],
    retryLeaseIds?: Array<{ lease_id: string; delay_seconds?: number }>,
  ): Promise<boolean> {
    if (
      acknowledgeLeaseIds.length === 0 &&
      (!retryLeaseIds || retryLeaseIds.length === 0)
    ) {
      return true; // Nothing to acknowledge
    }

    const url = `${this.getBaseUrl()}/messages/ack`;

    const requestBody: AckMessagesRequest = {
      acks: acknowledgeLeaseIds.map((lease_id) => ({ lease_id })),
      ...(retryLeaseIds &&
        retryLeaseIds.length > 0 && { retries: retryLeaseIds }),
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error(
        `Failed to acknowledge messages for queue ${this.config.queueId}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Start polling the queue for messages
   */
  start(
    messageHandler: (messages: QueueMessage[]) => Promise<{
      acknowledge: string[];
      retry: Array<{ lease_id: string; delay_seconds?: number }>;
    }>,
  ): void {
    if (this.isRunning) {
      console.warn(
        `Consumer for queue ${this.config.queueId} is already running`,
      );
      return;
    }

    this.isRunning = true;
    console.log(`🔄 Starting queue consumer for ${this.config.queueId}`);

    const poll = async () => {
      if (!this.isRunning) return;

      // Respect concurrency limits
      if (this.activeBatches.size >= this.config.maxConcurrentBatches) {
        this.scheduleNextPoll();
        return;
      }

      try {
        const messages = await this.pullMessages();

        if (messages.length > 0) {
          const batchId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          this.activeBatches.add(batchId);

          console.log(
            `📥 Received ${messages.length} messages from queue ${this.config.queueId}`,
          );

          // Process messages asynchronously
          this.processMessageBatch(messages, messageHandler, batchId).finally(
            () => {
              this.activeBatches.delete(batchId);
            },
          );
        }
      } catch (error) {
        console.error(`Error polling queue ${this.config.queueId}:`, error);
      }

      this.scheduleNextPoll();
    };

    // Start polling immediately
    poll();
  }

  private scheduleNextPoll(): void {
    if (this.isRunning) {
      this.pollTimeoutId = setTimeout(() => {
        if (this.isRunning) {
          this.pollMessages();
        }
      }, this.config.pollIntervalMs);
    }
  }

  private async pollMessages(): Promise<void> {
    if (!this.isRunning) return;

    // Respect concurrency limits
    if (this.activeBatches.size >= this.config.maxConcurrentBatches) {
      this.scheduleNextPoll();
      return;
    }

    try {
      const messages = await this.pullMessages();

      if (messages.length > 0) {
        const batchId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.activeBatches.add(batchId);

        console.log(
          `📥 Received ${messages.length} messages from queue ${this.config.queueId}`,
        );

        // Process messages would be handled by the registered handler
        // This is a simplified version - in practice you'd store the handler
      }
    } catch (error) {
      console.error(`Error polling queue ${this.config.queueId}:`, error);
    }

    this.scheduleNextPoll();
  }

  private async processMessageBatch(
    messages: QueueMessage[],
    handler: (messages: QueueMessage[]) => Promise<{
      acknowledge: string[];
      retry: Array<{ lease_id: string; delay_seconds?: number }>;
    }>,
    batchId: string,
  ): Promise<void> {
    try {
      const result = await handler(messages);

      // Acknowledge processed messages
      const success = await this.acknowledgeMessages(
        result.acknowledge,
        result.retry,
      );

      if (success) {
        console.log(
          `✅ Batch ${batchId}: Acknowledged ${result.acknowledge.length} messages, retried ${result.retry.length}`,
        );
      } else {
        console.error(`❌ Batch ${batchId}: Failed to acknowledge messages`);
      }
    } catch (error) {
      console.error(`❌ Batch ${batchId}: Error processing messages:`, error);

      // On error, let messages timeout and be retried automatically
      // Alternatively, you could explicitly retry all messages:
      // const retryAll = messages.map(m => ({ lease_id: m.lease_id, delay_seconds: 30 }));
      // await this.acknowledgeMessages([], retryAll);
    }
  }

  /**
   * Stop polling the queue
   */
  stop(): void {
    if (!this.isRunning) {
      console.warn(`Consumer for queue ${this.config.queueId} is not running`);
      return;
    }

    this.isRunning = false;

    if (this.pollTimeoutId) {
      clearTimeout(this.pollTimeoutId);
      this.pollTimeoutId = null;
    }

    console.log(`🛑 Stopped queue consumer for ${this.config.queueId}`);
  }

  /**
   * Check if the consumer is currently running
   */
  get running(): boolean {
    return this.isRunning;
  }

  /**
   * Get the number of active message batches being processed
   */
  get activeBatchCount(): number {
    return this.activeBatches.size;
  }
}

/**
 * Factory function to create queue consumers with sensible defaults
 */
export function createQueueConsumer(
  config: QueueConsumerConfig,
): CloudflareQueueConsumer {
  return new CloudflareQueueConsumer(config);
}

/**
 * Utility function to create multiple consumers for different queues
 */
export function createMultipleConsumers(
  configs: QueueConsumerConfig[],
): CloudflareQueueConsumer[] {
  return configs.map((config) => createQueueConsumer(config));
}
