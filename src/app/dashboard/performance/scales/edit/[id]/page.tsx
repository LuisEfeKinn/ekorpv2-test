import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ScalesEditView } from 'src/sections/performance/scales/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Edit Scales - ${CONFIG.appName}` };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;
  
  return <ScalesEditView id={id} />;
}
