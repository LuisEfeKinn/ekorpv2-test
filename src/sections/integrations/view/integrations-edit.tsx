'use client';

import type {
  IIntegrationFormData,
  IIntegrationTemplate,
  IIntegrationInstanceResponse,
} from 'src/types/settings';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  GetIntegrationsByIdService,
  GetAllDefaultParametersService,
  SaveOrUpdateIntegrationsService,
} from 'src/services/settings/integrations.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { IntegrationsCreateEditForm } from '../integrations-create-edit-form';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function IntegrationsEditView({ id }: Props) {
  const { t } = useTranslate('settings');
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [integrations, setIntegrations] = useState<IIntegrationTemplate[]>([]);
  const [instanceData, setInstanceData] = useState<IIntegrationInstanceResponse | null>(null);

  // Cargar las integraciones disponibles (plantillas)
  const loadIntegrations = useCallback(async () => {
    try {
      const response = await GetAllDefaultParametersService();
      if (response.data) {
        setIntegrations(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading integrations:', error);
      toast.error(t('integrations.messages.error.loading'));
    }
  }, [t]);

  // Cargar datos de la instancia
  const loadInstanceData = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await GetIntegrationsByIdService(id);

      if (response.status === 200) {
        setInstanceData(response.data?.data || null);
      } else {
        toast.error(t('integrations.messages.error.notFound'));
        router.push(paths.dashboard.settings.integrations);
      }
    } catch (error) {
      console.error('Error loading instance data:', error);
      toast.error(t('integrations.messages.error.loadingDetails'));
      router.push(paths.dashboard.settings.integrations);
    } finally {
      setLoading(false);
    }
  }, [id, t, router]);

  useEffect(() => {
    loadIntegrations();
    loadInstanceData();
  }, [loadIntegrations, loadInstanceData]);

  // Manejar envío del formulario
  const handleSubmit = useCallback(
    async (formData: IIntegrationFormData) => {
      if (!id || !instanceData) return;

      try {
        setSaving(true);

        const response = await SaveOrUpdateIntegrationsService(formData, id);

        if (response.status === 200) {
          toast.success(t('integrations.messages.success.updated'));
          router.push(paths.dashboard.settings.integrations);
        }
      } catch (error: any) {
        console.error('Error updating integration:', error);
        toast.error(t(error?.message) || t('integrations.messages.error.updating'));
      } finally {
        setSaving(false);
      }
    },
    [id, instanceData, t, router]
  );

  // Manejar cancelación
  const handleCancel = useCallback(() => {
    router.push(paths.dashboard.settings.integrations);
  }, [router]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!instanceData || integrations.length === 0) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('integrations.messages.error.notFound')}
          links={[
            { name: t('integrations.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('integrations.title'), href: paths.dashboard.settings.integrations },
            { name: t('integrations.form.title.edit') },
          ]}
          sx={{ mb: 3 }}
        />
        <Box sx={{ textAlign: 'center', py: 5 }}>
          {t('integrations.messages.error.notFound')}
        </Box>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={instanceData.instance.name}
        links={[
          { name: t('integrations.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('integrations.title'), href: paths.dashboard.settings.integrations },
          { name: t('integrations.form.title.edit') },
        ]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:download-bold" />}
            onClick={() => router.push(paths.dashboard.settings.categoryList(id))}
          >
            {t('integrations.actions.viewCategories')}
          </Button>
        }
        sx={{ mb: 3 }}
      />

      <IntegrationsCreateEditForm
        integrations={integrations}
        currentInstance={instanceData}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={saving}
        isEdit
      />
    </DashboardContent>
  );
}
