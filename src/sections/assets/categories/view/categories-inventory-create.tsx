'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CategoriesInventoryCreateEditForm } from '../categories-inventory-create-edit-form';

// ----------------------------------------------------------------------

export function CategoriesInventoryCreateView() {
  const { t } = useTranslate('assets');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('categories.breadcrumbs.create')}
        links={[
          { name: t('categories.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('categories.breadcrumbs.categories'), href: paths.dashboard.assets.inventoryCategories },
          { name: t('categories.breadcrumbs.create') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <CategoriesInventoryCreateEditForm />
    </DashboardContent>
  );
}