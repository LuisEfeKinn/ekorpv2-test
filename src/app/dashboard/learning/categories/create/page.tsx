import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { LearningCategoriesCreateView } from 'src/sections/learning-categories/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Learning Categories Create - ${CONFIG.appName}` };

export default function Page() {
  return <LearningCategoriesCreateView />;
}