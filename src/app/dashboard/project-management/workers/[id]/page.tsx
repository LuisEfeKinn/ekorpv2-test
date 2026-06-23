import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { WorkerDetailView } from 'src/sections/project-management/workers/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Detalle del Empleado - ${CONFIG.appName}`,
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <WorkerDetailView id={id} />;
}
