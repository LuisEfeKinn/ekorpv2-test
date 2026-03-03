import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { AssetRecordView } from 'src/sections/assets/record/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Asset Record - ${CONFIG.appName}` };

export default function Page() {
  return <AssetRecordView />;
}