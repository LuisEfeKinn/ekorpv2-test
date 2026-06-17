import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { MyProjectsListView } from 'src/sections/project-management/my-projects/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Mis Proyectos - ${CONFIG.appName}`,
};

export default function Page() {
  return <MyProjectsListView />;
}
