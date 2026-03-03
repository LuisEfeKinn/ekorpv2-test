import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { IntegrationsView } from 'src/sections/integrations/view'

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Integrations - ${CONFIG.appName}` };

export default function Page() {
  return <IntegrationsView />;
}