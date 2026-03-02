import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { JwtSignInWsView } from 'src/auth/view/jwt';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Sign in | WhatsApp - ${CONFIG.appName}` };

export default function Page() {
  return <JwtSignInWsView />;
}
