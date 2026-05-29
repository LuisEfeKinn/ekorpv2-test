import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { RiskToleranceLevelsView } from 'src/sections/architecture/catalogs/risk-types/levels/risk-tolerance-levels-view';

export const metadata: Metadata = { title: `Risk Tolerance Levels - ${CONFIG.appName}` };
export default function Page() {
  return <RiskToleranceLevelsView />;
}
