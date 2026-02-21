import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { InfrastructureTableMapView } from 'src/sections/architecture/infrastructure/infrastructure-table/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Infrastructure Map - ${CONFIG.appName}` };
type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;

  return <InfrastructureTableMapView id={id} />;
}