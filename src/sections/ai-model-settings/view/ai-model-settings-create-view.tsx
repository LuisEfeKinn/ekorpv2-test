'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { AiModelSettingsNewEditForm } from '../ai-model-settings-new-edit-form';

// ----------------------------------------------------------------------

type Props = {
  providerId: string;
  providerName?: string;
};

export function AiModelSettingsCreateView({ providerId, providerName }: Props) {
  const { t } = useTranslate('ai');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('models.actions.create')}
        links={[
          { name: t('models.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('models.breadcrumbs.ai') },
          { name: t('models.breadcrumbs.providers'), href: paths.dashboard.ai.providerSettings.root },
          { name: providerName || t('models.breadcrumbs.provider') },
          { name: t('models.title'), href: paths.dashboard.ai.modelsSettings.root(providerId) },
          { name: t('models.breadcrumbs.create') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <AiModelSettingsNewEditForm providerId={providerId} />
    </DashboardContent>
  );
}
