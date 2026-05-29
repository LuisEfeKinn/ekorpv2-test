import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ToolsTableCreateView } from 'src/sections/architecture/tools/tools-table/view';

export const metadata: Metadata = { title: `Agregar Herramienta - ${CONFIG.appName}` };

export default function Page() {
  return <ToolsTableCreateView />;
}

