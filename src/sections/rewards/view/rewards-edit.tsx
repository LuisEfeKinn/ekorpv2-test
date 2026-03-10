'use client';

import type { IReward } from 'src/types/rewards';

import { useState, useEffect } from 'react';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetRewardsByIdService } from 'src/services/rewards/rewards.service';

import { toast } from 'src/components/snackbar';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { RewardsCreateEditForm } from '../rewards-create-edit-form';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function RewardsEditView({ id }: Props) {
  const { t } = useTranslate('rewards');
  const [currentReward, setCurrentReward] = useState<IReward | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReward = async () => {
      try {
        setLoading(true);
        const response: any = await GetRewardsByIdService(id);
        if (response?.data) {
          setCurrentReward(response.data.data);
        } else {
          toast.error(t('rewards.messages.error.loading'));
        }
      } catch (err) {
        console.error('Error fetching reward:', err);
        toast.error(t('rewards.messages.error.loading'));
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
        heading={t('rewards.actions.edit')}
        links={[
          { name: t('rewards.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('rewards.breadcrumbs.rewards'), href: paths.dashboard.rewards.rewards },
          { name: currentReward?.name || t('rewards.breadcrumbs.edit') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <RewardsCreateEditForm currentReward={currentReward || undefined} />
    </DashboardContent>
  );
}