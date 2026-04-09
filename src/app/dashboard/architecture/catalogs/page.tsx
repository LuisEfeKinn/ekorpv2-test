import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { CatalogsView } from 'src/sections/architecture/catalogs/catalogs-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Catalogs - ${CONFIG.appName}` };

export default function Page() {
  return <CatalogsView />;
}
