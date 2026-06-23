import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { UserProfileView } from 'src/sections/user-profile/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Mi Perfil - ${CONFIG.appName}` };

export default function Page() {
  return <UserProfileView />;
}
