import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { DateControlsView } from 'src/sections/architecture/catalogs/date-controls/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Date Controls - ${CONFIG.appName}` };

export default function Page() {
  return <DateControlsView />;
}