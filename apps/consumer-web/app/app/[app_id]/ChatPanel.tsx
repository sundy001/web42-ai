"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import AIMessage from "./AIMessage";
import ChatInput from "./ChatInput";
import UserMessage from "./UserMessage";

interface MessageData {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export default function ChatPanel() {
  const [messages, setMessages] = useState<MessageData[]>([
    {
      id: "1",
      content:
        "Hi! I'm your AI assistant. Describe the site you'd like to build and I'll help you create it.",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [shouldAutoFocus, setShouldAutoFocus] = useState(false);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const newMessage: MessageData = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputMessage("");
    setIsGenerating(true);
    setShouldAutoFocus(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: MessageData = {
        id: (Date.now() + 1).toString(),
        content:
          "Great idea! I'm working on creating that for you. Let me generate the code and preview...",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsGenerating(false);
      setShouldAutoFocus(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) =>
          message.isUser ? (
            <UserMessage
              key={message.id}
              content={message.content}
              timestamp={message.timestamp}
            />
          ) : (
            <AIMessage
              key={message.id}
              content={message.content}
              timestamp={message.timestamp}
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
      </div>

      <ChatInput
        inputMessage={inputMessage}
        isGenerating={isGenerating}
        onInputChange={setInputMessage}
        onSendMessage={handleSendMessage}
        onKeyPress={handleKeyPress}
        autoFocus={shouldAutoFocus}
      />
    </>
  );
}
