import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { DataTableView } from 'src/sections/architecture/data/data-table/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Data Table - ${CONFIG.appName}` };

export default function Page() {
  return <DataTableView />;
}
