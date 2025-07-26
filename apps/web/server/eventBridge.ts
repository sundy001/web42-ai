import { EventEmitter } from "events";

export interface WebhookMessage {
  id: string;
  message: string;
  timestamp: string;
}

// Create a singleton EventEmitter instance to bridge webhook and SSE
class EventBridge extends EventEmitter {
  private static instance: EventBridge;

  private constructor() {
    super();
    // Set max listeners to handle multiple SSE connections
    this.setMaxListeners(100);
  }

  static getInstance(): EventBridge {
    if (!EventBridge.instance) {
      EventBridge.instance = new EventBridge();
    }
    return EventBridge.instance;
  }

  // Method for webhook to send messages
  sendMessage(message: WebhookMessage): void {
    this.emit("webhook-message", message);
  }

  // Method for SSE to listen for messages
  onMessage(callback: (message: WebhookMessage) => void): () => void {
    this.on("webhook-message", callback);

    // Return cleanup function
    return () => {
      this.off("webhook-message", callback);
    };
  }

  // Get current listener count for debugging
  getListenerCount(): number {
    return this.listenerCount("webhook-message");
  }
}

export const eventBridge = EventBridge.getInstance();
