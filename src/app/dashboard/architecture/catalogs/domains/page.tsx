import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { DomainsView } from 'src/sections/architecture/catalogs/domains/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Domains - ${CONFIG.appName}` };
export default function Page() {
  return <DomainsView />;
}