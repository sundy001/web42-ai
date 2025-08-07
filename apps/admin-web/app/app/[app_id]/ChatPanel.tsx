"use client";

import type { Message } from "@web42-ai/types";
import { Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import AIMessage from "./AIMessage";
import ChatInput from "./ChatInput";
import UserMessage from "./UserMessage";

interface ChatPanelProps {
  defaultMessages?: Message[];
}

export default function ChatPanel({ defaultMessages }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (defaultMessages && defaultMessages.length > 0) {
      return defaultMessages;
    }
    return [
      {
        id: "welcome",
        role: "assistant",
        contentType: "text",
        content:
          "Hi! I'm your AI assistant. Describe the site you'd like to build and I'll help you create it.",
        createdAt: new Date().toISOString(),
      },
    ];
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [shouldAutoFocus, setShouldAutoFocus] = useState(false);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      contentType: "text",
      content: message,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setIsGenerating(true);
    setShouldAutoFocus(true);

    // Create abort controller for this request
    const controller = new AbortController();
    setAbortController(controller);

    // Simulate AI response
    const timeoutId = setTimeout(() => {
      if (!controller.signal.aborted) {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          contentType: "text",
          content:
            "Great idea! I'm working on creating that for you. Let me generate the code and preview...",
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiResponse]);
        setIsGenerating(false);
        setShouldAutoFocus(false);
        setAbortController(null);
      }
    }, 1500);

    // Store timeout ID for cleanup
    controller.signal.addEventListener("abort", () => {
      clearTimeout(timeoutId);
      setIsGenerating(false);
      setShouldAutoFocus(false);
      setAbortController(null);
    });
  };

  const handleAbort = () => {
    if (abortController) {
      abortController.abort();
    }
  };

  return (
    <>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) =>
          message.role === "user" ? (
            <UserMessage
              key={message.id}
              content={message.content}
              timestamp={new Date(message.createdAt)}
            />
          ) : (
            <AIMessage
              key={message.id}
              content={message.content}
              timestamp={new Date(message.createdAt)}
            />
          ),
        )}
        {isGenerating && (
          <div className="w-full">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">Web42</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="animate-pulse flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    AI is thinking...
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        isGenerating={isGenerating}
        onSendMessage={handleSendMessage}
        onAbort={handleAbort}
        autoFocus={shouldAutoFocus}
      />
    </>
  );
}
