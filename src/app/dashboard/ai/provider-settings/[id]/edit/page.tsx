import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { AiProviderSettingsEditView } from 'src/sections/ai-provider-settings/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Edit AI Provider Setting - ${CONFIG.appName}` };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;

  return <AiProviderSettingsEditView id={id} />;
};