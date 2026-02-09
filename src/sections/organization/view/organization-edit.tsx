'use client';

import type { IOrganization } from 'src/types/organization';

import { useState, useEffect } from 'react';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetOrganizationalUnitByIdService } from 'src/services/organization/organizationalUnit.service';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { OrganizationCreateEditForm } from '../organization-create-edit-form';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function OrganizationEditView({ id }: Props) {
  const { t } = useTranslate('organization');
  const [currentOrganization, setCurrentOrganization] = useState<IOrganization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        setLoading(true);
        const response = await GetOrganizationalUnitByIdService(id);
        
        if (response.status === 200) {
          setCurrentOrganization(response.data);
        } else {
          setError(t('organization.messages.notFound'));
        }
      } catch (err) {
        console.error('Error fetching organization:', err);
        setError(t('organization.messages.loadError'));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrganization();
    }
  }, [id, t]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('organization.actions.edit')}
          links={[
            { name: t('organization.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('organization.breadcrumbs.organizationUnit'), href: paths.dashboard.organizations.organizationalUnitTable },
            { name: t('organization.breadcrumbs.edit') },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <div>{t('organization.messages.error')}: {error}</div>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('organization.actions.edit')}
        links={[
          { name: t('organization.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('organization.breadcrumbs.organizationUnit'), href: paths.dashboard.organizations.organizationalUnitTable },
          { name: currentOrganization?.name || t('organization.breadcrumbs.edit') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <OrganizationCreateEditForm currentOrganization={currentOrganization || undefined} />
    </DashboardContent>
  );
}
