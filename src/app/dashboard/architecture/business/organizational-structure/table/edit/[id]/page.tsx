import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { OrganizationalStructureEditView } from 'src/sections/architecture/business/organizational-structure/view/organizational-structure-edit-view';

export const metadata: Metadata = { title: `Editar Estructura Organizacional - ${CONFIG.appName}` };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;

  return <OrganizationalStructureEditView id={id} />;
}
