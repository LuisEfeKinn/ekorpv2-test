import { CONFIG } from 'src/global-config';

import { LivenessCheckView } from 'src/sections/liveness-check/liveness-check-view';

// ----------------------------------------------------------------------

export const metadata = { title: `Liveness Check - ${CONFIG.appName}` };

export default function LivenessCheckPage() {
  return <LivenessCheckView />;
}
