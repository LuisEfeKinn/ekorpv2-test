import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { UsersClarityCreateView } from 'src/sections/users-clarity/view/users-clarity-create-view';

export const metadata: Metadata = { title: `Crear Usuario Clarity - ${CONFIG.appName}` };

export default function Page() {
  return <UsersClarityCreateView />;
}

