'use client';

import type { IConfigureTest } from 'src/types/performance';

import { useState, useEffect } from 'react';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetConfigureTestsByIdService } from 'src/services/performance/configure-tests.service';

import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ConfigureTestsCreateEditForm } from '../configure-tests-create-edit-form';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function ConfigureTestsEditView({ id }: Props) {
  const { t } = useTranslate('performance');
  const { t: tCommon } = useTranslate('common');
  const [currentTest, setCurrentTest] = useState<IConfigureTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTest = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await GetConfigureTestsByIdService(id);

        if (response?.data?.data) {
          setCurrentTest(response.data.data);
        } else {
          throw new Error('Template data not found in response');
        }
      } catch (err: any) {
        console.error('Error fetching template:', err);

        let errorMessage = t('configure-tests.messages.error.loading');

        if (err?.response?.status === 404) {
          errorMessage = t('configure-tests.messages.error.notFound');
        } else if (err?.response?.status === 401 || err?.response?.status === 403) {
          errorMessage = 'No tienes permisos para ver esta plantilla';
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
      fetchTest();
    }
  }, [id, t]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('configure-tests.actions.edit')}
          links={[
            { name: t('configure-tests.breadcrumbs.dashboard'), href: paths.dashboard.root },
            {
              name: t('configure-tests.breadcrumbs.configureTests'),
              href: paths.dashboard.performance.configureTests,
            },
            { name: t('configure-tests.breadcrumbs.edit') },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <EmptyContent
          filled
          title="Error al cargar plantilla"
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

  if (!currentTest) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('configure-tests.actions.edit')}
          links={[
            { name: t('configure-tests.breadcrumbs.dashboard'), href: paths.dashboard.root },
            {
              name: t('configure-tests.breadcrumbs.configureTests'),
              href: paths.dashboard.performance.configureTests,
            },
            { name: t('configure-tests.breadcrumbs.edit') },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <EmptyContent
          title={t('configure-tests.messages.error.notFound')}
          description="La plantilla solicitada no existe o no tienes permisos para verla"
        />
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={`${t('configure-tests.actions.edit')} ${currentTest ? ` ${currentTest.name}` : ''}`}
        links={[
          { name: t('configure-tests.breadcrumbs.dashboard'), href: paths.dashboard.root },
          {
            name: t('configure-tests.breadcrumbs.configureTests'),
            href: paths.dashboard.performance.configureTests,
          },
          {
            name: currentTest ? currentTest.name : t('configure-tests.breadcrumbs.edit'),
          },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ConfigureTestsCreateEditForm currentTest={currentTest || undefined} />
    </DashboardContent>
  );
}
