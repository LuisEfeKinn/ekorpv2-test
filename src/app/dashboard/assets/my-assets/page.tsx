import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { MyAssetsView } from 'src/sections/assets/my-assets/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `My Assets - ${CONFIG.appName}` };

export default function Page() {
  return <MyAssetsView />;
}