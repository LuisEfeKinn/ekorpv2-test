import { CONFIG } from 'src/global-config';

import { LearningPathsEditView } from 'src/sections/learning-paths/view/learning-paths-edit-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Edit Learning Path - ${CONFIG.appName}` };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;

  return <LearningPathsEditView id={id} />;
}
