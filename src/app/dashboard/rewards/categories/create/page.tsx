import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { RewardsCategoriesCreateView } from 'src/sections/rewards-categories/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Create Rewards Categories - ${CONFIG.appName}` };

export default function Page() {
  return <RewardsCategoriesCreateView />;
}