'use client';

import { useState, useEffect, useRef } from 'react';

export default function WebhookTestPage() {
  const [messages, setMessages] = useState<Array<{
    type: string;
    message?: string;
    id?: string;
    timestamp: string;
  }>>([]);
  const [connected, setConnected] = useState(false);
  const [webhookMessage, setWebhookMessage] = useState('');
  const [sending, setSending] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Connect to SSE endpoint
  useEffect(() => {
    const eventSource = new EventSource('/api/sse');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setConnected(true);
      console.log('SSE connection opened');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMessages(prev => [...prev, data]);
      } catch (error) {
        console.error('Failed to parse SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      setConnected(false);
    };

    return () => {
      eventSource.close();
      setConnected(false);
    };
  }, []);

  // Send message to webhook
  const sendWebhookMessage = async () => {
    if (!webhookMessage.trim()) return;

    setSending(true);
    try {
      const response = await fetch('/api/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: webhookMessage,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Webhook response:', result);
        setWebhookMessage('');
      } else {
        console.error('Webhook failed:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to send webhook:', error);
    } finally {
      setSending(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Webhook to SSE Test
        </h1>

        {/* Connection Status */}
        <div className="mb-6 p-4 rounded-lg bg-white shadow">
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                connected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="font-medium">
              SSE Connection: {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Webhook Form */}
        <div className="mb-6 p-6 rounded-lg bg-white shadow">
          <h2 className="text-xl font-semibold mb-4">Send Webhook Message</h2>
          <div className="flex space-x-4">
            <input
              type="text"
              value={webhookMessage}
              onChange={(e) => setWebhookMessage(e.target.value)}
              placeholder="Enter message to send via webhook..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && sendWebhookMessage()}
            />
            <button
              onClick={sendWebhookMessage}
              disabled={sending || !webhookMessage.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="p-6 rounded-lg bg-white shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              SSE Messages ({messages.length})
            </h2>
            <button
              onClick={clearMessages}
              className="px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Clear
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-gray-500 italic">
                No messages yet. Send a webhook message to see it appear here.
              </p>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`p-3 rounded border-l-4 ${
                    msg.type === 'webhook-message'
                      ? 'bg-green-50 border-l-green-500'
                      : msg.type === 'connected'
                      ? 'bg-blue-50 border-l-blue-500'
                      : msg.type === 'heartbeat'
                      ? 'bg-gray-50 border-l-gray-400'
                      : 'bg-yellow-50 border-l-yellow-500'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium text-sm text-gray-600">
                        {msg.type.toUpperCase()}
                      </span>
                      {msg.id && (
                        <span className="ml-2 text-xs text-gray-500">
                          ID: {msg.id}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {msg.message && (
                    <p className="mt-1 text-gray-800">{msg.message}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">How to test:</h3>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Verify the SSE connection is established (green dot above)</li>
            <li>2. Type a message in the input field</li>
            <li>3. Click &quot;Send&quot; or press Enter</li>
            <li>4. Watch the message appear in real-time via SSE</li>
          </ol>
        </div>
      </div>
    </div>
  );
}