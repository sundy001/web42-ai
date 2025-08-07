import ResizablePanels from "@/components/ResizablePanels";
import { getMessages } from "@/lib/api/messages";
import AIBuilderHeader from "./AIBuilderHeader";
import ChatPanel from "./ChatPanel";
import SitePreviewPanel from "./SitePreviewPanel";

interface AIBuilderPageProps {
  params: Promise<{ app_id: string }>;
}

export default async function AIBuilderPage({ params }: AIBuilderPageProps) {
  const { app_id } = await params;

  const { messages } = await getMessages({ projectId: app_id, limit: 10 });

  return (
    <div className="h-screen flex flex-col bg-background">
      <AIBuilderHeader appId={app_id} />
      <ResizablePanels
        className="flex-1 overflow-hidden"
        defaultLeftWidth={50}
        minLeftWidth={250}
        maxLeftWidth={690}
      >
        <ChatPanel defaultMessages={messages} />
        <SitePreviewPanel />
      </ResizablePanels>
    </div>
  );
}
