"use client";

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
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<string[]>([]);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  const startStreaming = () => {
    if (!message.trim()) {
      alert("Please enter a message");
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
          setEvents((prev) => [
            ...prev,
            `[${timestamp}] ${parsed.type}: ${parsed.message}`,
          ]);

          // Close connection if we receive an 'end' event
          if (parsed.type === "end") {
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
      alert("Failed to connect to the API");
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
          <h1 className="text-3xl font-bold">API Test - See Demo Endpoint</h1>
          <p className="text-muted-foreground">
            Test the /api/see-demo endpoint with Server-Sent Events
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Send Message</CardTitle>
            <CardDescription>
              Enter a message to echo every 2 seconds via Server-Sent Events
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter your message..."
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
                {isConnected ? "Stop" : "Start"}
              </Button>
            </div>

            {isConnected && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Connected - Receiving events every 2 seconds
              </div>
            )}
          </CardContent>
        </Card>

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
            <CardTitle>API Documentation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <strong>Endpoints:</strong>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>
                  <code className="bg-muted px-2 py-1 rounded">
                    GET /api/see-demo?message=your_message
                  </code>{" "}
                  (for EventSource)
                </li>
                <li>
                  <code className="bg-muted px-2 py-1 rounded">
                    POST /api/see-demo
                  </code>{" "}
                  with JSON body
                </li>
              </ul>
            </div>
            <div>
              <strong>POST Request Body:</strong>{" "}
              <code className="bg-muted px-2 py-1 rounded">{`{"message": "your message here"}`}</code>
            </div>
            <div>
              <strong>Response:</strong> Server-Sent Events stream that echoes
              the message every 2 seconds
            </div>
            <div>
              <strong>Event Types:</strong>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>
                  <code>connected</code> - Initial connection confirmation
                </li>
                <li>
                  <code>echo</code> - Your message echoed every 2 seconds
                </li>
                <li>
                  <code>end</code> - Stream ends after 30 seconds
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
