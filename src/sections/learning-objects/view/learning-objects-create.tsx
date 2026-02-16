'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { LearningObjectsCreateEditForm } from '../learning-objects-create-edit-form';

// ----------------------------------------------------------------------

export function LearningObjectCreateView() {
  const { t } = useTranslate('learning');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('learning-objects.actions.create')}
        links={[
          { name: t('learning-objects.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('learning-objects.breadcrumbs.learningObjects'), href: paths.dashboard.learning.learningObjects },
          { name: t('learning-objects.breadcrumbs.create') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <LearningObjectsCreateEditForm />
    </DashboardContent>
  );
}