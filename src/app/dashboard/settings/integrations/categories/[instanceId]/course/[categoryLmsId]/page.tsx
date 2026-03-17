import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { IntegrationsCourseView } from 'src/sections/integrations/view'

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Integrations | Course By Category Listing - ${CONFIG.appName}` };

type Props = {
  params: Promise<{ instanceId: string, categoryLmsId: string }>;
};

export default async function Page({ params }: Props) {
  const { instanceId, categoryLmsId } = await params;
  
  return <IntegrationsCourseView instanceId={instanceId} categoryLmsId={categoryLmsId} />;
}