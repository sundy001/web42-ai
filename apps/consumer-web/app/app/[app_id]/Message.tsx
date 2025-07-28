"use client";

import { getTimeAgo } from "@/lib/timeAgo";
import { Sparkles } from "lucide-react";

interface MessageProps {
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export default function Message({ content, isUser, timestamp }: MessageProps) {
  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-lg px-4 py-2 bg-primary text-primary-foreground">
          <p className="text-sm">{content}</p>
          <p className="text-xs opacity-70 mt-1">{getTimeAgo(timestamp)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">Web42</span>
            <span className="text-xs text-muted-foreground">{getTimeAgo(timestamp)}</span>
          </div>
          <div className="text-sm text-foreground">{content}</div>
        </div>
      </div>
    </div>
  );
}
