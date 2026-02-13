'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ConfigureTestsCreateEditForm } from '../configure-tests-create-edit-form';

// ----------------------------------------------------------------------

export function ConfigureTestsCreateView() {
  const { t } = useTranslate('performance');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('configure-tests.actions.create')}
        links={[
          { name: t('configure-tests.breadcrumbs.dashboard'), href: paths.dashboard.root },
          {
            name: t('configure-tests.breadcrumbs.configureTests'),
            href: paths.dashboard.performance.configureTests,
          },
          { name: t('configure-tests.breadcrumbs.create') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ConfigureTestsCreateEditForm />
    </DashboardContent>
  );
}
