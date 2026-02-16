import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { BiometricUserActivationView } from 'src/sections/biometric-activation/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Biometric Activation - ${CONFIG.appName}` };

export default function Page() {
  return <BiometricUserActivationView />;
}