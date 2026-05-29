import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { UsersListView } from 'src/sections/users/view'

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Users - ${CONFIG.appName}` };

export default function Page() {
  return <UsersListView />;
}