import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { CategoriesInventoryCreateView } from 'src/sections/assets/categories/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Create Category Inventory - ${CONFIG.appName}` };

export default function Page() {
  return <CategoriesInventoryCreateView />;
}