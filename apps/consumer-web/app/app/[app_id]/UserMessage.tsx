"use client";

import { getTimeAgo } from "@/lib/timeAgo";

interface UserMessageProps {
  content: string;
  timestamp: Date;
}

export default function UserMessage({ content, timestamp }: UserMessageProps) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-lg px-4 py-2 bg-primary text-primary-foreground">
        <p className="text-sm">{content}</p>
        <p className="text-xs opacity-70 mt-1">{getTimeAgo(timestamp)}</p>
      </div>
    </div>
  );
}
