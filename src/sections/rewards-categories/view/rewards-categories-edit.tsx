'use client';

import type { IRewardsCategories } from 'src/types/rewards';

import { useState, useEffect } from 'react';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetRewardCategoryByIdService } from 'src/services/rewards/rewardCategory.service';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { RewardsCategoriesCreateEditForm } from '../rewards-categories-create-edit-form';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function RewardsCategoriesEditView({ id }: Props) {
  const { t } = useTranslate('rewards');
  const [currentRewardsCategories, setCurrentPosition] = useState<IRewardsCategories | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRewardsCategories = async () => {
      try {
        setLoading(true);
        const response = await GetRewardCategoryByIdService(id);
        console.log('Fetch rewards categories response:', response);
        
        if (response.status === 200) {
          setCurrentPosition(response.data.data);
        } else {
          setError(t('rewards-categories.messages.notFound'));
        }
      } catch (err) {
        console.error('Error fetching position:', err);
        setError(t('rewards-categories.messages.loadError'));
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
          heading={t('rewards-categories.actions.edit')}
          links={[
            { name: t('rewards-categories.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('rewards-categories.breadcrumbs.rewards-categories'), href: paths.dashboard.rewards.rewardsCategories },
            { name: t('rewards-categories.breadcrumbs.edit') },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <div>{t('rewards-categories.messages.error')}: {error}</div>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('rewards-categories.actions.edit')}
        links={[
          { name: t('rewards-categories.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('rewards-categories.breadcrumbs.rewards-categories'), href: paths.dashboard.rewards.rewardsCategories },
          { name: currentRewardsCategories?.name || t('rewards-categories.breadcrumbs.edit') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <RewardsCategoriesCreateEditForm currentCategory={currentRewardsCategories || undefined} />
    </DashboardContent>
  );
}