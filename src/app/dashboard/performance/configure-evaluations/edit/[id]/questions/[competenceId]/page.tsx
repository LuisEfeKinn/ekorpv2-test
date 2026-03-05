import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ConfigureQuestionsView } from 'src/sections/performance/configure-evaluations/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Edit Configure Evaluations - ${CONFIG.appName}` };
type Props = {
  params: Promise<{ id: string, competenceId: string }>;
};

export default async function Page({ params }: Props) {
  const { id, competenceId } = await params;
  
  return <ConfigureQuestionsView campaignId={id} competenceId={competenceId} />;
}