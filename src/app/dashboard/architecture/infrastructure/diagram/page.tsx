import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { InfrastructureDiagramView } from 'src/sections/architecture/infrastructure/infrastructure-table/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Infrastructure Diagram - ${CONFIG.appName}` };
export default function Page() {
  return <InfrastructureDiagramView />;
}
