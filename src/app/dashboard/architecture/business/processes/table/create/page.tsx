import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ProcessCreateView } from 'src/sections/architecture/processes/processes-table/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Crear Proceso - ${CONFIG.appName}` };

export default function Page() {
  return <ProcessCreateView />;
}
