
import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ProcessesRasciMatrixView } from 'src/sections/architecture/processes/view/processes-rasci-matrix-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Matriz RASCI - ${CONFIG.appName}`,
};

export default function ProcessesRasciMatrixPage() {
  return <ProcessesRasciMatrixView />;
}
