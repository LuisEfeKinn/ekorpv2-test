import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { OverviewView } from 'src/sections/project-management/overview/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Resumen General - ${CONFIG.appName}`,
};

export default function Page() {
  return <OverviewView />;
}
