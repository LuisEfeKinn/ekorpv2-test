import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ConfigureTestsCreateView } from 'src/sections/performance/configure-tests/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Create Tests - ${CONFIG.appName}` };
export default function Page() {
  return <ConfigureTestsCreateView />;
};