'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { UsersClarityCreateForm } from '../users-clarity-create-form';

export function UsersClarityCreateView() {
  const { t } = useTranslate('security');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('usersClarity.title')}
        links={[
          { name: t('usersClarity.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('userAdministration.title'), href: paths.dashboard.userAdministration.usersTable },
          { name: t('usersClarity.form.sections.systemUsers') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <UsersClarityCreateForm />
    </DashboardContent>
  );
}

