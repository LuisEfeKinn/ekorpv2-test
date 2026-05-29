'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { StrategicObjectivesCreateForm } from '../strategic-objectives-create-form';

export function StrategicObjectivesCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Crear Objetivo Estratégico"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Objetivos Estratégicos', href: paths.dashboard.architecture.strategicObjectivesTable },
          { name: 'Crear' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <StrategicObjectivesCreateForm />
    </DashboardContent>
  );
}
