'use client';

import type { ILearningCategories } from 'src/types/learning';

import { useState, useEffect } from 'react';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetLearningCategoriesByIdService } from 'src/services/learning/categories.service';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { LearningCategoriesCreateEditForm } from '../learning-categories-create-edit-form';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function LearningCategoriesEditView({ id }: Props) {
  const { t } = useTranslate('learning');
  const [currentLearningCategory, setCurrentLearningCategory] = useState<ILearningCategories | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosition = async () => {
      try {
        setLoading(true);
        const response = await GetLearningCategoriesByIdService(id);
        
        if (response.status === 200) {
          setCurrentLearningCategory(response.data);
        } else {
          setError(t('learningCategories.messages.notFound'));
        }
      } catch (err) {
        console.error('Error fetching learning categories:', err);
        setError(t('learningCategories.messages.loadError'));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPosition();
    }
  }, [id, t]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('learningCategories.actions.edit')}
          links={[
            { name: t('learningCategories.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('learningCategories.breadcrumbs.positions'), href: paths.dashboard.learning.learningCategories },
            { name: t('learningCategories.breadcrumbs.edit') },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <div>{t('learningCategories.messages.error')}: {error}</div>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('learningCategories.actions.edit')}
        links={[
          { name: t('learningCategories.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('learningCategories.breadcrumbs.positions'), href: paths.dashboard.learning.learningCategories },
          { name: currentLearningCategory?.name || t('learningCategories.breadcrumbs.edit') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <LearningCategoriesCreateEditForm currentLearningCategory={currentLearningCategory || undefined} />
    </DashboardContent>
  );
}