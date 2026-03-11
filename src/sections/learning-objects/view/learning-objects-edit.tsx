'use client';

import type { ILearningObject } from 'src/types/learning';

import { useState, useEffect } from 'react';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetLearningObjectsByIdService } from 'src/services/learning/learningObjects.service';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { LearningObjectsCreateEditForm } from '../learning-objects-create-edit-form';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function LearningObjectEditView({ id }: Props) {
  const { t } = useTranslate('learning');
  const [currentLearningObject, setCurrentLearningObject] = useState<ILearningObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLearningObject = async () => {
      try {
        setLoading(true);
        const response = await GetLearningObjectsByIdService(id);

        if (response.data.statusCode === 200) {
          setCurrentLearningObject(response.data.data);
        } else {
          setError(t('learning-objects.messages.notFound'));
        }
      } catch (err) {
        console.error('Error fetching learning object:', err);
        setError(t('learning-objects.messages.loadError'));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchLearningObject();
    }
  }, [id, t]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('learning-objects.actions.edit')}
          links={[
            { name: t('learning-objects.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('learning-objects.breadcrumbs.learningObjects'), href: paths.dashboard.learning.learningObjects },
            { name: t('learning-objects.breadcrumbs.edit') },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <div>{t('learning-objects.messages.error')}: {error}</div>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('learning-objects.actions.edit')}
        links={[
          { name: t('learning-objects.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('learning-objects.breadcrumbs.learningObjects'), href: paths.dashboard.learning.learningObjects },
          { name: currentLearningObject?.name || t('learning-objects.breadcrumbs.edit') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <LearningObjectsCreateEditForm currentLearningObject={currentLearningObject || undefined} />
    </DashboardContent>
  );
}