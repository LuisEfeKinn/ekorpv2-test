'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { PositionCreateEditForm } from '../positions-create-edit-form';

// ----------------------------------------------------------------------

export function PositionCreateView() {
  const { t } = useTranslate('organization');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('position.actions.create')}
        links={[
          { name: t('position.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('position.breadcrumbs.positions'), href: paths.dashboard.organizations.positions },
          { name: t('position.breadcrumbs.create') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <PositionCreateEditForm />
    </DashboardContent>
  );
}