'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { RoleCreateEditForm } from '../roles-create-edit-form';

// ----------------------------------------------------------------------

export function RoleCreateView() {
  const { t } = useTranslate('security');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('roles.actions.create')}
        links={[
          { name: t('roles.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('roles.breadcrumbs.roles'), href: paths.dashboard.security.roles },
          { name: t('roles.actions.create') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <RoleCreateEditForm />
    </DashboardContent>
  );
}