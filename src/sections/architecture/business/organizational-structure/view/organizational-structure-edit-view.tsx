'use client';

import type { IOrganizationalUnit } from 'src/types/organization';

import { useState, useEffect } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
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
  const { t } = useTranslate('organization');
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
          heading={t('organization.view.editTitle')}
          links={[
            { name: t('organization.view.dashboard'), href: paths.dashboard.root },
            { name: t('organization.view.list'), href: paths.dashboard.architecture.organizationalStructureTable },
            { name: t('organization.view.edit') },
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
        heading={t('organization.view.editTitle')}
        links={[
          { name: t('organization.view.dashboard'), href: paths.dashboard.root },
          { name: t('organization.view.list'), href: paths.dashboard.architecture.organizationalStructureTable },
          { name: currentUnit?.name || t('organization.view.edit') },
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
