import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ActionMeasuresView } from 'src/sections/architecture/action-measures/view';

export const metadata: Metadata = { title: `Actions Table - ${CONFIG.appName}` };

export default function Page() {
  return <ActionMeasuresView />;
}

