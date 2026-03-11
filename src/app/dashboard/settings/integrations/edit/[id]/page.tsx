import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { IntegrationsEditView } from 'src/sections/integrations/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Edit Integration - ${CONFIG.appName}` };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;

  return <IntegrationsEditView id={id} />;
}