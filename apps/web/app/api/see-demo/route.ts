import { eventBridge, WebhookMessage } from "@/server/eventBridge";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get message from query parameters
    const { searchParams } = new URL(request.url);
    const userMessage = searchParams.get("message");

    // Validate that we have a message parameter
    if (!userMessage || typeof userMessage !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid message query parameter" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Set up Server-Sent Events headers
    const headers = new Headers({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type",
    });

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      start(controller) {
        let isClosed = false;
        let heartbeatInterval: NodeJS.Timeout | null = null;
        let removeMessageListener: (() => void) | null = null;

        // Helper function to safely enqueue data
        const safeEnqueue = (data: string) => {
          if (isClosed) {
            return;
          }

          try {
            controller.enqueue(new TextEncoder().encode(data));
          } catch (error) {
            console.error("Failed to enqueue see-demo SSE data:", error);
            isClosed = true;
          }
        };

        // Clean up function
        const cleanup = () => {
          if (isClosed) return;

          isClosed = true;

          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
          }

          // Remove the message listener
          if (removeMessageListener) {
            removeMessageListener();
          }

          try {
            controller.close();
          } catch {
            // Controller might already be closed, ignore the error
            console.log("See-demo SSE Controller already closed");
          }
        };

        // Send initial connection message with the user's message
        safeEnqueue(
          `data: ${JSON.stringify({
            type: "connected",
            message: `Connected to see-demo endpoint. Listening for messages related to: "${userMessage}"`,
            userMessage: userMessage,
            timestamp: new Date().toISOString(),
          })}\n\n`,
        );

        // Set up heartbeat to keep connection alive
        heartbeatInterval = setInterval(() => {
          if (isClosed) return;

          safeEnqueue(
            `data: ${JSON.stringify({
              type: "heartbeat",
              userMessage: userMessage,
              timestamp: new Date().toISOString(),
            })}\n\n`,
          );
        }, 30000); // Send heartbeat every 30 seconds

        // Set up message listener for webhook messages
        const messageListener = (message: WebhookMessage) => {
          if (isClosed) return;

          // Forward all webhook messages to this see-demo stream
          safeEnqueue(
            `data: ${JSON.stringify({
              type: "webhook-message",
              id: message.id,
              message: message.message,
              userMessage: userMessage,
              timestamp: message.timestamp,
            })}\n\n`,
          );
        };

        // Register the message listener and get cleanup function
        removeMessageListener = eventBridge.onMessage(messageListener);

        // Handle client disconnect
        request.signal.addEventListener("abort", cleanup);

        // Clean up after 5 minutes to prevent memory leaks
        setTimeout(
          () => {
            if (isClosed) return;

            safeEnqueue(
              `data: ${JSON.stringify({
                type: "timeout",
                message: "See-demo SSE connection timed out after 5 minutes",
                userMessage: userMessage,
                timestamp: new Date().toISOString(),
              })}\n\n`,
            );
            cleanup();
          },
          5 * 60 * 1000,
        ); // 5 minutes
      },
    });

    return new Response(stream, { headers });
  } catch (error) {
    console.error("Error in see-demo GET endpoint:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
