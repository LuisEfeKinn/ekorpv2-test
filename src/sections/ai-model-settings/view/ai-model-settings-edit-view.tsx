'use client';

import type { IAiModelSetting } from 'src/types/ai-model-settings';

import { useState, useEffect } from 'react';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetAIModelSettingByIdService } from 'src/services/ai/AiModelsSettings.service';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { AiModelSettingsNewEditForm } from '../ai-model-settings-new-edit-form';

// ----------------------------------------------------------------------

type Props = {
  providerId: string;
  modelId: string;
  providerName?: string;
};

export function AiModelSettingsEditView({ providerId, modelId, providerName }: Props) {
  const { t } = useTranslate('ai');
  const [currentModel, setCurrentModel] = useState<IAiModelSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModel = async () => {
      try {
        setLoading(true);
        const response = await GetAIModelSettingByIdService(modelId);

        if (response.data.statusCode === 200) {
          setCurrentModel(response.data.data);
        } else {
          setError(t('models.messages.error.notFound'));
        }
      } catch (err) {
        console.error('Error fetching model:', err);
        setError(t('models.messages.error.loadError'));
      } finally {
        setLoading(false);
      }
    };

    if (modelId) {
      fetchModel();
    }
  }, [modelId, t]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('models.actions.edit')}
          links={[
            { name: t('models.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('models.breadcrumbs.ai') },
            { name: t('models.breadcrumbs.providers'), href: paths.dashboard.ai.providerSettings.root },
            { name: providerName || t('models.breadcrumbs.provider') },
            { name: t('models.title'), href: paths.dashboard.ai.modelsSettings.root(providerId) },
            { name: t('models.breadcrumbs.edit') },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <div>{t('models.messages.error.general')}: {error}</div>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('models.actions.edit')}
        links={[
          { name: t('models.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('models.breadcrumbs.ai') },
          { name: t('models.breadcrumbs.providers'), href: paths.dashboard.ai.providerSettings.root },
          { name: providerName || t('models.breadcrumbs.provider') },
          { name: t('models.title'), href: paths.dashboard.ai.modelsSettings.root(providerId) },
          { name: currentModel?.name || t('models.breadcrumbs.edit') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <AiModelSettingsNewEditForm providerId={providerId} currentModel={currentModel} />
    </DashboardContent>
  );
}
