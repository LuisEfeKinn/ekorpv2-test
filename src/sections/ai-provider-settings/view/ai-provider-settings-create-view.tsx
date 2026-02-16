'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { AiProviderSettingsNewEditForm } from '../ai-provider-settings-new-edit-form';

// ----------------------------------------------------------------------

export function AiProviderSettingsCreateView() {
  const { t } = useTranslate('ai');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('settings.actions.create')}
        links={[
          { name: t('settings.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('settings.breadcrumbs.ai') },
          { name: t('settings.title'), href: paths.dashboard.ai.providerSettings.root },
          { name: t('settings.breadcrumbs.create') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <AiProviderSettingsNewEditForm />
    </DashboardContent>
  );
}
