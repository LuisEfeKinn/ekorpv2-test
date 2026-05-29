'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { LearningCategoriesCreateEditForm } from '../learning-categories-create-edit-form';

// ----------------------------------------------------------------------

export function LearningCategoriesCreateView() {
  const { t } = useTranslate('learning');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('learningCategories.actions.create')}
        links={[
          { name: t('learningCategories.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('learningCategories.breadcrumbs.positions'), href: paths.dashboard.learning.learningCategories },
          { name: t('learningCategories.breadcrumbs.create') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <LearningCategoriesCreateEditForm />
    </DashboardContent>
  );
}