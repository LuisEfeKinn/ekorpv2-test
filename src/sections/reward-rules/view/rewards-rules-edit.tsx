'use client';

import type { IRewardsRule } from 'src/types/rewards';

import { useState, useEffect } from 'react';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetRewardRuleByIdService } from 'src/services/rewards/rules.service';

import { toast } from 'src/components/snackbar';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { RewardRulesCreateEditForm } from '../rewards-rules-create-edit-form';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function RewardRulesEditView({ id }: Props) {
  const { t } = useTranslate('rewards');
  const [currentRewardRule, setCurrentRewardRule] = useState<IRewardsRule | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReward = async () => {
      try {
        setLoading(true);
        const response: any = await GetRewardRuleByIdService(id);
        if (response?.data) {
          setCurrentRewardRule(response.data.data);
        } else {
          toast.error(t('reward-rules.messages.error.loading'));
        }
      } catch (err) {
        console.error('Error fetching reward:', err);
        toast.error(t('reward-rules.messages.error.loading'));
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchReward();
    }
  }, [id, t]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('reward-rules.actions.edit')}
        links={[
          { name: t('reward-rules.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('reward-rules.breadcrumbs.reward-rules'), href: paths.dashboard.rewards.rewardsRules },
          { name: currentRewardRule?.name || t('reward-rules.breadcrumbs.edit') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <RewardRulesCreateEditForm currentRewardRule={currentRewardRule || undefined} />
    </DashboardContent>
  );
}