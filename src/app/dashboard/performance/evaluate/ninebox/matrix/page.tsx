import { CONFIG } from 'src/global-config';

import { EvaluationsListView } from 'src/sections/performance/evaluate/ninebox/matrix/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Nine Box - ${CONFIG.appName}` };

export default function Page() {
  return <EvaluationsListView />;
}
