'use client';

import type { IRole } from 'src/types/roles';

import { useState, useEffect } from 'react';

import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetRolesByIdService } from 'src/services/security/roles.service';

import { Iconify } from 'src/components/iconify';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { PermissionsTable } from '../permissions-table';

// ----------------------------------------------------------------------

type Props = {
  roleId: string;
};

export function PermissionsRoleView({ roleId }: Props) {
  const { t } = useTranslate('security');
  const [roleData, setRoleData] = useState<IRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        setLoading(true);
        const response = await GetRolesByIdService(roleId);

        if (response.data?.data) {
          setRoleData(response.data.data);
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

    if (roleId) {
      fetchRole();
    }
  }, [roleId, t]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('permissions.title')}
          links={[
            { name: t('users.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('roles.title'), href: paths.dashboard.security.roles },
            { name: t('permissions.title') },
          ]}
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.security.roles}
              variant="outlined"
              startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
            >
              {t('roles.actions.back')}
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>{error}</p>
        </div>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={`${t('permissions.title')} - ${roleData?.name || ''}`}
        links={[
          { name: t('users.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('roles.title'), href: paths.dashboard.security.roles },
          { name: roleData?.name || t('permissions.title') },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.security.roles}
            variant="outlined"
            startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
          >
            {t('roles.actions.back')}
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <PermissionsTable
        roleId={roleId}
        roleName={roleData?.name}
        isDefault={roleData?.isDefault}
      />
    </DashboardContent>
  );
}
