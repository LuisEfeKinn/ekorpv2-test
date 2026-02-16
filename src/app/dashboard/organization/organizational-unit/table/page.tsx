import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { OrganizationView } from 'src/sections/organization/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Organization Unit Table - ${CONFIG.appName}` };

export default function Page() {
  return <OrganizationView />;
}
