/**
 * @deprecated This page is deprecated.
 * Create/Edit is now handled via the EvaluationDrawer in configure-evaluations-view.tsx.
 * Kept for reference — remove when confirmed safe.
 */
import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ConfigureEvaluationsEditView } from 'src/sections/performance/configure-evaluations/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Edit Configure Evaluations - ${CONFIG.appName}` };
type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;
  
  return <ConfigureEvaluationsEditView id={id} />;
}
