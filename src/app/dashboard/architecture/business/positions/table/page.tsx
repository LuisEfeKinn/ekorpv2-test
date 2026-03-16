import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { JobsTableView } from 'src/sections/architecture/business/positions/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Tabla de Cargos - ${CONFIG.appName}` };

export default function Page() {
  return <JobsTableView />;
}
