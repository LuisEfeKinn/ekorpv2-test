import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { DocumentManagementView } from 'src/sections/documents/document-management/view';

export const metadata: Metadata = { title: `Gestión documental - ${CONFIG.appName}` };

export default function Page() {
  return <DocumentManagementView />;
}

