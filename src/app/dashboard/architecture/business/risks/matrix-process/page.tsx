import type { Metadata } from 'next';

import RiskMatrixProcessView from 'src/sections/architecture/risk/risk-matrix-process-view';

export const metadata: Metadata = {
  title: 'Matriz de Riesgos por Proceso',
};

export default function Page() {
  return <RiskMatrixProcessView />;
}

