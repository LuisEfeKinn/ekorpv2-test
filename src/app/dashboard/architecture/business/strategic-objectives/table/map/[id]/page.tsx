import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { StrategicObjectivesMapView } from 'src/sections/architecture/business/strategic-objectives/view';

export const metadata: Metadata = { title: `Mapa de Objetivos Estratégicos - ${CONFIG.appName}` };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;

  return <StrategicObjectivesMapView id={id} />;
}

