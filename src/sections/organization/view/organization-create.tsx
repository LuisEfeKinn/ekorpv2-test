'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { OrganizationCreateEditForm } from '../organization-create-edit-form';

// ----------------------------------------------------------------------

export function OrganizationCreateView() {
  const { t } = useTranslate('organization');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('organization.actions.create')}
        links={[
          { name: t('organization.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('organization.breadcrumbs.organizationUnit'), href: paths.dashboard.organizations.organizationalUnitTable },
          { name: t('organization.actions.create') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <OrganizationCreateEditForm />
    </DashboardContent>
  );
}
