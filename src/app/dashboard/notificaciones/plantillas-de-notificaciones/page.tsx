import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { NotificationTemplatesView } from 'src/sections/notificaciones/plantillas-notificaciones/view';

export const metadata: Metadata = { title: `Plantillas de notificaciones - ${CONFIG.appName}` };

export default function Page() {
  return <NotificationTemplatesView />;
}
