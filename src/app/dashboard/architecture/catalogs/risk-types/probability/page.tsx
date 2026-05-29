import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { RiskProbabilityLevelsView } from 'src/sections/architecture/catalogs/risk-types/levels/risk-probability-levels-view';

export const metadata: Metadata = { title: `Probability Levels - ${CONFIG.appName}` };
export default function Page() {
  return <RiskProbabilityLevelsView />;
}
