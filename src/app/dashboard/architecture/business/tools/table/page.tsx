import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ToolsTableView } from 'src/sections/architecture/tools/tools-table/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Tools Table - ${CONFIG.appName}` };
export default function Page() {
  return <ToolsTableView />;
}
