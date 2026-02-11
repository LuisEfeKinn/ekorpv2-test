'use client';

import type { IVigency } from 'src/types/organization';

import { useState, useEffect } from 'react';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetVigenciesByIdService } from 'src/services/organization/vigencies.service';

import { toast } from 'src/components/snackbar';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { VigenciesCreateEditForm } from '../vigencies-create-edit-form';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function VigenciesEditView({ id }: Props) {
  const { t } = useTranslate('organization');
  const [currentVigency, setCurrentVigency] = useState<IVigency | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVigency = async () => {
      try {
        setLoading(true);
        const response: any = await GetVigenciesByIdService(id);
        if (response?.data) {
          setCurrentVigency(response.data.data);
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
        heading={t('vigencies.actions.edit')}
        links={[
          { name: t('vigencies.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('vigencies.breadcrumbs.vigencies'), href: paths.dashboard.organizations.vigencies },
          { name: currentVigency?.name || t('vigencies.breadcrumbs.edit') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <VigenciesCreateEditForm currentVigency={currentVigency || undefined} />
    </DashboardContent>
  );
}