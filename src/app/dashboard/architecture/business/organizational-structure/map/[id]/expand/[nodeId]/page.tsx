import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { OrganizationalStructureMapExpandView } from 'src/sections/architecture/business/organizational-structure/view/organizational-structure-map-expand-view';

export const metadata: Metadata = {
  title: `Mapa de Estructura Organizacional - Expandido - ${CONFIG.appName}`,
};

type Props = {
  params: Promise<{ id: string; nodeId: string }>;
};

export default async function Page({ params }: Props) {
  const { id, nodeId } = await params;

  return <OrganizationalStructureMapExpandView id={id} nodeId={nodeId} />;
}
