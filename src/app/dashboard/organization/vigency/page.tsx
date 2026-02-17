import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { VigenciesView } from 'src/sections/vigencies/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Vigencies - ${CONFIG.appName}` };

export default function Page() {
  return <VigenciesView />;
};