import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { RewardsCategoriesView } from 'src/sections/rewards-categories/view'

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Rewards Categories - ${CONFIG.appName}` };

export default function Page() {
  return <RewardsCategoriesView />;
}