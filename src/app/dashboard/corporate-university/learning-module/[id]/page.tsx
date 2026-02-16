import { CONFIG } from 'src/global-config';

import { UserLearningObjectsDetailsView } from 'src/sections/user-learning-objects/view';

// ----------------------------------------------------------------------

export const metadata = { title: `User Learning Module Details - ${CONFIG.appName}` };

export default function Page() {
  return <UserLearningObjectsDetailsView />;
}
