import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { DataTimelineView } from 'src/sections/architecture/data/data-table/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Data Timeline - ${CONFIG.appName}` };

export default function Page() {
  return <DataTimelineView />;
}