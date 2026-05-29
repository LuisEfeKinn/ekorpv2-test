import { CONFIG } from 'src/global-config';

import { LearningObjectsDetailsView } from 'src/sections/learning-objects/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Detalles de Objeto de Aprendizaje - ${CONFIG.appName}` };

export default function Page() {
  return <LearningObjectsDetailsView />;
}
