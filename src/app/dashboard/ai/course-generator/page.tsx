import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { AiCoursesView } from 'src/sections/ai-course-generator/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `AI Course Generator - ${CONFIG.appName}` };

export default function Page() {
  return <AiCoursesView />;
}
