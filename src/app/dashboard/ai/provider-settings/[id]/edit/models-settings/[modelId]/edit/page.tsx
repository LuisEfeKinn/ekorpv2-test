import { AiModelSettingsEditView } from 'src/sections/ai-model-settings';

// ----------------------------------------------------------------------

type Props = {
  params: Promise<{ id: string; modelId: string }>;
};

export const metadata = {
  title: 'Dashboard: Editar Modelo de IA',
};

export default async function AiModelSettingsEditPage({ params }: Props) {
  const { id, modelId } = await params;

  return <AiModelSettingsEditView providerId={id} modelId={modelId} />;
}
