import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { VigenciesCreateView } from 'src/sections/vigencies/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Vigencies Create - ${CONFIG.appName}` };

export default function Page() {
  return <VigenciesCreateView />;
};