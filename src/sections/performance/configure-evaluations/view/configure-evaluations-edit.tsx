'use client';

import type { IConfigureEvaluation } from 'src/types/performance';

import { useState, useEffect } from 'react';

import { Button } from '@mui/material';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetConfigureEvaluationByIdService } from 'src/services/performance/configure-evaluations.service';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ConfigureEvaluationsCreateEditForm } from '../configure-evaluations-create-edit-form';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function ConfigureEvaluationsEditView({ id }: Props) {
  const { t } = useTranslate('performance');
  const { t: tCommon } = useTranslate('common');
  const [currentEvaluation, setCurrentEvaluation] = useState<IConfigureEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvaluation = async () => {
      try {
        setLoading(true);
        setError(null);

        // Llamar al servicio real para obtener la evaluación por ID
        const response = await GetConfigureEvaluationByIdService(id);

        if (response?.data?.data) {
          setCurrentEvaluation(response.data.data);
        } else {
          throw new Error('Evaluation data not found in response');
        }
      } catch (err: any) {
        console.error('Error fetching evaluation:', err);

        // Manejar diferentes tipos de errores
        let errorMessage = t('configure-evaluations.messages.error.loading');

        if (err?.response?.status === 404) {
          errorMessage = t('configure-evaluations.messages.error.notFound');
        } else if (err?.response?.status === 401 || err?.response?.status === 403) {
          errorMessage = 'No tienes permisos para ver esta evaluación';
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
      fetchEvaluation();
    }
  }, [id, t]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('configure-evaluations.actions.edit')}
          links={[
            { name: t('configure-evaluations.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('configure-evaluations.breadcrumbs.configureEvaluations'), href: paths.dashboard.performance.configureEvaluations },
            { name: t('configure-evaluations.breadcrumbs.edit') },
          ]}
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.performance.configureEvaluationsParticipants(id)}
              variant="contained"
              startIcon={<Iconify icon="solar:eye-scan-bold" />}
            >
              {t('configure-evaluations.actions.viewParticipants')}
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <EmptyContent
          filled
          title="Error al cargar evaluación"
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

  if (!currentEvaluation) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('configure-evaluations.actions.edit')}
          links={[
            { name: t('configure-evaluations.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('configure-evaluations.breadcrumbs.configureEvaluations'), href: paths.dashboard.performance.configureEvaluations },
            { name: t('configure-evaluations.breadcrumbs.edit') },
          ]}
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.performance.configureEvaluationsParticipants(id)}
              variant="contained"
              startIcon={<Iconify icon="solar:eye-scan-bold" />}
            >
              {t('configure-evaluations.actions.viewParticipants')}
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <EmptyContent
          title={t('configure-evaluations.messages.error.notFound')}
          description="La evaluación solicitada no existe o no tienes permisos para verla"
        />
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={`${t('configure-evaluations.actions.edit')} ${currentEvaluation ? ` ${currentEvaluation.name}` : ''}`}
        links={[
          { name: t('configure-evaluations.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('configure-evaluations.breadcrumbs.configureEvaluations'), href: paths.dashboard.performance.configureEvaluations },
          { name: currentEvaluation ? currentEvaluation.name : t('configure-evaluations.breadcrumbs.edit') },
        ]}
        action={
          <>
            <Button
              component={RouterLink}
              href={paths.dashboard.performance.configureEvaluationsParticipants(id)}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              {t('configure-evaluations.actions.assingnParticipants')}
            </Button>
            <Button
              component={RouterLink}
              href={paths.dashboard.performance.listParticipantsWithEvaluators(id)}
              variant="contained"
              startIcon={<Iconify icon="solar:eye-scan-bold" />}
            >
              {t('configure-evaluations.actions.viewParticipants')}
            </Button>
          </>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ConfigureEvaluationsCreateEditForm currentEvaluation={currentEvaluation || undefined} />
    </DashboardContent>
  );
}