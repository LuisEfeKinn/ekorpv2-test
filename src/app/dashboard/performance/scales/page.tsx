import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ScalesView } from 'src/sections/performance/scales/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Scales - ${CONFIG.appName}` };

export default function Page() {
  return <ScalesView />;
}