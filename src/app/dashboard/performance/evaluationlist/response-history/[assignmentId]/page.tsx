import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { EvaluationResponseHistory } from 'src/sections/performance/evaluation-responses/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Evaluation by Evaluator - ${CONFIG.appName}` };

type Props = {
    params: Promise<{ assignmentId: string }>;
};

export default async function Page({ params }: Props) {
    const { assignmentId } = await params;
    return <EvaluationResponseHistory assignmentId={assignmentId} />;
}