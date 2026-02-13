import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ConfigureTestsEditView } from 'src/sections/performance/configure-tests/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Edit Tests - ${CONFIG.appName}` };
type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;
  
  return <ConfigureTestsEditView id={id} />;
};