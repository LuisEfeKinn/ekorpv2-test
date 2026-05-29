import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ProjectsView } from 'src/sections/project-management/projects/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Proyectos - ${CONFIG.appName}`,
};

export default function Page() {
  return <ProjectsView />;
}
