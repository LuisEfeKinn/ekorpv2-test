import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { MyProjectDetailView } from 'src/sections/project-management/my-projects/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Mi Proyecto - ${CONFIG.appName}`,
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <MyProjectDetailView id={id} />;
}
