import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ToolsTableMapExpandView } from 'src/sections/architecture/tools/tools-table/view';

export const metadata: Metadata = { title: `Mapa de Herramienta - Expandido - ${CONFIG.appName}` };

type Props = {
  params: Promise<{ id: string; nodeId: string }>;
};

export default async function Page({ params }: Props) {
  const { id, nodeId } = await params;

  return <ToolsTableMapExpandView id={id} nodeId={nodeId} />;
}

