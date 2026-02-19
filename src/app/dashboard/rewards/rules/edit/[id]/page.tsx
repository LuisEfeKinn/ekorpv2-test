import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { RewardRulesEditView } from 'src/sections/reward-rules/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Edit Rewards Rules - ${CONFIG.appName}` };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;

  return <RewardRulesEditView id={id} />;
}