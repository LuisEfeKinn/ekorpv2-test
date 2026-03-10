import { CONFIG } from 'src/global-config';

import { UserRewardsView } from 'src/sections/user-rewards/view';

// ----------------------------------------------------------------------

export const metadata = { title: `User Rewards - ${CONFIG.appName}` };

export default function Page() {
  return <UserRewardsView />;
}
