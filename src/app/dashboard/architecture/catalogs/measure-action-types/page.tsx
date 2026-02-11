import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { MeasureActionTypesView } from 'src/sections/architecture/catalogs/measure-action-types/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Measure Action Types - ${CONFIG.appName}` };
export default function Page() {
  return <MeasureActionTypesView />;
}