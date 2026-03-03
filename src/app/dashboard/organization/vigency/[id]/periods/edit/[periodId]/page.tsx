import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { PeriodsEditView } from 'src/sections/vigencies/periods/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Edit Vigencies Period - ${CONFIG.appName}` };
type Props = {
  params: Promise<{ id: string, periodId: string }>;
};

export default async function Page({ params }: Props) {
  const { id, periodId } = await params;
  
  return <PeriodsEditView id={id} periodId={periodId} />;
};