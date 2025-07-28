"use client";

import { showError, showWarning } from "@/lib/utils/toast";
import { Button } from "@web42-ai/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@web42-ai/ui/card";
import { Input } from "@web42-ai/ui/input";
import { useState } from "react";

export default function ApiTestPage() {
  const [message, setMessage] = useState("");
  const [webhookMessage, setWebhookMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<string[]>([]);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const [sending, setSending] = useState(false);

  const startStreaming = () => {
    if (!message.trim()) {
      showWarning("Please enter a message");
      return;
    }

    try {
      // Create EventSource with the message as a query parameter
      const encodedMessage = encodeURIComponent(message.trim());
      const eventSourceUrl = `/api/see-demo?message=${encodedMessage}`;

      const newEventSource = new EventSource(eventSourceUrl);
      setEventSource(newEventSource);
      setIsConnected(true);
      setEvents([]);

      // Handle incoming messages
      newEventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          const timestamp = new Date().toLocaleTimeString();
          const eventType =
            parsed.type === "webhook-message"
              ? "WEBHOOK"
              : parsed.type.toUpperCase();
          setEvents((prev) => [
            ...prev,
            `[${timestamp}] ${eventType}: ${parsed.message || "Connection/Status message"}`,
          ]);

          // Close connection if we receive an 'end' or 'timeout' event
          if (parsed.type === "end" || parsed.type === "timeout") {
            newEventSource.close();
            setEventSource(null);
            setIsConnected(false);
          }
        } catch (e) {
          console.error("Failed to parse SSE data:", e);
          const timestamp = new Date().toLocaleTimeString();
          setEvents((prev) => [
            ...prev,
            `[${timestamp}] Raw data: ${event.data}`,
          ]);
        }
      };

      // Handle connection open
      newEventSource.onopen = () => {
        console.log("EventSource connection opened");
      };

      // Handle errors
      newEventSource.onerror = (error) => {
        console.error("EventSource error:", error);
        const timestamp = new Date().toLocaleTimeString();
        setEvents((prev) => [
          ...prev,
          `[${timestamp}] Connection error occurred`,
        ]);

        // Close the connection on error
        newEventSource.close();
        setEventSource(null);
        setIsConnected(false);
      };
    } catch (error) {
      console.error("Failed to create EventSource:", error);
      setIsConnected(false);
      showError("Failed to connect to the API");
    }
  };

  const sendWebhookMessage = async () => {
    if (!webhookMessage.trim()) return;

    setSending(true);
    try {
      const response = await fetch("/api/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: webhookMessage,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Webhook response:", result);
        setWebhookMessage("");
      } else {
        console.error("Webhook failed:", response.statusText);
      }
    } catch (error) {
      console.error("Failed to send webhook:", error);
    } finally {
      setSending(false);
    }
  };

  const stopStreaming = () => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }
    setIsConnected(false);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">
            API Test - EventBridge Integration
          </h1>
          <p className="text-muted-foreground">
            Test the eventBridge integration between webhook and see-demo
            endpoints
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>See-Demo SSE Connection</CardTitle>
              <CardDescription>
                Connect to see-demo endpoint to receive webhook messages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter connection identifier..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={isConnected}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !isConnected && startStreaming()
                  }
                />
                <Button
                  onClick={isConnected ? stopStreaming : startStreaming}
                  variant={isConnected ? "destructive" : "default"}
                >
                  {isConnected ? "Disconnect" : "Connect"}
                </Button>
              </div>

              {isConnected && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Connected - Listening for webhook messages
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Send Webhook Message</CardTitle>
              <CardDescription>
                Send messages via webhook that will appear in the SSE stream
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter webhook message..."
                  value={webhookMessage}
                  onChange={(e) => setWebhookMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendWebhookMessage()}
                />
                <Button
                  onClick={sendWebhookMessage}
                  disabled={sending || !webhookMessage.trim()}
                >
                  {sending ? "Sending..." : "Send"}
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                Messages sent here will appear in the SSE stream if connected
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Events Log</CardTitle>
            <CardDescription>Real-time events from the server</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-md max-h-96 overflow-y-auto">
              {events.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No events yet. Send a message to start receiving events.
                </p>
              ) : (
                <div className="space-y-1">
                  {events.map((event, index) => (
                    <div key={index} className="text-sm font-mono">
                      {event}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>EventBridge Integration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>How it works:</strong>
              <ol className="list-decimal list-inside ml-4 space-y-1">
                <li>Connect to the see-demo SSE endpoint with an identifier</li>
                <li>Send messages via the webhook endpoint</li>
                <li>
                  Messages are broadcast to all connected SSE clients via
                  EventEmitter
                </li>
                <li>See real-time message delivery across endpoints</li>
              </ol>
            </div>
            <div>
              <strong>Endpoints:</strong>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>
                  <code className="bg-muted px-2 py-1 rounded">
                    GET /api/see-demo?message=identifier
                  </code>{" "}
                  (SSE connection)
                </li>
                <li>
                  <code className="bg-muted px-2 py-1 rounded">
                    POST /api/webhook
                  </code>{" "}
                  (send messages)
                </li>
                <li>
                  <code className="bg-muted px-2 py-1 rounded">
                    GET /api/sse
                  </code>{" "}
                  (alternative SSE endpoint)
                </li>
              </ul>
            </div>
            <div>
              <strong>Webhook Body:</strong>{" "}
              <code className="bg-muted px-2 py-1 rounded">{`{"message": "your message here"}`}</code>
            </div>
            <div>
              <strong>Event Types:</strong>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>
                  <code>connected</code> - Initial connection confirmation
                </li>
                <li>
                  <code>webhook-message</code> - Messages from webhook endpoint
                </li>
                <li>
                  <code>heartbeat</code> - Keep-alive messages every 30 seconds
                </li>
                <li>
                  <code>timeout</code> - Connection timeout after 5 minutes
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
