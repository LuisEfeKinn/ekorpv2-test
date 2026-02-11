import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ConfigureTestsView } from 'src/sections/performance/configure-tests/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Configure Tests - ${CONFIG.appName}` };
export default function Page() {
  return <ConfigureTestsView />;
};