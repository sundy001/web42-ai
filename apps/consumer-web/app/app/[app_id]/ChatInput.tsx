"use client";

import { Button } from "@web42-ai/ui/button";
import { Send } from "lucide-react";
import { useRef, useEffect } from "react";

interface ChatInputProps {
  inputMessage: string;
  isGenerating: boolean;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  autoFocus?: boolean;
}

export default function ChatInput({
  inputMessage,
  isGenerating,
  onInputChange,
  onSendMessage,
  onKeyPress,
  autoFocus = false,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div className="p-4 border-t">
      <div className="flex gap-2">
        <textarea
          ref={textareaRef}
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
  );
}