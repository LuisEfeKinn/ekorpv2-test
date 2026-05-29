'use client';

import type { IRole } from 'src/types/roles';

import { useState, useEffect } from 'react';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetRolesByIdService } from 'src/services/security/roles.service';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { RoleCreateEditForm } from '../roles-create-edit-form';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function RoleEditView({ id }: Props) {
  const { t } = useTranslate('security');
  const [currentRole, setCurrentRole] = useState<IRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        setLoading(true);
        const response = await GetRolesByIdService(id);
        
        if (response.data.statusCode === 200) {
          setCurrentRole(response.data.data);
        } else {
          setError(t('roles.messages.error.notFound'));
        }
      } catch (err) {
        console.error('Error fetching role:', err);
        setError(t('roles.messages.error.loading'));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRole();
    }
  }, [id, t]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('roles.actions.edit')}
          links={[
            { name: t('roles.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('roles.breadcrumbs.roles'), href: paths.dashboard.security.roles },
            { name: t('roles.actions.edit') },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <div>{t('roles.messages.error.loading')}: {error}</div>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('roles.actions.edit')}
        links={[
          { name: t('roles.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('roles.breadcrumbs.roles'), href: paths.dashboard.security.roles },
          { name: currentRole?.name || t('roles.actions.edit') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <RoleCreateEditForm currentRole={currentRole || undefined} />
    </DashboardContent>
  );
}