import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { RewardsCreateView } from 'src/sections/rewards/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Create Rewards - ${CONFIG.appName}` };

export default function Page() {
  return <RewardsCreateView />;
}