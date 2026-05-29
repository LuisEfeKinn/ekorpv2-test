import { CONFIG } from 'src/global-config';

import { ProcessesFlowView } from 'src/sections/architecture/processes/processes-table/view/processes-flow-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Process Flow | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <ProcessesFlowView />;
}
