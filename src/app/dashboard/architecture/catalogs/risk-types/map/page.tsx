import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { RiskTypesMapView } from 'src/sections/architecture/catalogs/risk-types/view/risk-types-map-view';

export const metadata: Metadata = { title: `Risk Map - ${CONFIG.appName}` };
export default function Page() {
  return <RiskTypesMapView />;
}

