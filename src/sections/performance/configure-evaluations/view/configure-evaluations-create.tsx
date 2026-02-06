'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ConfigureEvaluationsCreateEditForm } from '../configure-evaluations-create-edit-form';

// ----------------------------------------------------------------------

export function ConfigureEvaluationsCreateView() {
  const { t: tUsers } = useTranslate('performance');
  const { t: tCommon } = useTranslate('common');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={tUsers('user-management.actions.create')}
        links={[
          { name: tCommon('breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: tUsers('configure-evaluations.breadcrumbs.configureEvaluations'), href: paths.dashboard.performance.configureEvaluations },
          { name: tUsers('configure-evaluations.breadcrumbs.create') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ConfigureEvaluationsCreateEditForm />
    </DashboardContent>
  );
}