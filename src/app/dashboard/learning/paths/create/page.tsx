import { CONFIG } from 'src/global-config';

import { LearningPathsCreateView } from 'src/sections/learning-paths/view/learning-paths-create-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Create Learning Path - ${CONFIG.appName}` };

export default function Page() {
  return <LearningPathsCreateView />;
}
