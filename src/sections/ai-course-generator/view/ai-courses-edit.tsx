'use client';

// ----------------------------------------------------------------------
// AI Courses Edit View
// ----------------------------------------------------------------------

import type { IAiCourse, IAiCourseFormData } from 'src/types/ai-course';

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
  SaveOrUpdateAiCourseGenerationService,
} from 'src/services/ai/SaveOrUpdateAiCourseGeneration.service';

import { toast } from 'src/components/snackbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { AiCourseForm } from '../ai-course-form';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function AiCoursesEditView({ id }: Props) {
  const { t } = useTranslate('ai-course');
  const router = useRouter();

  const [course, setCourse] = useState<IAiCourse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load course data
  const loadCourse = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await GetAiCourseByIdService(id);
      setCourse(response?.data?.data);
    } catch (error) {
      console.error('Error loading course:', error);
      toast.error(t('messages.error.loading'));
      router.push(paths.dashboard.ai.courseGenerator.root);
    } finally {
      setIsLoading(false);
    }
  }, [id, router, t]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  // Handle form submission
  const handleFormSubmit = useCallback(
    async (formData: IAiCourseFormData) => {
      setIsSaving(true);
      try {
        const updatedCourse = {
          ...course,
          ...formData,
        };

        const response = await SaveOrUpdateAiCourseGenerationService(updatedCourse as IAiCourse, id);

        if (response.statusCode === 200) {
          toast.success(t('messages.success.updated'));
          setCourse(response.data);
        }
      } catch (error) {
        console.error('Error updating course:', error);
        toast.error(t('messages.error.updating'));
      } finally {
        setIsSaving(false);
        router.push(paths.dashboard.ai.courseGenerator.root);
      }
    },
    [course, id, router, t]
  );

  if (isLoading) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('edit.title')}
          links={[
            { name: t('breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('title'), href: paths.dashboard.ai.courseGenerator.root },
            { name: t('edit.title') },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card sx={{ p: 3 }}>
          <Stack spacing={3}>
            <Skeleton variant="text" width={200} height={40} />
            <Skeleton variant="rectangular" height={60} />
            <Skeleton variant="rectangular" height={120} />
            <Skeleton variant="rectangular" height={60} />
          </Stack>
        </Card>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs
        heading={course?.title || t('edit.title')}
        links={[
          { name: t('breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('title'), href: paths.dashboard.ai.courseGenerator.root },
          { name: course?.title || t('edit.title') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {/* Edit Form */}
      {course && (
        <AiCourseForm
          currentCourse={course as IAiCourseFormData}
          onSubmit={handleFormSubmit}
          onCancel={() => router.push(paths.dashboard.ai.courseGenerator.root)}
          isLoading={isSaving}
        />
      )}
    </DashboardContent>
  );
}
