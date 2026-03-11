import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { InventoryCreateView } from 'src/sections/assets/inventory/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Create Inventory Item - ${CONFIG.appName}` };

export default function Page() {
  return <InventoryCreateView />;
}