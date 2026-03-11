import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { UserLearningPathsView } from 'src/sections/user-learning-path/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `User Learning Paths - ${CONFIG.appName}` };

export default function Page() {
  return <UserLearningPathsView />;
}