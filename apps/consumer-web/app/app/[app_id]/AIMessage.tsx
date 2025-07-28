"use client";

import { getTimeAgo } from "@/lib/timeAgo";
import { Sparkles } from "lucide-react";

interface AIMessageProps {
  content: string;
  timestamp: Date;
}

export default function AIMessage({ content, timestamp }: AIMessageProps) {
  return (
    <div className="w-full">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">Web42</span>
            <span className="text-xs text-muted-foreground">
              {getTimeAgo(timestamp)}
            </span>
          </div>
          <div className="text-sm text-foreground">{content}</div>
        </div>
      </div>
    </div>
  );
}
