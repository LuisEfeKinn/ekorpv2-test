'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { OrganizationalStructureCreateForm } from '../organizational-structure-create-form';

export function OrganizationalStructureCreateView() {
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

      <OrganizationalStructureCreateForm />
    </DashboardContent>
  );
}
