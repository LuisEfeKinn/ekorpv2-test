import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ReceiptIdDocumentView } from 'src/sections/reset-biometric-user/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Receipt Id Document | ${CONFIG.appName}` };

export default function Page() {
  return <ReceiptIdDocumentView />;
}
