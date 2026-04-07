'use client';

// ----------------------------------------------------------------------
// AI Programs Preview View
// ----------------------------------------------------------------------

import type { IAiProgram } from 'src/types/ai-program-generation';

import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetAiProgramByIdService } from 'src/services/ai/SaveOrUpdateAiProgram.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { AiProgramPreviewRender } from '../ai-program-preview-render';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function AiProgramsPreviewView({ id }: Props) {
  const { t } = useTranslate('ai');
  const router = useRouter();

  const [program, setProgram] = useState<IAiProgram | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProgram = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await GetAiProgramByIdService(id);
      setProgram(response?.data);
    } catch (error) {
      console.error('Error loading program:', error);
      toast.error(t('ai-program-generation.messages.error.loadingSingle'));
      router.push(paths.dashboard.ai.programGenerator.root);
    } finally {
      setIsLoading(false);
    }
  }, [t, id, router]);

  useEffect(() => {
    loadProgram();
  }, [loadProgram]);

  if (isLoading) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('ai-program-generation.preview.title')}
          links={[
            { name: t('ai-program-generation.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('ai-program-generation.breadcrumbs.aiPrograms'), href: paths.dashboard.ai.programGenerator.root },
            { name: t('ai-program-generation.breadcrumbs.preview') },
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
        heading={program?.name || t('ai-program-generation.preview.title')}
        links={[
          { name: t('ai-program-generation.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('ai-program-generation.breadcrumbs.aiPrograms'), href: paths.dashboard.ai.programGenerator.root },
          { name: program?.name || t('ai-program-generation.breadcrumbs.preview') },
        ]}
        action={
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => router.push(paths.dashboard.ai.programGenerator.edit(id))}
            startIcon={<Iconify icon="solar:pen-bold" />}
          >
            {t('ai-program-generation.actions.edit')}
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {program && <AiProgramPreviewRender program={program} />}
    </DashboardContent>
  );
}
