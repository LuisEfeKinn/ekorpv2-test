import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ReceiptIdDocumentSignInView } from 'src/sections/biometric-sign-in/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Biometric Sign In | ${CONFIG.appName}` };

export default function Page() {
  return <ReceiptIdDocumentSignInView />;
}
