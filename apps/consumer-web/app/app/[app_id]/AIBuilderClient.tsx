"use client";

import ResizablePanels, {
  LeftPanel,
  RightPanel,
} from "@/components/ResizablePanels";
import ChatPanel from "./ChatPanel";
import SitePreviewPanel from "./SitePreviewPanel";

interface MessageData {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface AIBuilderClientProps {
  appId: string;
}

export default function AIBuilderClient({ appId }: AIBuilderClientProps) {
  return (
    <ResizablePanels
      defaultLeftWidth={50}
      minLeftWidth={250}
      maxLeftWidth={690}
    >
      <LeftPanel>
        <ChatPanel />
      </LeftPanel>
      <RightPanel>
        <SitePreviewPanel />
      </RightPanel>
    </ResizablePanels>
  );
}
