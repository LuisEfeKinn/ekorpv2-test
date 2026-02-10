import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { OrganizationalChartView } from 'src/sections/organization/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Organizational Structure Map - ${CONFIG.appName}` };

export default function Page() {
  return <OrganizationalChartView />;
}

