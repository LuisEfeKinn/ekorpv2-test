import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ToolTypesView } from 'src/sections/architecture/catalogs/tool-types/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Tool Types - ${CONFIG.appName}` };
export default function Page() {
  return <ToolTypesView />;
}