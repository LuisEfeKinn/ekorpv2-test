'use client';

// ----------------------------------------------------------------------
// AI Routes Preview View
// ----------------------------------------------------------------------

import type { IAiRoute } from 'src/types/ai-route-generation';

import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetAiRouteByIdService } from 'src/services/ai/SaveOrUpdateAiRouteGeneration.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { AiRoutePreviewRender } from '../ai-route-preview-render';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function AiRoutesPreviewView({ id }: Props) {
  const { t } = useTranslate('ai');
  const router = useRouter();

  const [route, setRoute] = useState<IAiRoute | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  if (isLoading) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('ai-route-generation.preview.title')}
          links={[
            { name: t('ai-route-generation.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('ai-route-generation.breadcrumbs.aiRoutes'), href: paths.dashboard.ai.routeGenerator.root },
            { name: t('ai-route-generation.breadcrumbs.preview') },
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
        heading={route?.title || t('ai-route-generation.preview.title')}
        links={[
          { name: t('ai-route-generation.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('ai-route-generation.breadcrumbs.aiRoutes'), href: paths.dashboard.ai.routeGenerator.root },
          { name: route?.title || t('ai-route-generation.breadcrumbs.preview') },
        ]}
        action={
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => router.push(paths.dashboard.ai.routeGenerator.edit(id))}
            startIcon={<Iconify icon="solar:pen-bold" />}
          >
            {t('ai-route-generation.actions.edit')}
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {route && <AiRoutePreviewRender route={route} />}
    </DashboardContent>
  );
}
