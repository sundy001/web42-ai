import { createSSEStream } from "@/server/createSSEStream";
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

    return createSSEStream(userMessage, request);
  } catch (error) {
    console.error("Error in see-demo GET endpoint:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
