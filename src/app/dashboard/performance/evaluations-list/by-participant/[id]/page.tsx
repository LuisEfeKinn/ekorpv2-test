import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { EvaluationDetailView } from 'src/sections/performance/evaluations-list/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Evaluation Detail - ${CONFIG.appName}` };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;
  
  return <EvaluationDetailView id={id} />;
}
