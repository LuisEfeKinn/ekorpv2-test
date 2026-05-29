import { CONFIG } from 'src/global-config';

import { UserLearningPathDetailsView } from 'src/sections/user-learning-path/view';

// ----------------------------------------------------------------------

export const metadata = { title: `User Learning Path Details - ${CONFIG.appName}` };

export default function Page() {
  return <UserLearningPathDetailsView />;
}
