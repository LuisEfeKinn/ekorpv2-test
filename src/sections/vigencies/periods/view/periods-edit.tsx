'use client';

import type { IPeriod } from 'src/types/organization';

import { useState, useEffect } from 'react';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetPeriodsByIdService } from 'src/services/organization/vigencies.service';

import { toast } from 'src/components/snackbar';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { PeriodsCreateEditForm } from '../periods-create-edit-form';

// ----------------------------------------------------------------------

type Props = {
  id: string;
  periodId: string;
};

export function PeriodsEditView({ id, periodId }: Props) {
  const { t } = useTranslate('organization');
  const [currentPeriod, setCurrentPeriod] = useState<IPeriod | null>(null);
  const [vigencyName, setVigencyName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPeriod = async () => {
      try {
        setLoading(true);
        const response: any = await GetPeriodsByIdService(periodId);
        if (response?.data) {
          setCurrentPeriod(response.data.data);
          if (response.data.data.vigency) {
            setVigencyName(response.data.data.vigency.name);
          }
        } else {
          toast.error(t('periods.messages.error.loading'));
        }
      } catch (err) {
        console.error('Error fetching period:', err);
        toast.error(t('periods.messages.error.loading'));
      } finally {
        setLoading(false);
      }
    };
    if (periodId) {
      fetchPeriod();
    }
  }, [periodId, t]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('periods.actions.edit')}
        links={[
          { name: t('periods.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('periods.breadcrumbs.vigencies'), href: paths.dashboard.organizations.vigencies },
          { name: vigencyName, href: paths.dashboard.organizations.vigenciesPeriods(id) },
          { name: t('periods.breadcrumbs.periods'), href: paths.dashboard.organizations.vigenciesPeriods(id) },
          { name: currentPeriod?.name || t('periods.breadcrumbs.edit') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <PeriodsCreateEditForm vigencyId={id} currentPeriod={currentPeriod || undefined} />
    </DashboardContent>
  );
}
