import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { InfrastructureTimelineView } from 'src/sections/architecture/infrastructure/infrastructure-table/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Infrastructure Timeline - ${CONFIG.appName}` };
export default function Page() {
  return <InfrastructureTimelineView />;
}