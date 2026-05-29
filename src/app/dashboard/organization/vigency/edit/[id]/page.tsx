import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { VigenciesEditView } from 'src/sections/vigencies/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Edit Vigencies - ${CONFIG.appName}` };
type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;
  
  return <VigenciesEditView id={id} />;
}
