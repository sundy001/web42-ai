import AIBuilderClient from "./AIBuilderClient";
import AIBuilderHeader from "./AIBuilderHeader";

interface AIBuilderPageProps {
  params: Promise<{ app_id: string }>;
}

export default async function AIBuilderPage({ params }: AIBuilderPageProps) {
  const { app_id } = await params;

  return (
    <div className="h-screen flex flex-col bg-background">
      <AIBuilderHeader appId={app_id} />
      <AIBuilderClient className="flex-1 overflow-hidden" />
    </div>
  );
}
