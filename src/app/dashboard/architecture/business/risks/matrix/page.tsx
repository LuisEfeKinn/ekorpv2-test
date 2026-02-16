import type { Metadata } from 'next';

import RiskJobsMatrixView from 'src/sections/architecture/business/risks/view/risk-jobs-matrix-view';

export const metadata: Metadata = {
  title: 'Matriz de Riesgos por Puesto',
};

export default function Page() {
  return <RiskJobsMatrixView />;
}

