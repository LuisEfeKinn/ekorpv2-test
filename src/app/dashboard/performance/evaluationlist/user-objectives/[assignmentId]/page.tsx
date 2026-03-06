import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { EvaluationResponseObjectives } from 'src/sections/performance/evaluation-responses/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Objectives Evaluation - ${CONFIG.appName}` };

type Props = {
    params: Promise<{ assignmentId: string }>;
};

export default async function Page({ params }: Props) {
    const { assignmentId } = await params;
    return <EvaluationResponseObjectives assignmentId={assignmentId} />;
}