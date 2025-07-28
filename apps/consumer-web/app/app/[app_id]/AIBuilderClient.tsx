"use client";

import ResizablePanels from "@/components/ResizablePanels";
import ChatPanel from "./ChatPanel";
import SitePreviewPanel from "./SitePreviewPanel";

interface AIBuilderClientProps {
  className?: string;
}

export default function AIBuilderClient({ className }: AIBuilderClientProps) {
  return (
    <ResizablePanels
      className={className}
      defaultLeftWidth={50}
      minLeftWidth={250}
      maxLeftWidth={690}
    >
      <ChatPanel />
      <SitePreviewPanel />
    </ResizablePanels>
  );
}
