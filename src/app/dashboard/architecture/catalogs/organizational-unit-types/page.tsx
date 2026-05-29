import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { OrganizationalUnitTypesView } from 'src/sections/architecture/catalogs/organizational-unit-types/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Organizational Unit Types - ${CONFIG.appName}` };
export default function Page() {
  return <OrganizationalUnitTypesView />;
}