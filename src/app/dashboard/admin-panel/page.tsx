import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { OverviewClarityAdminView } from 'src/sections/overview/app/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Dashboard Clarity - ${CONFIG.appName}` };

export default function Page() {
  return <OverviewClarityAdminView />;
}
