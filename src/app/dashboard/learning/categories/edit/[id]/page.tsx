import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { LearningCategoriesEditView } from 'src/sections/learning-categories/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Learning Categories - ${CONFIG.appName}` };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;

  return <LearningCategoriesEditView id={id} />;
}