import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { RewardsRuleTypesEditView } from 'src/sections/rewards-rule-type/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Edit Rewards Rule Types - ${CONFIG.appName}` };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;

  return <RewardsRuleTypesEditView id={id} />;
}