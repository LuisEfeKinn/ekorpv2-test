import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { AiProgramsCreateChatView } from 'src/sections/ai-program-generator/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Create AI Program - ${CONFIG.appName}` };

export default function Page() {
  return <AiProgramsCreateChatView />;
};