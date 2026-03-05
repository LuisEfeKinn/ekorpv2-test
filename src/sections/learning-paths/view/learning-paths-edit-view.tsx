'use client';

import type { ILearningPath } from 'src/types/learning';

import { useState, useEffect } from 'react';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetLearningPathsByIdService } from 'src/services/learning/learningPaths.service';

import { toast } from 'src/components/snackbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { LearningPathsCreateEditForm } from '../learning-paths-create-edit-form';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function LearningPathsEditView({ id }: Props) {
  const { t } = useTranslate('learning');
  const [currentLearningPath, setCurrentLearningPath] = useState<ILearningPath | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await GetLearningPathsByIdService(id);
        setCurrentLearningPath(response.data.data);
      } catch (error) {
        console.error('Error fetching learning path:', error);
        toast.error(t('learning-paths.messages.error.loading'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, t]);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('learning-paths.actions.edit')}
        links={[
          { name: t('learning-paths.breadcrumbs.dashboard'), href: paths.dashboard.root },
          {
            name: t('learning-paths.breadcrumbs.learningPaths'),
            href: paths.dashboard.learning.learningPaths,
          },
          { name: currentLearningPath?.name || '' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {!loading && <LearningPathsCreateEditForm currentLearningPath={currentLearningPath} />}
    </DashboardContent>
  );
}
