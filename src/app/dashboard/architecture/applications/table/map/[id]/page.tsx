import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ApplicationTableMapView } from 'src/sections/architecture/aplications/aplications-table/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Aplicacion Map - ${CONFIG.appName}` };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;

  return <ApplicationTableMapView id={id} />;
}