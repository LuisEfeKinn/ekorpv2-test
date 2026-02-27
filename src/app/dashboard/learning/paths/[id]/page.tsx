import { CONFIG } from 'src/global-config';

import { LearningPathDetailsView } from 'src/sections/learning-paths/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Detalles de Ruta - ${CONFIG.appName}` };

export default function Page() {
  return <LearningPathDetailsView />;
}
