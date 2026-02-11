import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ObjectiveTypesView } from 'src/sections/architecture/catalogs/objective-types/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Objective Types - ${CONFIG.appName}` };
export default function Page() {
  return <ObjectiveTypesView />;
}