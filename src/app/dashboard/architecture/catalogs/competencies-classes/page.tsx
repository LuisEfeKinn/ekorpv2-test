import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { CompetenciesClassesView } from 'src/sections/architecture/catalogs/competencies-classes/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Competencies Classes - ${CONFIG.appName}` };

export default function Page() {
  return <CompetenciesClassesView />;
}