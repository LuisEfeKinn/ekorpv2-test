'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { UserManagementCreateEditForm } from '../user-managment-create-edit-form';

// ----------------------------------------------------------------------

export function UserManagementCreateView() {
  const { t: tUsers } = useTranslate('employees');
  const { t: tCommon } = useTranslate('common');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={tUsers('user-management.actions.create')}
        links={[
          { name: tCommon('breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: tUsers('user-management.breadcrumbs.userManagement'), href: paths.dashboard.employees.userManagment },
          { name: tUsers('user-management.breadcrumbs.create') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <UserManagementCreateEditForm />
    </DashboardContent>
  );
}