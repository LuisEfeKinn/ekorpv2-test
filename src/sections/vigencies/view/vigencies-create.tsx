'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { VigenciesCreateEditForm } from '../vigencies-create-edit-form';

// ----------------------------------------------------------------------

export function VigenciesCreateView() {
  const { t } = useTranslate('organization');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('vigencies.breadcrumbs.create')}
        links={[
          { name: t('vigencies.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('vigencies.breadcrumbs.vigencies'), href: paths.dashboard.organizations.vigencies },
          { name: t('vigencies.breadcrumbs.create') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <VigenciesCreateEditForm />
    </DashboardContent>
  );
}