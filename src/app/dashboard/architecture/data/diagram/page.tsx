import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { DataDiagramView } from 'src/sections/architecture/data/data-table/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Data Diagram - ${CONFIG.appName}` };

export default function Page() {
  return <DataDiagramView />;
}
