"use client";

import { Button } from "@web42-ai/ui/button";
import { Send, Sparkles } from "lucide-react";
import AIMessage from "./AIMessage";
import UserMessage from "./UserMessage";

interface MessageData {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatPanelProps {
  messages: MessageData[];
  inputMessage: string;
  isGenerating: boolean;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

export default function ChatPanel({
  messages,
  inputMessage,
  isGenerating,
  onInputChange,
  onSendMessage,
  onKeyPress,
}: ChatPanelProps) {
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

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <textarea
            value={inputMessage}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyPress={onKeyPress}
            placeholder="Describe the site you want to build..."
            className="flex-1 min-h-[80px] resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isGenerating}
          />
          <Button
            onClick={onSendMessage}
            disabled={!inputMessage.trim() || isGenerating}
            size="icon"
            className="self-end"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}