import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { LearningCategoriesView } from 'src/sections/learning-categories/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Learning Categories - ${CONFIG.appName}` };

export default function Page() {
  return <LearningCategoriesView />;
}