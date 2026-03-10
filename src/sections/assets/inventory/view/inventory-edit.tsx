'use client';

import type { IAssetsItem } from 'src/types/assets';

import { useState, useEffect } from 'react';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetInventoryByIdService } from 'src/services/assets/inventory.service';

import { toast } from 'src/components/snackbar';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { InventoryCreateEditForm } from '../inventory-create-edit-form';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function InventoryEditView({ id }: Props) {
  const { t } = useTranslate('assets');
  const [currentInventoryItem, setCurrentInventoryItem] = useState<IAssetsItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInventoryItem = async () => {
      try {
        setLoading(true);
        const response: any = await GetInventoryByIdService(id);
        if (response?.data?.data) {
          setCurrentInventoryItem(response.data.data);
        } else {
          toast.error(t('inventory.messages.error.loading'));
        }
      } catch (err) {
        console.error('Error fetching inventory item:', err);
        toast.error(t('inventory.messages.error.loading'));
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchInventoryItem();
    }
  }, [id, t]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('inventory.actions.edit')}
        links={[
          { name: t('inventory.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('inventory.breadcrumbs.inventory'), href: paths.dashboard.assets.inventory },
          { name: currentInventoryItem?.name || t('inventory.breadcrumbs.edit') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <InventoryCreateEditForm currentInventoryItem={currentInventoryItem || undefined} />
    </DashboardContent>
  );
}