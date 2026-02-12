import { CONFIG } from 'src/global-config';

import { EvaluationResponsesView } from 'src/sections/performance/evaluation-responses/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Evaluation List - ${CONFIG.appName}` };

export default function Page() {
  return <EvaluationResponsesView />;
}
