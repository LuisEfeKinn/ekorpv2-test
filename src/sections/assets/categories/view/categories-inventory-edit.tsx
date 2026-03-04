'use client';

import type { ICategoriesInventory } from 'src/types/assets';

import { useState, useEffect } from 'react';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetCategoriesByIdService } from 'src/services/assets/categories.service';

import { toast } from 'src/components/snackbar';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CategoriesInventoryCreateEditForm } from '../categories-inventory-create-edit-form';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function CategoriesInventoryEditView({ id }: Props) {
  const { t } = useTranslate('assets');
  const [currentCategory, setCurrentCategory] = useState<ICategoriesInventory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setLoading(true);
        const response: any = await GetCategoriesByIdService(id);
        if (response?.data) {
          setCurrentCategory(response.data.data);
        } else {
          toast.error(t('categories.messages.error.loading'));
        }
      } catch (err) {
        console.error('Error fetching category:', err);
        toast.error(t('categories.messages.error.loading'));
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchCategory();
    }
  }, [id, t]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('categories.actions.edit')}
        links={[
          { name: t('categories.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('categories.breadcrumbs.categories'), href: paths.dashboard.assets.inventoryCategories },
          { name: currentCategory?.name || t('categories.breadcrumbs.edit') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <CategoriesInventoryCreateEditForm currentCategory={currentCategory || undefined} />
    </DashboardContent>
  );
}