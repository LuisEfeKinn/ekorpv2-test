'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { UsersGeneral } from '../users-general';

// ----------------------------------------------------------------------

export function UsersCreateView() {
  const { t } = useTranslate('security');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('users.actions.create')}
        links={[
          { name: t('users.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('users.breadcrumbs.users'), href: paths.dashboard.security.users },
          { name: t('users.actions.create') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <UsersGeneral />
    </DashboardContent>
  );
}