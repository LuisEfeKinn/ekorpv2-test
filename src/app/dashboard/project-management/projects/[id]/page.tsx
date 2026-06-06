import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ProjectDetailView } from 'src/sections/project-management/projects/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Detalle del Proyecto - ${CONFIG.appName}`,
};

type Props = {
  params: { id: string };
};

export default function Page({ params }: Props) {
  return <ProjectDetailView id={params.id} />;
}
