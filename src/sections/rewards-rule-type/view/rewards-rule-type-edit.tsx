'use client';

import type { IRewardsRuleType } from 'src/types/rewards';

import { useState, useEffect } from 'react';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetRewardRuleTypeByIdService } from 'src/services/rewards/ruleType.service';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { RewardsRuleTypesCreateEditForm } from '../rewards-rule-type-create-edit-form';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function RewardsRuleTypesEditView({ id }: Props) {
  const { t } = useTranslate('rewards');
  const [currentRewardsRuleType, setCurrentRuleType] = useState<IRewardsRuleType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRewardsCategories = async () => {
      try {
        setLoading(true);
        const response = await GetRewardRuleTypeByIdService(id);
        console.log('Fetch rewards rule type response:', response);
        
        if (response.status === 200) {
          setCurrentRuleType(response.data.data);
        } else {
          setError(t('rewards-rule-types.messages.notFound'));
        }
      } catch (err) {
        console.error('Error fetching rule type:', err);
        setError(t('rewards-rule-types.messages.loadError'));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRewardsCategories();
    }
  }, [id, t]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('rewards-rule-types.actions.edit')}
          links={[
            { name: t('rewards-rule-types.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('rewards-rule-types.breadcrumbs.rewards-rule-types'), href: paths.dashboard.rewards.rewardsRuleType },
            { name: t('rewards-rule-types.breadcrumbs.edit') },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <div>{t('rewards-rule-types.messages.error')}: {error}</div>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('rewards-rule-types.actions.edit')}
        links={[
          { name: t('rewards-rule-types.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('rewards-rule-types.breadcrumbs.rewards-rule-types'), href: paths.dashboard.rewards.rewardsRuleType },
          { name: currentRewardsRuleType?.name || t('rewards-rule-types.breadcrumbs.edit') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <RewardsRuleTypesCreateEditForm currentRuleType={currentRewardsRuleType || undefined} />
    </DashboardContent>
  );
}