import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { TopicsView } from 'src/sections/architecture/catalogs/topics/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Topics - ${CONFIG.appName}` };
export default function Page() {
  return <TopicsView />;
}