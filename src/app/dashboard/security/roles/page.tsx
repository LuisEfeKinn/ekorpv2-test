import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { RolesView } from 'src/sections/roles/view'

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Roles - ${CONFIG.appName}` };

export default function Page() {
  return <RolesView />;
}