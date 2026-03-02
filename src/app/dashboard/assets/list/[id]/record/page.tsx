import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { InventoryHistoryView } from 'src/sections/assets/inventory/view/inventory-history-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Asset History - ${CONFIG.appName}` };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;

  return <InventoryHistoryView assetId={id} />;
}
