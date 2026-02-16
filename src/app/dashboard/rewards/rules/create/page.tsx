import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { RewardRulesCreateView } from 'src/sections/reward-rules/view'

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Create Rewards Rules - ${CONFIG.appName}` };

export default function Page() {
  return <RewardRulesCreateView />;
}