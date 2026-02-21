import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { InfrastructureTableView } from 'src/sections/architecture/infrastructure/infrastructure-table/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Infrastructure Table - ${CONFIG.appName}` };

export default function Page() {
  return <InfrastructureTableView />;
}
