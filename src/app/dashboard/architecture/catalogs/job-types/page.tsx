import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { JobTypesView } from 'src/sections/architecture/catalogs/job-types/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Job Types - ${CONFIG.appName}` };
export default function Page() {
  return <JobTypesView />;
}