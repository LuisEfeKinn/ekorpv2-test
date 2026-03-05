'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ScalesCreateEditForm } from '../scales-create-edit-form';

// ----------------------------------------------------------------------

export function ScalesCreateView() {
  const { t } = useTranslate('performance');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('scales.actions.create')}
        links={[
          { name: t('scales.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('scales.breadcrumbs.scales'), href: paths.dashboard.performance.scales },
          { name: t('scales.breadcrumbs.create') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ScalesCreateEditForm />
    </DashboardContent>
  );
}