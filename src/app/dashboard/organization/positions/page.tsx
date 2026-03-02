import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { PositionView } from 'src/sections/positions/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Position - ${CONFIG.appName}` };

export default function Page() {
  return <PositionView />;
}