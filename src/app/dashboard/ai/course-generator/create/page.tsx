import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { AiCoursesCreateChatView } from 'src/sections/ai-course-generator/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Create AI Course - ${CONFIG.appName}` };

export default function Page() {
  return <AiCoursesCreateChatView />;
}
