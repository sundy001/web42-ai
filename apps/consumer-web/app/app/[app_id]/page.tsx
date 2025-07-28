import AIBuilderClient from './AIBuilderClient';

interface AIBuilderPageProps {
  params: Promise<{ app_id: string }>;
}

export default async function AIBuilderPage({ params }: AIBuilderPageProps) {
  const { app_id } = await params;
  
  return <AIBuilderClient appId={app_id} />;
}