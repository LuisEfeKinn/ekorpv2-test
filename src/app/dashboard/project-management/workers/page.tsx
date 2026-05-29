import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { WorkersView } from 'src/sections/project-management/workers/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Empleados - ${CONFIG.appName}`,
};

export default function Page() {
  return <WorkersView />;
}
