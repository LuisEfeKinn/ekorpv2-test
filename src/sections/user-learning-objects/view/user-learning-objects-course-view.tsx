'use client';

// ----------------------------------------------------------------------
// AI Courses Preview View
// ----------------------------------------------------------------------

import type { IAiCourse } from 'src/types/ai-course';

import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { FinishedActivitiesService, GetLearningUnitsByEnrollmentIdService } from 'src/services/learning/courses.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { UserLearningObjectsCoursePreviewRender } from '../user-learning-objects-course-preview-render';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function UserLearningObjectsCourseView({ id }: Props) {
  const { t } = useTranslate('learning');
  const router = useRouter();

  const [course, setCourse] = useState<IAiCourse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load course data
  const loadCourse = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await GetLearningUnitsByEnrollmentIdService(id);
      setCourse(response?.data?.data);
    } catch (error) {
      console.error('Error loading course:', error);
      toast.error(t('learning-objects.messages.error.loading'));
      router.push(paths.dashboard.ai.courseGenerator.root);
    } finally {
      setIsLoading(false);
    }
  }, [id, router, t]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  // Handle activity completion
  const handleCompleteActivity = useCallback(async (activityId: string) => {
    try {
      const enrollmentId = Number(id);

      if (Number.isNaN(enrollmentId)) {
        toast.error(t('learning-objects.messages.error.completingActivity'));
        return;
      }

      const response = await FinishedActivitiesService({
        enrollmentId,
        blockId: activityId,
      });

      if (response?.data?.statusCode === 200 || response?.status === 200) {
        toast.success(t('learning-objects.messages.success.activityCompleted'));
        // Reload course data to get updated completion status
        await loadCourse();
      } else {
        toast.error(t('learning-objects.messages.error.completingActivity'));
      }
    } catch (error) {
      console.error('Error completing activity:', error);
      toast.error(t('learning-objects.messages.error.completingActivity'));
    }
  }, [id, loadCourse, t]);

  if (isLoading) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading={course?.title || t('learning-objects.breadcrumbs.viewCourse')}
          links={[
            { name: t('learning-objects.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('learning-objects.breadcrumbs.myCourses'), href: paths.dashboard.ai.courseGenerator.root },
            { name: t('learning-objects.breadcrumbs.viewCourse') },
          ]}
          action={
            <Button
              variant="outlined"
              onClick={() => router.back()}
              startIcon={<Iconify icon={'solar:arrow-left-outline' as any} />}
              sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
            >
              {t('learning-objects.actions.back')}
            </Button>
          }
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
        heading={course?.title || t('learning-objects.breadcrumbs.viewCourse')}
        links={[
          { name: t('learning-objects.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('learning-objects.breadcrumbs.myCourses'), href: paths.dashboard.ai.courseGenerator.root },
          { name: t('learning-objects.breadcrumbs.viewCourse') },
        ]}
        action={
          <Button
            variant="outlined"
            onClick={() => router.back()}
            startIcon={<Iconify icon={'solar:arrow-left-outline' as any} />}
            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
          >
            {t('learning-objects.actions.back')}
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {course && <UserLearningObjectsCoursePreviewRender course={course} onCompleteActivity={handleCompleteActivity} />}
    </DashboardContent>
  );
};