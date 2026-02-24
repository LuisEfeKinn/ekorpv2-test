'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { RewardsCreateEditForm } from '../rewards-create-edit-form';

// ----------------------------------------------------------------------

export function RewardsCreateView() {
  const { t } = useTranslate('rewards');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('rewards.breadcrumbs.create')}
        links={[
          { name: t('rewards.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('rewards.breadcrumbs.rewards'), href: paths.dashboard.rewards.rewards },
          { name: t('rewards.breadcrumbs.create') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <RewardsCreateEditForm />
    </DashboardContent>
  );
}