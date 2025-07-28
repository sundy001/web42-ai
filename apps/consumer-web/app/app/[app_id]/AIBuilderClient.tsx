"use client";

import ResizablePanels from "@/components/ResizablePanels";
import ChatPanel from "./ChatPanel";
import SitePreviewPanel from "./SitePreviewPanel";

export default function AIBuilderClient() {
  return (
    <ResizablePanels
      defaultLeftWidth={50}
      minLeftWidth={250}
      maxLeftWidth={690}
    >
      <ChatPanel />
      <SitePreviewPanel />
    </ResizablePanels>
  );
}
