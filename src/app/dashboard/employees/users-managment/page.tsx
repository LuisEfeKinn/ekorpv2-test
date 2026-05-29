import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { UserManagmentView } from 'src/sections/users-managment/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Employee Management - ${CONFIG.appName}` };

export default function Page() {
  return <UserManagmentView />;
}