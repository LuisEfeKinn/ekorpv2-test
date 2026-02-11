'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ProcessCreateEditForm } from '../processes-create-edit-form';

// ----------------------------------------------------------------------

export function ProcessCreateView() {
  const { t } = useTranslate('architecture');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('process.table.actions.create')}
        links={[
          { name: t('process.table.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('process.table.title'), href: paths.dashboard.architecture.processesTable },
          { name: t('process.table.breadcrumbs.create') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ProcessCreateEditForm />
    </DashboardContent>
  );
}