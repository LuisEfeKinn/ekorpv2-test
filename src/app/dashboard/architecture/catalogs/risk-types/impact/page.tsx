import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { RiskImpactLevelsView } from 'src/sections/architecture/catalogs/risk-types/levels/risk-impact-levels-view';

export const metadata: Metadata = { title: `Impact Levels - ${CONFIG.appName}` };
export default function Page() {
  return <RiskImpactLevelsView />;
}
