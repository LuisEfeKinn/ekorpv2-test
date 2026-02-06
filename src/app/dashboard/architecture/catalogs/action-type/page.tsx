import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ActionTypesView } from 'src/sections/architecture/catalogs/action-types/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Action Types - ${CONFIG.appName}` };

export default function Page() {
  return <ActionTypesView />;
}