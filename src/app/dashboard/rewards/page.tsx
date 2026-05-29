import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { RewardsView } from 'src/sections/rewards/view'

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Rewards - ${CONFIG.appName}` };

export default function Page() {
  return <RewardsView />;
}