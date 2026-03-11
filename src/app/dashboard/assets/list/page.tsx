import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { InventoryView } from 'src/sections/assets/inventory/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Inventory - ${CONFIG.appName}` };

export default function Page() {
  return <InventoryView />;
}
