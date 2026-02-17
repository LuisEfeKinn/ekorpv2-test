import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { UserLearningProgramView } from 'src/sections/user-learning-path/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `User Learning Program - ${CONFIG.appName}` };

type Props = {
  params: Promise<{ id: string; idP: string }>;
};

export default async function Page({ params }: Props) {
  const { id, idP } = await params;

  return <UserLearningProgramView id={id} idP={idP} />;
};