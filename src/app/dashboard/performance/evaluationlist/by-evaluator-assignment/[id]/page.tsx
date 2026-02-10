import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { EvaluationByEvaluatorView } from 'src/sections/performance/evaluation-responses/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Evaluation by Evaluator - ${CONFIG.appName}` };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;

  return <EvaluationByEvaluatorView id={id} />;
}