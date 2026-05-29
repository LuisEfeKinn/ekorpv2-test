import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { OrganizationalStructureCreateView } from 'src/sections/architecture/business/organizational-structure/view/organizational-structure-create-view';

export const metadata: Metadata = { title: `Crear Estructura Organizacional - ${CONFIG.appName}` };

export default function Page() {
  return <OrganizationalStructureCreateView />;
}

