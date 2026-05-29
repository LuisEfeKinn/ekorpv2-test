import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { CompanyView } from 'src/sections/company/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Company - ${CONFIG.appName}` };

export default function Page() {
  return <CompanyView />;
}