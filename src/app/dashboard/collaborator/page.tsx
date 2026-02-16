import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { OverviewCollaboratorView } from 'src/sections/overview/app/view/overview-collaborator-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Dashboard Colaborador - ${CONFIG.appName}` };

export default function Page() {
  return <OverviewCollaboratorView />;
}
