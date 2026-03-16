import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { RiskDeficiencyLevelsView } from 'src/sections/architecture/catalogs/risk-types/levels/risk-deficiency-levels-view';

export const metadata: Metadata = { title: `Deficiency Levels - ${CONFIG.appName}` };
export default function Page() {
  return <RiskDeficiencyLevelsView />;
}
