import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { OrganizationalStructureMapView } from 'src/sections/architecture/business/organizational-structure/view/organizational-structure-map-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Mapa de Estructura Organizacional - ${CONFIG.appName}` };

export default function Page() {
  return <OrganizationalStructureMapView id={undefined} />;
}
