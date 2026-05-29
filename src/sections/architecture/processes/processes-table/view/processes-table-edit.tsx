'use client';

import type { IProcessTable } from 'src/types/architecture/process';

import { useState, useEffect } from 'react';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetProcessTableByIdService } from 'src/services/architecture/process/processTable.service';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ProcessCreateEditForm } from '../processes-create-edit-form';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function ProcessTableEditView({ id }: Props) {
  const { t } = useTranslate('architecture');
  const [currentProcess, setCurrentProcess] = useState<IProcessTable | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProcessTable = async () => {
      try {
        setLoading(true);
        const response = await GetProcessTableByIdService(id);
        console.log('Fetch process table response:', response);
        
        if (response.status === 200) {
          setCurrentProcess(response.data);
        } else {
          setError(t('process.table.messages.notFound'));
        }
      } catch (err) {
        console.error('Error fetching process table:', err);
        setError(t('process.table.messages.loadError'));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProcessTable();
    }
  }, [id, t]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('process.table.actions.edit')}
          links={[
            { name: t('process.table.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('process.table.actions.edit'), href: paths.dashboard.architecture.processesTable },
            { name: t('process.table.breadcrumbs.edit') },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <div>{t('process.table.messages.error')}: {error}</div>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('process.table.actions.edit')}
        links={[
          { name: t('process.table.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('process.table.breadcrumbs.list'), href: paths.dashboard.architecture.processesTable },
          { name: currentProcess?.name || t('process.table.breadcrumbs.edit') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ProcessCreateEditForm currentProcess={currentProcess || undefined} />
    </DashboardContent>
  );
}