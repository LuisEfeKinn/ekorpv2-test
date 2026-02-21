import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { AiProviderSettingsView } from 'src/sections/ai-provider-settings/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Configuraciones de Proveedores IA - ${CONFIG.appName}` };

export default function Page() {
  return <AiProviderSettingsView />;
}
