'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { InventoryCreateEditForm } from '../inventory-create-edit-form';

// ----------------------------------------------------------------------

export function InventoryCreateView() {
  const { t } = useTranslate('assets');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('inventory.breadcrumbs.create')}
        links={[
          { name: t('inventory.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('inventory.breadcrumbs.inventory'), href: paths.dashboard.assets.inventory },
          { name: t('inventory.breadcrumbs.create') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <InventoryCreateEditForm />
    </DashboardContent>
  );
}