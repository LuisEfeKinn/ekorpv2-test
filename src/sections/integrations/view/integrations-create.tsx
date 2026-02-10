'use client';

import type { IIntegrationFormData, IIntegrationTemplate } from 'src/types/settings';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  GetAllDefaultParametersService,
  SaveOrUpdateIntegrationsService,
} from 'src/services/settings/integrations.service';

import { toast } from 'src/components/snackbar';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { IntegrationsCreateEditForm } from '../integrations-create-edit-form';

// ----------------------------------------------------------------------

export function IntegrationsCreateView() {
  const { t } = useTranslate('settings');
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [integrations, setIntegrations] = useState<IIntegrationTemplate[]>([]);

  // Cargar las integraciones disponibles (plantillas)
  const loadIntegrations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await GetAllDefaultParametersService();

      if (response.data) {
        setIntegrations(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading integrations:', error);
      toast.error(t('integrations.messages.error.loading'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  // Manejar envío del formulario
  const handleSubmit = useCallback(
    async (formData: IIntegrationFormData) => {
      try {
        setSaving(true);

        const response = await SaveOrUpdateIntegrationsService(formData);

        if (response.status === 200 || response.status === 201) {
          toast.success(t('integrations.messages.success.created'));
          router.push(paths.dashboard.settings.integrations);
        }
      } catch (error) {
        console.error('Error creating integration:', error);
        toast.error(t('integrations.messages.error.creating'));
      } finally {
        setSaving(false);
      }
    },
    [t, router]
  );

  // Manejar cancelación
  const handleCancel = useCallback(() => {
    router.push(paths.dashboard.settings.integrations);
  }, [router]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (integrations.length === 0) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('integrations.form.title.create')}
          links={[
            { name: t('integrations.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('integrations.title'), href: paths.dashboard.settings.integrations },
            { name: t('integrations.form.title.create') },
          ]}
          sx={{ mb: 3 }}
        />
        <Box sx={{ textAlign: 'center', py: 5 }}>
          {t('integrations.messages.error.noIntegrationsAvailable')}
        </Box>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('integrations.form.title.create')}
        links={[
          { name: t('integrations.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('integrations.title'), href: paths.dashboard.settings.integrations },
          { name: t('integrations.form.title.create') },
        ]}
        sx={{ mb: 3 }}
      />

      <IntegrationsCreateEditForm
        integrations={integrations}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={saving}
        isEdit={false}
      />
    </DashboardContent>
  );
}
