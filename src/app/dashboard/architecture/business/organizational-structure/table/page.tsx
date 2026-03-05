import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { OrganizationalStructureTableView } from 'src/sections/architecture/business/organizational-structure/view/organizational-structure-table-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Organizational Structure Table - ${CONFIG.appName}` };

export default function Page() {
  return <OrganizationalStructureTableView />;
}

