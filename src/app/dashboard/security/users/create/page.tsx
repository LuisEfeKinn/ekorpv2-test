import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { UsersCreateView } from 'src/sections/users/view/users-create-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Create User - ${CONFIG.appName}` };

export default function Page() {
  return <UsersCreateView />;
}