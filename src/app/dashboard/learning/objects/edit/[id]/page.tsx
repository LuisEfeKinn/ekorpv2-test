import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { LearningObjectEditView } from 'src/sections/learning-objects/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Edit Learning Object - ${CONFIG.appName}` };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;
  
  return <LearningObjectEditView id={id} />;
}
