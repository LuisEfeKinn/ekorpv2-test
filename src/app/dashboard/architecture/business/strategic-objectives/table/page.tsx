import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { StrategicObjectivesTableView } from 'src/sections/architecture/business/strategic-objectives/view/strategic-objectives-table-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Tabla de Objetivos Estratégicos - ${CONFIG.appName}` };

export default function Page() {
  return <StrategicObjectivesTableView />;
}
