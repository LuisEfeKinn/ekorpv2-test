import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { RiskTableView } from 'src/sections/architecture/risk/risk-table/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Risk Table - ${CONFIG.appName}` };

export default function Page() {
  return <RiskTableView />;
}
