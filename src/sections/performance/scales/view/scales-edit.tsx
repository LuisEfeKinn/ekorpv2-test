'use client';

import type { IScale } from 'src/types/performance';

import { useState, useEffect } from 'react';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetScaleByIdService } from 'src/services/performance/scales.service';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ScalesCreateEditForm } from '../scales-create-edit-form';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function ScalesEditView({ id }: Props) {
  const { t } = useTranslate('performance');
  const [currentScale, setCurrentScale] = useState<IScale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScale = async () => {
      try {
        setLoading(true);
        const response = await GetScaleByIdService(id);
        setCurrentScale(response?.data?.data);
      } catch (err) {
        console.error('Error fetching scale:', err);
        setError(t('scales.messages.error.loadError'));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchScale();
    }
  }, [id, t]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('scales.actions.edit')}
          links={[
            { name: t('scales.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('scales.breadcrumbs.scales'), href: paths.dashboard.performance.scales },
            { name: t('scales.breadcrumbs.edit') },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <div>{error}</div>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('scales.actions.edit')}
        links={[
          { name: t('scales.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('scales.breadcrumbs.scales'), href: paths.dashboard.performance.scales },
          { name: currentScale?.name || t('scales.breadcrumbs.edit') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ScalesCreateEditForm currentScale={currentScale || undefined} />
    </DashboardContent>
  );
}