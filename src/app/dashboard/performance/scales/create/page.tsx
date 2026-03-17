import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ScalesCreateView } from 'src/sections/performance/scales/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Create Scales - ${CONFIG.appName}` };

export default function Page() {
  return <ScalesCreateView />;
}