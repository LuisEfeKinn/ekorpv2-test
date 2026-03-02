import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { DataTypesView } from 'src/sections/architecture/catalogs/data-types/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Data Types - ${CONFIG.appName}` };
export default function Page() {
  return <DataTypesView />;
}