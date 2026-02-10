import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { CategoriesInventoryView } from 'src/sections/assets/categories/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Categories Inventory - ${CONFIG.appName}` };

export default function Page() {
  return <CategoriesInventoryView />;
}