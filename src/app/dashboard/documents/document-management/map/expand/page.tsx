import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { DocumentManagementMapExpandView } from 'src/sections/documents/document-management/view';

export const metadata: Metadata = { title: `Mapa de Documento - Expandido - ${CONFIG.appName}` };

type Props = {
  searchParams: Promise<{ id?: string; nodeId?: string }>;
};

export default async function Page({ searchParams }: Props) {
  const { id, nodeId } = await searchParams;

  return <DocumentManagementMapExpandView id={id ?? ''} nodeId={nodeId ?? ''} />;
}
