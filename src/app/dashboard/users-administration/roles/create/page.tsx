import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { UsersAdministrationRolesCreateView } from 'src/sections/users-clarity/view/users-administration-roles-create-view';

export const metadata: Metadata = { title: `Create Role - ${CONFIG.appName}` };

export default function Page() {
  return <UsersAdministrationRolesCreateView />;
}

