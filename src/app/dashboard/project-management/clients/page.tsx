import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ClientsView } from 'src/sections/project-management/clients/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Clientes - ${CONFIG.appName}`,
};

export default function Page() {
  return <ClientsView />;
}
