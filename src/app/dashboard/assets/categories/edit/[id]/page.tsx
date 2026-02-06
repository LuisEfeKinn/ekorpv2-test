import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { CategoriesInventoryEditView } from 'src/sections/assets/categories/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Edit Category Inventory - ${CONFIG.appName}` };
type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;

  return <CategoriesInventoryEditView id={id} />;
}