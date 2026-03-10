'use client';

import type { IAiProviderSetting } from 'src/types/ai-provider-settings';

import { useState, useEffect } from 'react';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetAIProviderSettingByIdService } from 'src/services/ai/AiProviderSettings.service';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { AiProviderSettingsNewEditForm } from '../ai-provider-settings-new-edit-form';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function AiProviderSettingsEditView({ id }: Props) {
  const { t } = useTranslate('ai');
  const [currentSetting, setCurrentSetting] = useState<IAiProviderSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSetting = async () => {
      try {
        setLoading(true);
        const response = await GetAIProviderSettingByIdService(id);

        if (response.data.statusCode === 200) {
          setCurrentSetting(response.data.data);
        } else {
          setError(t('settings.messages.error.notFound'));
        }
      } catch (err) {
        console.error('Error fetching provider setting:', err);
        setError(t('settings.messages.error.loadError'));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSetting();
    }
  }, [id, t]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('settings.actions.edit')}
          links={[
            { name: t('settings.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('settings.breadcrumbs.ai') },
            { name: t('settings.title'), href: paths.dashboard.ai.providerSettings.root },
            { name: t('settings.breadcrumbs.edit') },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <div>{t('settings.messages.error.general')}: {error}</div>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('settings.actions.edit')}
        links={[
          { name: t('settings.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('settings.breadcrumbs.ai') },
          { name: t('settings.title'), href: paths.dashboard.ai.providerSettings.root },
          { name: currentSetting?.name || t('settings.breadcrumbs.edit') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <AiProviderSettingsNewEditForm currentSetting={currentSetting} />
    </DashboardContent>
  );
}
