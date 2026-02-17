'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { EmploymentTypeCreateEditForm } from '../employment-type-create-edit-form';

// ----------------------------------------------------------------------

export function EmploymentTypeCreateView() {
  const { t } = useTranslate('employees');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('employment-type.actions.create')}
        links={[
          { name: t('employment-type.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('employment-type.breadcrumbs.employmentTypes'), href: paths.dashboard.employees.typeEmployment },
          { name: t('employment-type.breadcrumbs.create') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <EmploymentTypeCreateEditForm />
    </DashboardContent>
  );
}