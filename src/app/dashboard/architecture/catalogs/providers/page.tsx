import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ProvidersView } from 'src/sections/architecture/catalogs/providers/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Providers - ${CONFIG.appName}` };
export default function Page() {
  return <ProvidersView />;
}