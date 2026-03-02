import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { AiProviderSettingsCreateView } from 'src/sections/ai-provider-settings/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Nueva Configuración de Proveedor IA - ${CONFIG.appName}` };

export default function Page() {
  return <AiProviderSettingsCreateView />;
}
