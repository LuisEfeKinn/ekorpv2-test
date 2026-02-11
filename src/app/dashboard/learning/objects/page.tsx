import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { LearningObjectsView } from 'src/sections/learning-objects/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Learning Objects - ${CONFIG.appName}` };

export default function Page() {
  return <LearningObjectsView />;
}