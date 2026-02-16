import { AiModelSettingsCreateView } from 'src/sections/ai-model-settings';

// ----------------------------------------------------------------------

type Props = {
  params: Promise<{ id: string }>;
};

export const metadata = {
  title: 'Dashboard: Nuevo Modelo de IA',
};

export default async function AiModelSettingsCreatePage({ params }: Props) {
  const { id } = await params;

  return <AiModelSettingsCreateView providerId={id} />;
}
