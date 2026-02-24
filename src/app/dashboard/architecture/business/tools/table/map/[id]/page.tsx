import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ToolsTableMapView } from 'src/sections/architecture/tools/tools-table/view';

export const metadata: Metadata = { title: `Mapa de Herramienta - ${CONFIG.appName}` };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;

  return <ToolsTableMapView id={id} />;
}

