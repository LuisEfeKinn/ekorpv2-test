import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { RewardHistoryView } from 'src/sections/reward-history';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Rewards History - ${CONFIG.appName}` };

export default function Page() {
  return <RewardHistoryView />;
}