import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ProcessTypesView } from 'src/sections/architecture/catalogs/process-types/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Process Types - ${CONFIG.appName}` };
export default function Page() {
  return <ProcessTypesView />;
}