import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { RewardsRuleTypesCreateView } from 'src/sections/rewards-rule-type/view'

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Create Rewards Rule Types - ${CONFIG.appName}` };

export default function Page() {
  return <RewardsRuleTypesCreateView />;
}