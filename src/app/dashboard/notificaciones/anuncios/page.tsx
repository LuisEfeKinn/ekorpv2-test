import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { AnnouncementsView } from 'src/sections/notificaciones/anuncios/view';

export const metadata: Metadata = { title: `Anuncios - ${CONFIG.appName}` };

export default function Page() {
  return <AnnouncementsView />;
}
