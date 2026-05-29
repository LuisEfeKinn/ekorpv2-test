import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { SystemTypesView } from 'src/sections/architecture/catalogs/system-types/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `System Types - ${CONFIG.appName}` };
export default function Page() {
  return <SystemTypesView />;
}