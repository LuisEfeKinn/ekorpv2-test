import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { DataTableMapView } from 'src/sections/architecture/data/data-table/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Data Map - ${CONFIG.appName}` };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;

  return <DataTableMapView id={id} />;
}