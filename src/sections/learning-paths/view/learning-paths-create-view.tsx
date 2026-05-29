'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { LearningPathsCreateEditForm } from '../learning-paths-create-edit-form';

// ----------------------------------------------------------------------

export function LearningPathsCreateView() {
  const { t } = useTranslate('learning');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('learning-paths.actions.create')}
        links={[
          { name: t('learning-paths.breadcrumbs.dashboard'), href: paths.dashboard.root },
          {
            name: t('learning-paths.breadcrumbs.learningPaths'),
            href: paths.dashboard.learning.learningPaths,
          },
          { name: t('learning-paths.breadcrumbs.create') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <LearningPathsCreateEditForm />
    </DashboardContent>
  );
}
