import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ProcessTableView } from 'src/sections/architecture/processes/processes-table/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Listado de Procesos - ${CONFIG.appName}` };

export default function Page() {
  return <ProcessTableView />;
}
