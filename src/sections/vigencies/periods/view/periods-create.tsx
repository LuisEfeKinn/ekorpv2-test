'use client';

import { useState, useEffect } from 'react';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetVigenciesByIdService } from 'src/services/organization/vigencies.service';

import { toast } from 'src/components/snackbar';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { PeriodsCreateEditForm } from '../periods-create-edit-form';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function PeriodsCreateView({ id }: Props) {
  const { t } = useTranslate('organization');
  const [vigencyName, setVigencyName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVigency = async () => {
      try {
        setLoading(true);
        const response: any = await GetVigenciesByIdService(id);
        if (response?.data) {
          setVigencyName(response.data.data.name);
        } else {
          toast.error(t('vigencies.messages.error.loading'));
        }
      } catch (err) {
        console.error('Error fetching vigency:', err);
        toast.error(t('vigencies.messages.error.loading'));
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchVigency();
    }
  }, [id, t]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('periods.breadcrumbs.create')}
        links={[
          { name: t('periods.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('periods.breadcrumbs.vigencies'), href: paths.dashboard.organizations.vigencies },
          { name: vigencyName, href: paths.dashboard.organizations.vigenciesPeriods(id) },
          { name: t('periods.breadcrumbs.periods'), href: paths.dashboard.organizations.vigenciesPeriods(id) },
          { name: t('periods.breadcrumbs.create') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <PeriodsCreateEditForm vigencyId={id} />
    </DashboardContent>
  );
}
