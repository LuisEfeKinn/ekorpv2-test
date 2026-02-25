'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { RewardRulesCreateEditForm } from '../rewards-rules-create-edit-form';

// ----------------------------------------------------------------------

export function RewardRulesCreateView() {
  const { t } = useTranslate('rewards');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('rewards.breadcrumbs.create')}
        links={[
          { name: t('rewards.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('reward-rules.breadcrumbs.reward-rules'), href: paths.dashboard.rewards.rewardsRules },
          { name: t('rewards.breadcrumbs.create') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <RewardRulesCreateEditForm />
    </DashboardContent>
  );
}