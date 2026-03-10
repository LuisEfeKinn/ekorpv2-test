import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { RewardsEditView } from 'src/sections/rewards/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Edit Rewards - ${CONFIG.appName}` };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;

  return <RewardsEditView id={id} />;
}