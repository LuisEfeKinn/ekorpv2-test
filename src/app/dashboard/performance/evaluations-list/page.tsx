import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { EvaluationsListView } from 'src/sections/performance/evaluations-list/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Evaluations List - ${CONFIG.appName}` };

export default function Page() {
  return <EvaluationsListView />;
};