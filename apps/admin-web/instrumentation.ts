/**
 * Next.js Instrumentation Hook
 * This file runs when the Next.js server starts up
 * Used for initializing server-side recurring tasks and pull queue consumers
 */

interface QueueMessage {
  id: string;
  timestamp: string;
  body: any;
  attempts: number;
}

interface QueuePullResponse {
  success: boolean;
  messages: QueueMessage[];
  result_info?: {
    count: number;
  };
}

class CloudflareQueuePullConsumer {
  private isPolling = false;
  private pollInterval?: NodeJS.Timeout;

  constructor(
    private accountId: string,
    private queueId: string,
    private token: string,
  ) {}

  async pullMessages(maxMessages = 10): Promise<QueueMessage[]> {
    const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/queues/${this.queueId}/messages/pull`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          max_messages: maxMessages,
          visibility_timeout_ms: 30000, // 30 seconds
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Pull Consumer - HTTP ${response.status}: ${errorText}`,
        );
      }

      const data: QueuePullResponse = await response.json();
      return data.success ? data.messages : [];
    } catch (error) {
      console.error(
        `[Pull Consumer] Error pulling messages from queue ${this.queueId}:`,
        error,
      );
      return [];
    }
  }

  async acknowledgeMessage(messageId: string): Promise<boolean> {
    const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/queues/${this.queueId}/messages/ack`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          acks: [{ id: messageId }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Pull Consumer - HTTP ${response.status}: ${errorText}`,
        );
      }

      return response.ok;
    } catch (error) {
      console.error(
        `[Pull Consumer] Error acknowledging message ${messageId} from queue ${this.queueId}:`,
        error,
      );
      return false;
    }
  }

  async processMessage(message: QueueMessage): Promise<void> {
    try {
      console.log(`Processing message ${message.id}:`, message.body);

      // TODO: Add your message processing logic here
      // This is where you handle different message types

      // For now, just log the message
      console.log(
        `[Pull Consumer] Message processed successfully: ${message.id}`,
      );

      // Acknowledge the message after successful processing
      await this.acknowledgeMessage(message.id);
    } catch (error) {
      console.error(
        `[Pull Consumer] Error processing message ${message.id} from queue ${this.queueId}:`,
        error,
      );
      // Don't acknowledge failed messages - they will be retried
    }
  }

  startPolling(intervalMs = 5000): void {
    if (this.isPolling) {
      console.warn(
        `[Pull Consumer] Queue polling is already running for queue ${this.queueId}`,
      );
      return;
    }

    this.isPolling = true;
    console.log(
      `🔄 [Pull Consumer] Starting queue polling for ${this.queueId} every ${intervalMs}ms`,
    );

    this.pollInterval = setInterval(async () => {
      try {
        const messages = await this.pullMessages();

        if (messages.length > 0) {
          console.log(
            `📥 [Pull Consumer] Received ${messages.length} messages from queue ${this.queueId}`,
          );

          // Process messages concurrently
          await Promise.allSettled(
            messages.map((message) => this.processMessage(message)),
          );
        }
      } catch (error) {
        console.error(
          `[Pull Consumer] Error during queue polling for ${this.queueId}:`,
          error,
        );
      }
    }, intervalMs);
  }

  stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = undefined;
    }
    this.isPolling = false;
    console.log(`⏹️ [Pull Consumer] Queue polling stopped for ${this.queueId}`);
  }
}

export async function register() {
  // Only run on Node.js runtime (not Edge runtime)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log(
      "🚀 Instrumentation: Server started, initializing recurring tasks...",
    );

    // Initialize Cloudflare Queue Pull Consumer
    const accountId = process.env.CF_ACCOUNT_ID;
    const queueId = process.env.CF_QUEUE_PULL_ID;
    const token = process.env.CF_QUEUE_PULL_TOKEN;

    if (accountId && queueId && token) {
      console.log(
        `🔌 [Pull Consumer] Initializing Cloudflare Queue Pull Consumer for queue ${queueId}...`,
      );

      const queueConsumer = new CloudflareQueuePullConsumer(
        accountId,
        queueId,
        token,
      );

      // Start polling every 5 seconds
      queueConsumer.startPolling(5000);

      // Graceful shutdown handling
      const cleanup = () => {
        console.log(
          `🛑 [Pull Consumer] Shutting down queue consumer for ${queueId}...`,
        );
        queueConsumer.stopPolling();
      };

      process.on("SIGTERM", cleanup);
      process.on("SIGINT", cleanup);

      console.log(
        `✅ [Pull Consumer] Queue consumer initialized successfully for queue ${queueId}`,
      );
    } else {
      console.warn(
        "⚠️ [Pull Consumer] Missing Cloudflare Queue credentials - queue consumer not initialized",
      );
    }

    console.log("✅ Instrumentation: Recurring tasks initialized successfully");
  }
}

// Optional: Export an onRequestError handler for error tracking
export async function onRequestError(
  error: { digest?: string } & Error,
  request: {
    path: string;
    method: string;
    headers: { [key: string]: string };
  },
) {
  console.error(`Request error on ${request.method} ${request.path}:`, error);
  // You can send errors to external monitoring services here
  // await sendToErrorTracking(error, request);
}
