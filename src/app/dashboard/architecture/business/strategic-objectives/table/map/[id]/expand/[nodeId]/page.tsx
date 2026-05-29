import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { StrategicObjectivesMapExpandView } from 'src/sections/architecture/business/strategic-objectives/view';

export const metadata: Metadata = { title: `Mapa de Objetivos Estratégicos - Expandido - ${CONFIG.appName}` };

type Props = {
  params: Promise<{ id: string; nodeId: string }>;
};

export default async function Page({ params }: Props) {
  const { id, nodeId } = await params;

  return <StrategicObjectivesMapExpandView id={id} nodeId={nodeId} />;
}

