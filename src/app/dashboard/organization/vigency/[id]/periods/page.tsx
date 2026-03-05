import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { PeriodsView } from 'src/sections/vigencies/periods/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Vigencies Period - ${CONFIG.appName}` };
type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;
  
  return <PeriodsView id={id} />;
};