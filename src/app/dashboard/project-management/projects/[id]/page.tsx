import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ProjectDetailView } from 'src/sections/project-management/projects/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Detalle del Proyecto - ${CONFIG.appName}`,
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <ProjectDetailView id={id} />;
}
