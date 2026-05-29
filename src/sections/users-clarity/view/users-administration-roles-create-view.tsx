'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { RoleCreateEditForm } from 'src/sections/roles/roles-create-edit-form';

export function UsersAdministrationRolesCreateView() {
  const { t } = useTranslate('security');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('roles.actions.create')}
        links={[
          { name: t('roles.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('userAdministration.title'), href: paths.dashboard.userAdministration.usersTable },
          { name: t('roles.title'), href: paths.dashboard.userAdministration.roles },
          { name: t('roles.actions.create') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <RoleCreateEditForm redirectTo={paths.dashboard.userAdministration.roles} />
    </DashboardContent>
  );
}

