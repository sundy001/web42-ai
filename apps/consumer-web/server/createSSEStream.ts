import { NextRequest } from "next/server";

export function createSSEStream(userMessage: string, request: NextRequest) {
  // Set up Server-Sent Events headers
  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST",
    "Access-Control-Allow-Headers": "Content-Type",
  });

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      let isClosed = false;
      let interval: NodeJS.Timeout | null = null;
      let timeout: NodeJS.Timeout | null = null;

      // Helper function to safely enqueue data
      const safeEnqueue = (data: string) => {
        if (isClosed) {
          return;
        }

        try {
          controller.enqueue(new TextEncoder().encode(data));
        } catch (error) {
          console.error("Failed to enqueue data:", error);
          isClosed = true;
        }
      };

      // Clean up function
      const cleanup = () => {
        if (isClosed) return;

        isClosed = true;

        if (interval) {
          clearInterval(interval);
          interval = null;
        }

        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }

        try {
          controller.close();
        } catch {
          // Controller might already be closed, ignore the error
          console.log("Controller already closed");
        }
      };

      // Send initial connection message
      safeEnqueue(
        `data: ${JSON.stringify({
          type: "connected",
          message: "Connected to see-demo endpoint",
        })}\n\n`,
      );

      // Set up interval to echo the user message every 2 seconds
      interval = setInterval(() => {
        if (isClosed) return;

        const eventData = JSON.stringify({
          type: "echo",
          message: userMessage,
          timestamp: new Date().toISOString(),
        });

        safeEnqueue(`data: ${eventData}\n\n`);
      }, 2000);

      // Handle client disconnect
      request.signal.addEventListener("abort", cleanup);

      // Optional: Stop after 10 seconds to prevent infinite streaming
      timeout = setTimeout(() => {
        if (isClosed) return;

        safeEnqueue(
          `data: ${JSON.stringify({
            type: "end",
            message: "Stream ended after 10 seconds",
          })}\n\n`,
        );
        cleanup();
      }, 10000);
    },
  });

  return new Response(stream, { headers });
}
