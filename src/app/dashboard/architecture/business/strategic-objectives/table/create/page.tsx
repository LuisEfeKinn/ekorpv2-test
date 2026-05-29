import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { StrategicObjectivesCreateView } from 'src/sections/architecture/business/strategic-objectives/view';

export const metadata: Metadata = { title: `Crear Objetivo Estratégico - ${CONFIG.appName}` };

export default function Page() {
  return <StrategicObjectivesCreateView />;
}

