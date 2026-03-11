import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { TechnologyTypesView } from 'src/sections/architecture/catalogs/technology-types/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Technology Types - ${CONFIG.appName}` };
export default function Page() {
  return <TechnologyTypesView />;
}