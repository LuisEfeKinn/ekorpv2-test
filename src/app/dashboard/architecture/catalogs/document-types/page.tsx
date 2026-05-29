import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { DocumentTypesView } from 'src/sections/architecture/catalogs/document-types/view';

export const metadata: Metadata = { title: `Document Types - ${CONFIG.appName}` };

export default function Page() {
  return <DocumentTypesView />;
}
