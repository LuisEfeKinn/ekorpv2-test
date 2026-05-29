'use client';

// ----------------------------------------------------------------------
// AI Programs Edit View
// ----------------------------------------------------------------------

import type { IAiProgram } from 'src/types/ai-program-generation';

import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  GetAiProgramByIdService,
  SaveOrUpdateAiProgramService,
} from 'src/services/ai/SaveOrUpdateAiProgram.service';

import { toast } from 'src/components/snackbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { AiProgramForm } from '../ai-program-form';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function AiProgramsEditView({ id }: Props) {
  const { t } = useTranslate('ai');
  const router = useRouter();

  const [program, setProgram] = useState<IAiProgram | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleFormSubmit = useCallback(
    async (formData: any) => {
      setIsSaving(true);
      try {
        const updatedProgram: Partial<IAiProgram> = {
          ...program,
          name: formData.name,
          description: formData.description,
          duration: formData.duration,
          objective: formData.objective,
          skillsToAcquire: formData.skillsToAcquire,
          whatYouWillLearn: formData.whatYouWillLearn,
          tags: formData.tags,
          isActive: formData.isActive,
        };

        await SaveOrUpdateAiProgramService(updatedProgram, id);

        toast.success(t('ai-program-generation.messages.success.updated'));
        router.push(paths.dashboard.ai.programGenerator.root);
      } catch (error) {
        console.error('Error updating program:', error);
        toast.error(t('ai-program-generation.messages.error.updating'));
      } finally {
        setIsSaving(false);
      }
    },
    [t, program, id, router]
  );

  if (isLoading) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('ai-program-generation.edit.title')}
          links={[
            { name: t('ai-program-generation.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('ai-program-generation.breadcrumbs.aiPrograms'), href: paths.dashboard.ai.programGenerator.root },
            { name: t('ai-program-generation.breadcrumbs.edit') },
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
        heading={program?.name || t('ai-program-generation.edit.title')}
        links={[
          { name: t('ai-program-generation.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('ai-program-generation.breadcrumbs.aiPrograms'), href: paths.dashboard.ai.programGenerator.root },
          { name: program?.name || t('ai-program-generation.breadcrumbs.edit') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {program && (
        <AiProgramForm
          currentProgram={program}
          onSubmit={handleFormSubmit}
          onCancel={() => router.push(paths.dashboard.ai.programGenerator.root)}
          isLoading={isSaving}
        />
      )}
    </DashboardContent>
  );
}
