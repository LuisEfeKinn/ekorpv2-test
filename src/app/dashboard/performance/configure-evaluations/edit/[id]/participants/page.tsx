import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ParticipantsView } from 'src/sections/performance/configure-evaluations/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Participants - ${CONFIG.appName}` };
type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;
  
  return <ParticipantsView id={id} />;
}
