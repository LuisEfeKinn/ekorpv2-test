import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { AiRoutesCreateChatView } from 'src/sections/ai-route-generator/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Create AI Route - ${CONFIG.appName}` };

export default function Page() {
  return <AiRoutesCreateChatView />;
};