import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { UserLearningObjectsCourseView } from 'src/sections/user-learning-objects/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `User Learning Course Module - ${CONFIG.appName}` };

type Props = {
  params: Promise<{ id: string; }>;
};

export default async function Page({ params }: Props) {
  const { id} = await params;

  return <UserLearningObjectsCourseView id={id} />;
};