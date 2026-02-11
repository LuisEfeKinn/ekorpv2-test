'use client';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { OrganizationalStructureCreateEditDrawer } from '../organizational-structure-create-form';

export function OrganizationalStructureCreateView() {
  const router = useRouter();

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Crear Estructura Organizacional"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Estructura Organizacional', href: paths.dashboard.architecture.organizationalStructureTable },
          { name: 'Crear' },
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
