import { AiModelSettingsView } from 'src/sections/ai-model-settings';

// ----------------------------------------------------------------------

type Props = {
  params: Promise<{ id: string }>;
};

export const metadata = {
  title: 'Dashboard: Modelos de IA',
};

export default async function AiModelSettingsPage({ params }: Props) {
  const { id } = await params;

  return <AiModelSettingsView providerId={id} />;
}
