import { CONFIG } from 'src/global-config';

import { LearningReportsView } from 'src/sections/learning-reports';

// ----------------------------------------------------------------------

export const metadata = { title: `Learning Reports - ${CONFIG.appName}` };

export default function Page() {
  return <LearningReportsView />;
}
