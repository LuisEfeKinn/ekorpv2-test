'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { RewardsRuleTypesCreateEditForm } from '../rewards-rule-type-create-edit-form';

// ----------------------------------------------------------------------

export function RewardsRuleTypesCreateView() {
  const { t } = useTranslate('rewards');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('rewards-rule-types.actions.create')}
        links={[
          { name: t('rewards-rule-types.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('rewards-rule-types.breadcrumbs.rewards-rule-types'), href: paths.dashboard.rewards.rewardsRuleType },
          { name: t('rewards-rule-types.breadcrumbs.create') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <RewardsRuleTypesCreateEditForm />
    </DashboardContent>
  );
}