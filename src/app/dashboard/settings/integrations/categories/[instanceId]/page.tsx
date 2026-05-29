import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { IntegrationsCategorieView } from 'src/sections/integrations/view'

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Integrations | Category Listing - ${CONFIG.appName}` };

type Props = {
  params: Promise<{ instanceId: string }>;
};

export default async function Page({ params }: Props) {
  const { instanceId } = await params;
  
  return <IntegrationsCategorieView instanceId={instanceId} />;
}