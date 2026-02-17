import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ProcessTableMapView } from 'src/sections/architecture/processes/processes-table/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Mapa de Procesos - ${CONFIG.appName}` };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;

  return <ProcessTableMapView id={id} />;
}
