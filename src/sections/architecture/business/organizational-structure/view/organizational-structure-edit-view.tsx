'use client';

import type { IOrganizationalUnit } from 'src/types/organization';

import { useState, useEffect } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';
import { GetOrganizationalUnitByIdService } from 'src/services/organization/organizationalUnit.service';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { OrganizationalStructureCreateEditDrawer } from '../organizational-structure-create-form';

type Props = {
  id: string;
};

export function OrganizationalStructureEditView({ id }: Props) {
  const router = useRouter();
  const [currentUnit, setCurrentUnit] = useState<IOrganizationalUnit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUnit = async () => {
      try {
        setLoading(true);
        const response = await GetOrganizationalUnitByIdService(id);
        if (response.status === 200) {
          setCurrentUnit(response.data);
        } else {
          setError('No se encontró la estructura organizacional');
        }
      } catch {
        setError('Error al cargar la estructura organizacional');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUnit();
    }
  }, [id]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Editar Estructura Organizacional"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Estructura Organizacional', href: paths.dashboard.architecture.organizationalStructureTable },
            { name: 'Editar' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <div>{error}</div>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Editar Estructura Organizacional"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Estructura Organizacional', href: paths.dashboard.architecture.organizationalStructureTable },
          { name: currentUnit?.name || 'Editar' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <OrganizationalStructureCreateEditDrawer
        open
        onClose={() => router.back()}
        onSuccess={() => router.push(paths.dashboard.architecture.organizationalStructureTable)}
        currentOrganizationalUnit={currentUnit}
      />
    </DashboardContent>
  );
}
