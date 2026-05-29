import { CONFIG } from 'src/global-config';

import { LearningPathsView } from 'src/sections/learning-paths/view/learning-paths-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Learning Paths - ${CONFIG.appName}` };

export default function Page() {
  return <LearningPathsView />;
}
