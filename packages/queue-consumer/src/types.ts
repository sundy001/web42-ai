import type { ConsumerOptions } from "./utils/validation.js";

/**
 * A subset of the ConsumerOptions that can be updated at runtime.
 */
export type UpdatableOptions =
  | "visibilityTimeoutMs"
  | "batchSize"
  | "pollingWaitTimeMs";

/**
 * The options for the stop method.
 */
export interface StopOptions {
  /**
   * Default to `false`, if you want the stop action to also abort requests to SQS
   * set this to `true`.
   * @defaultvalue `false`
   */
  abort?: boolean;
}

export type Message = {
  body: string;
  id: string;
  timestamp_ms: number;
  attempts: number;
  lease_id: string;
  metadata: {
    "CF-sourceMessageSource": string;
    "CF-Content-Type": "json" | "text";
  };
};

export type CloudFlareError = {
  code: number;
  message: string;
};

export type CloudFlareResultInfo = {
  page: number;
  per_page: number;
  total_pages: number;
  count: number;
  total_count: number;
};

export type PullMessagesResponse = {
  errors: CloudFlareError[];
  messages: CloudFlareError[];
  result: {
    messages: Message[];
  };
  success: boolean;
  result_info: CloudFlareResultInfo;
};

export type AckMessageResponse = {
  errors: CloudFlareError[];
  messages: CloudFlareError[];
  result: {
    ackCount: number;
    retryCount: number;
    warnings: string[];
  };
  success: boolean;
  result_info: CloudFlareResultInfo;
};

/**
 * These are the events that the consumer emits.
 */
export interface Events {
  /**
   * Fired after one batch of items (up to `batchSize`) has been successfully processed.
   */
  response_processed: [];
  /**
   * Fired when the queue is empty (All messages have been consumed).
   */
  empty: [];
  /**
   * Fired when a message is received.
   */
  message_received: [Message];
  /**
   * Fired when a message is successfully processed and removed from the queue.
   */
  message_processed: [Message];
  /**
   * Fired when an error occurs interacting with the queue.
   *
   * If the error correlates to a message, that message is included in Params
   */
  error: [Error, void | Message | Message[]];
  /**
   * Fired when `handleMessageTimeout` is supplied as an option and if
   * `handleMessage` times out.
   */
  timeout_error: [Error, Message];
  /**
   * Fired when an error occurs processing the message.
   */
  processing_error: [Error, Message];
  /**
   * Fired when requests to Cloudflare were aborted.
   */
  aborted: [];
  /**
   * Fired when the consumer starts its work..
   */
  started: [];
  /**
   * Fired when the consumer finally stops its work.
   */
  stopped: [];
  /**
   * Fired when messages are acknowledging
   */
  acknowledging_messages: [
    {
      lease_id: string;
    }[],
    {
      lease_id: string;
      delay_seconds: number;
    }[],
  ];
  /**
   * Fired when messages have been acknowledged
   */
  acknowledged_messages: [
    {
      ackCount: number;
      retryCount: number;
      warnings: string[];
    },
  ];
  /**
   * Fired when an option is updated
   */
  option_updated: [UpdatableOptions, ConsumerOptions[UpdatableOptions]];
}
