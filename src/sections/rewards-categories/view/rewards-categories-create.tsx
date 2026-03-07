'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { RewardsCategoriesCreateEditForm } from '../rewards-categories-create-edit-form';

// ----------------------------------------------------------------------

export function RewardsCategoriesCreateView() {
  const { t } = useTranslate('rewards');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('rewards-categories.actions.create')}
        links={[
          { name: t('rewards-categories.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('rewards-categories.breadcrumbs.rewards-categories'), href: paths.dashboard.rewards.rewardsCategories },
          { name: t('rewards-categories.breadcrumbs.create') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <RewardsCategoriesCreateEditForm />
    </DashboardContent>
  );
}