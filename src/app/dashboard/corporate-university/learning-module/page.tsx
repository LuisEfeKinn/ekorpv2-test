import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { UserLearningObjectsView } from 'src/sections/user-learning-objects/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `User Learning Modules - ${CONFIG.appName}` };

export default function Page() {
  return <UserLearningObjectsView />;
}