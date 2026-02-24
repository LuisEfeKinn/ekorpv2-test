import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ApplicationTableView } from 'src/sections/architecture/aplications/aplications-table/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Application Table - ${CONFIG.appName}` };

export default function Page() {
  return <ApplicationTableView />;
}
