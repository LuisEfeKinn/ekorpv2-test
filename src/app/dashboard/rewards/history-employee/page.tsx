import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { UserRewardsHistoryView } from 'src/sections/user-rewards/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `User Rewards History - ${CONFIG.appName}` };

export default function Page() {
  return <UserRewardsHistoryView />;
}