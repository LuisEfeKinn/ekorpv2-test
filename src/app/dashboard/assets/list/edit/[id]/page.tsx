import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { InventoryEditView } from 'src/sections/assets/inventory/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Edit Inventory Item - ${CONFIG.appName}` };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;

  return <InventoryEditView id={id} />;
}