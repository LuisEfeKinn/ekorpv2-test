import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { DocumentManagementMapView } from 'src/sections/documents/document-management/view';

export const metadata: Metadata = { title: `Mapa de Documento - ${CONFIG.appName}` };

type Props = {
  searchParams: Promise<{ id?: string }>;
};

export default async function Page({ searchParams }: Props) {
  const { id } = await searchParams;

  return <DocumentManagementMapView id={id ?? ''} />;
}
