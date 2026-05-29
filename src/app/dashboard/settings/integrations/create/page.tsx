import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { IntegrationsCreateView } from 'src/sections/integrations/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Create Integration - ${CONFIG.appName}` };

export default function Page() {
  return <IntegrationsCreateView />;
}