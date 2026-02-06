import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ApplicationDiagramView } from 'src/sections/architecture/aplications/aplications-table/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Application Diagram - ${CONFIG.appName}` };

export default function Page() {
  return <ApplicationDiagramView />;
}
