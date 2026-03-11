/**
 * @deprecated This page is deprecated.
 * Create/Edit is now handled via the EvaluationDrawer in configure-evaluations-view.tsx.
 * Kept for reference — remove when confirmed safe.
 */
import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ConfigureEvaluationsCreateView } from 'src/sections/performance/configure-evaluations/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Configure Evaluations - ${CONFIG.appName}` };
export default function Page() {
  return <ConfigureEvaluationsCreateView />;
}