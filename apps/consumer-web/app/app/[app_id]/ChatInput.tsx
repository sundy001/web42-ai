"use client";

import { Button } from "@web42-ai/ui/button";
import { Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ChatInputProps {
  isGenerating: boolean;
  onSendMessage: (message: string) => void;
  onAbort?: () => void;
  autoFocus?: boolean;
}

export default function ChatInput({
  isGenerating,
  onSendMessage,
  onAbort,
  autoFocus = false,
}: ChatInputProps) {
  const [inputMessage, setInputMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGenerating) {
      onAbort?.();
      return;
    }
    if (!inputMessage.trim()) return;
    onSendMessage(inputMessage);
    setInputMessage("");
  };

  return (
    <div className="p-4 border-t">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <textarea
          ref={textareaRef}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Describe the site you want to build..."
          className="flex-1 min-h-[80px] resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.shiftKey) {
              // Allow Shift+Enter for new lines
              return;
            }
            if (e.key === "Enter") {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <Button
          type="submit"
          disabled={!isGenerating && !inputMessage.trim()}
          size="icon"
          className="self-end"
          variant="default"
        >
          {isGenerating ? (
            <X className="h-4 w-4" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
