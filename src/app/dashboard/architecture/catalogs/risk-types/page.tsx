import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { RiskTypesView } from 'src/sections/architecture/catalogs/risk-types/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Risk Types - ${CONFIG.appName}` };
export default function Page() {
  return <RiskTypesView />;
}