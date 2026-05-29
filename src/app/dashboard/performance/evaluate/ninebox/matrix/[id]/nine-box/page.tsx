import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { EvaluationsNineBoxView } from 'src/sections/performance/evaluate/ninebox/matrix/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Nine Box Dashboard Live - ${CONFIG.appName}` };
type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;
  
  return <EvaluationsNineBoxView id={id} />;
}