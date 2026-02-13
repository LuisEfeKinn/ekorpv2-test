import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { RoleCreateView } from 'src/sections/roles/view/roles-create';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Create Role - ${CONFIG.appName}` };

export default function Page() {
  return <RoleCreateView />;
}