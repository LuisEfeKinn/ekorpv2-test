import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { UsersAdministrationRolesView } from 'src/sections/users-clarity/view/users-administration-roles-view';

export const metadata: Metadata = { title: `Roles - ${CONFIG.appName}` };

export default function Page() {
  return <UsersAdministrationRolesView />;
}

