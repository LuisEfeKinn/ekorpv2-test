import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { RewardRulesView } from 'src/sections/reward-rules/view'

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Rewards Rules - ${CONFIG.appName}` };

export default function Page() {
  return <RewardRulesView />;
}