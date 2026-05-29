'use client';

import type { IJobKm } from 'src/types/organization';

import { useState, useEffect } from 'react';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetJobKmByIdService } from 'src/services/organization/job-km.service';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { PositionCreateEditForm } from '../positions-create-edit-form';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function PositionEditView({ id }: Props) {
  const { t } = useTranslate('organization');
  const [currentPosition, setCurrentPosition] = useState<IJobKm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosition = async () => {
      try {
        setLoading(true);
        const response = await GetJobKmByIdService(id);

        if (response.status === 200) {
          setCurrentPosition(response.data);
        } else {
          setError(t('position.messages.notFound'));
        }
      } catch (err) {
        console.error('Error fetching position:', err);
        setError(t('position.messages.loadError'));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPosition();
    }
  }, [id, t]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('position.actions.edit')}
          links={[
            { name: t('position.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('position.breadcrumbs.positions'), href: paths.dashboard.organizations.positions },
            { name: t('position.breadcrumbs.edit') },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <div>{t('position.messages.error')}: {error}</div>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('position.actions.edit')}
        links={[
          { name: t('position.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('position.breadcrumbs.positions'), href: paths.dashboard.organizations.positions },
          { name: currentPosition?.name || t('position.breadcrumbs.edit') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <PositionCreateEditForm currentPosition={currentPosition || undefined} />
    </DashboardContent>
  );
}