'use client';

// ----------------------------------------------------------------------
// AI Routes Edit View
// ----------------------------------------------------------------------

import type { IAiRoute } from 'src/types/ai-route-generation';

import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetAiRouteByIdService } from 'src/services/ai/SaveOrUpdateAiRouteGeneration.service';
import { SaveOrUpdateLearningPathsService } from 'src/services/learning/learningPaths.service';

import { toast } from 'src/components/snackbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { AiRouteForm } from '../ai-route-form';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function AiRoutesEditView({ id }: Props) {
  const { t } = useTranslate('ai');
  const router = useRouter();

  const [route, setRoute] = useState<IAiRoute | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadRoute = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await GetAiRouteByIdService(id);
      setRoute(response?.data);
    } catch (error) {
      console.error('Error loading route:', error);
      toast.error(t('ai-route-generation.messages.error.loadingSingle'));
      router.push(paths.dashboard.ai.routeGenerator.root);
    } finally {
      setIsLoading(false);
    }
  }, [t, id, router]);

  useEffect(() => {
    loadRoute();
  }, [loadRoute]);

  const handleFormSubmit = useCallback(
    async (formData: any) => {
      setIsSaving(true);
      try {
        const updatedRoute = {
          name: route?.title || formData.title,
          description: formData.description || route?.description,
          bannerUrl: route?.bannerUrl,
          videoUrl: route?.videoUrl,
          positionId: route?.positionId ? Number(route.positionId) : undefined,
          isAIGenerated: route?.isAIGenerated ?? true,
          modules: route?.modules?.map((mod, modIdx) => ({
            competencyId: Number(mod.competencyId),
            skillLevelId: Number(mod.skillLevelId),
            order: mod.order ?? modIdx + 1,
            learningObjects: (mod.learningObjects || []).map((lo, loIdx) => ({
              learningObjectId: Number(lo.learningObjectId),
              order: lo.order ?? loIdx + 1,
              isOptional: lo.isOptional ?? false,
            })),
          })) || [],
        };

        await SaveOrUpdateLearningPathsService(updatedRoute as any, id);

        toast.success(t('ai-route-generation.messages.success.updated'));
        router.push(paths.dashboard.learning.learningPaths);
      } catch (error) {
        console.error('Error updating route:', error);
        toast.error(t('ai-route-generation.messages.error.updating'));
      } finally {
        setIsSaving(false);
      }
    },
    [t, route, id, router]
  );

  if (isLoading) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('ai-route-generation.edit.title')}
          links={[
            { name: t('ai-route-generation.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('ai-route-generation.breadcrumbs.aiRoutes'), href: paths.dashboard.ai.routeGenerator.root },
            { name: t('ai-route-generation.breadcrumbs.edit') },
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
        heading={route?.title || t('ai-route-generation.edit.title')}
        links={[
          { name: t('ai-route-generation.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('ai-route-generation.breadcrumbs.learningPaths'), href: paths.dashboard.learning.learningPaths },
          { name: route?.title || t('ai-route-generation.breadcrumbs.edit') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {route && (
        <AiRouteForm
          currentRoute={route}
          onSubmit={handleFormSubmit}
          onCancel={() => router.push(paths.dashboard.learning.learningPaths)}
          isLoading={isSaving}
        />
      )}
    </DashboardContent>
  );
}
