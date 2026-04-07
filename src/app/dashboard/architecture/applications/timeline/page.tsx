import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ApplicationTimelineView } from 'src/sections/architecture/aplications/aplications-table/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Application Timeline - ${CONFIG.appName}` };

export default function Page() {
  return <ApplicationTimelineView />;
}