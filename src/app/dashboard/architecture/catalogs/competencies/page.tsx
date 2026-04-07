import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { CompetenciesView } from 'src/sections/architecture/catalogs/competencies/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Competencies - ${CONFIG.appName}` };

export default function Page() {
  return <CompetenciesView />;
}