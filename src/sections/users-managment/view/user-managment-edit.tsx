'use client';

import type { IUserManagement } from 'src/types/employees';

import { useState, useEffect } from 'react';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetUserManagmentByIdService } from 'src/services/employees/user-managment.service';

import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { UserManagementCreateEditForm } from '../user-managment-create-edit-form';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function UserManagementEditView({ id }: Props) {
  const { t: tUsers } = useTranslate('employees');
  const { t: tCommon } = useTranslate('common');
  const [currentUser, setCurrentUser] = useState<IUserManagement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Llamar al servicio real para obtener el usuario por ID
        const response = await GetUserManagmentByIdService(id);
        
        if (response?.data?.data) {
          setCurrentUser(response.data.data);
        } else {
          throw new Error('User data not found in response');
        }
      } catch (err: any) {
        console.error('Error fetching user:', err);
        
        // Manejar diferentes tipos de errores
        let errorMessage = tUsers('user-management.messages.error.loading');
        
        if (err?.response?.status === 404) {
          errorMessage = tUsers('user-management.messages.error.notFound');
        } else if (err?.response?.status === 401 || err?.response?.status === 403) {
          errorMessage = 'No tienes permisos para ver este usuario';
        } else if (err?.response?.status >= 500) {
          errorMessage = 'Error interno del servidor. Por favor, contacta al administrador.';
        } else if (err?.code === 'NETWORK_ERROR' || !err?.response) {
          errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
        } else if (err?.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err?.message) {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUser();
    }
  }, [id, tUsers]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading={tUsers('user-management.actions.edit')}
          links={[
            { name: tCommon('breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: tUsers('user-management.breadcrumbs.userManagement'), href: paths.dashboard.employees.userManagment },
            { name: tUsers('user-management.breadcrumbs.edit') },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        
        <EmptyContent
          filled
          title="Error al cargar usuario"
          description={error}
          action={
            <button onClick={() => window.location.reload()}>
              {tCommon('actions.retry')}
            </button>
          }
        />
      </DashboardContent>
    );
  }

  if (!currentUser) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading={tUsers('user-management.actions.edit')}
          links={[
            { name: tCommon('breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: tUsers('user-management.breadcrumbs.userManagement'), href: paths.dashboard.employees.userManagment },
            { name: tUsers('user-management.breadcrumbs.edit') },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        
        <EmptyContent
          title={tUsers('user-management.messages.error.notFound')}
          description="El usuario solicitado no existe o no tienes permisos para verlo"
        />
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={tUsers('user-management.actions.edit')}
        links={[
          { name: tCommon('breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: tUsers('user-management.breadcrumbs.userManagement'), href: paths.dashboard.employees.userManagment },
          { name: currentUser ? `${currentUser.firstName} ${currentUser.firstLastName}` : tUsers('user-management.breadcrumbs.edit') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <UserManagementCreateEditForm currentUser={currentUser || undefined} />
    </DashboardContent>
  );
}