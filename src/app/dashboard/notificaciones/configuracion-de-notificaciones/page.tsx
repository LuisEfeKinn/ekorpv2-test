import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { NotificationConfigView } from 'src/sections/notificaciones/configuracion-notificaciones/view';

export const metadata: Metadata = {
  title: `Configuración de notificaciones - ${CONFIG.appName}`,
};

export default function Page() {
  return <NotificationConfigView />;
}
