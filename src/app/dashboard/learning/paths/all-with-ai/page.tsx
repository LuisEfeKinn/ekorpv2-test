import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { AiLearningPathCreateView } from 'src/sections/ai-learning-path-generator/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Create All AI Learning Paths - ${CONFIG.appName}` };

export default function Page() {
  return <AiLearningPathCreateView />;
};