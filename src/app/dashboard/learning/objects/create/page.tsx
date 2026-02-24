import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { LearningObjectCreateView } from 'src/sections/learning-objects/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Create Learning Object - ${CONFIG.appName}` };

export default function Page() {
  return <LearningObjectCreateView />;
}
