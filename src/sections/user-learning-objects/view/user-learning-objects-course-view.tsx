'use client';

// ----------------------------------------------------------------------
// AI Courses Preview View
// ----------------------------------------------------------------------

import type { IAiCourse } from 'src/types/ai-course';

import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  GetAiCourseByIdService,
} from 'src/services/ai/SaveOrUpdateAiCourseGeneration.service';

import { toast } from 'src/components/snackbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { UserLearningObjectsCoursePreviewRender } from '../user-learning-objects-course-preview-render';

// ----------------------------------------------------------------------

type Props = {
  id: string;
  idC: string;
};

export function UserLearningObjectsCourseView({ id, idC }: Props) {
  const { t } = useTranslate('learning');
  const router = useRouter();

  const [course, setCourse] = useState<IAiCourse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load course data
  const loadCourse = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await GetAiCourseByIdService(idC);
      setCourse(response?.data?.data);
    } catch (error) {
      console.error('Error loading course:', error);
      toast.error(t('learning-objects.messages.error.loading'));
      router.push(paths.dashboard.ai.courseGenerator.root);
    } finally {
      setIsLoading(false);
    }
  }, [idC, router, t]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);
  
  if (isLoading) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading={course?.title || t('learning-objects.breadcrumbs.view')}
          links={[
            { name: t('learning-objects.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('learning-objects.breadcrumbs.myLearningObjects'), href: paths.dashboard.ai.courseGenerator.root },
            { name: t("learning-objects.details.user-title"), href: paths.dashboard.userLearning.myLearningDetails(id) },
            { name: t('learning-objects.breadcrumbs.view') },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Stack spacing={3}>
          <Card sx={{ p: 3 }}>
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2, mb: 3 }} />
            <Skeleton variant="text" width={300} height={48} />
            <Skeleton variant="text" height={24} />
            <Skeleton variant="text" height={24} />
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Skeleton variant="rounded" width={80} height={24} />
              <Skeleton variant="rounded" width={80} height={24} />
              <Skeleton variant="rounded" width={80} height={24} />
            </Stack>
          </Card>

          <Card sx={{ p: 3 }}>
            <Skeleton variant="text" width={200} height={32} />
            <Stack spacing={1} sx={{ mt: 2 }}>
              <Skeleton variant="text" height={24} />
              <Skeleton variant="text" height={24} />
              <Skeleton variant="text" height={24} />
            </Stack>
          </Card>
        </Stack>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent maxWidth="lg">
      <CustomBreadcrumbs
        heading={course?.title || t('learning-objects.breadcrumbs.view')}
        links={[
          { name: t('learning-objects.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('learning-objects.breadcrumbs.myLearningObjects'), href: paths.dashboard.ai.courseGenerator.root },
          { name: t("learning-objects.details.user-title"), href: paths.dashboard.userLearning.myLearningDetails(id) },
          { name: t('learning-objects.breadcrumbs.view') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {course && <UserLearningObjectsCoursePreviewRender course={course} />}
    </DashboardContent>
  );
};