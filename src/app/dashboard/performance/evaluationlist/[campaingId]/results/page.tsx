import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { EvaluationMyResultsView } from 'src/sections/performance/evaluation-responses/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Evaluation by Evaluator - ${CONFIG.appName}` };

type Props = {
    params: Promise<{ campaingId: string }>;
};

export default async function Page({ params }: Props) {
    const { campaingId } = await params;
    return <EvaluationMyResultsView campaingId={campaingId} />;
}