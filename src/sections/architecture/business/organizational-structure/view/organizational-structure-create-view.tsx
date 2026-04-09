'use client';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { OrganizationalStructureCreateEditDrawer } from '../organizational-structure-create-form';

export function OrganizationalStructureCreateView() {
  const router = useRouter();
  const { t } = useTranslate('organization');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('organization.view.createTitle')}
        links={[
          { name: t('organization.view.dashboard'), href: paths.dashboard.root },
          { name: t('organization.view.list'), href: paths.dashboard.architecture.organizationalStructureTable },
          { name: t('organization.view.create') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <OrganizationalStructureCreateEditDrawer
        open
        onClose={() => router.back()}
        onSuccess={() => router.push(paths.dashboard.architecture.organizationalStructureTable)}
      />
    </DashboardContent>
  );
}
