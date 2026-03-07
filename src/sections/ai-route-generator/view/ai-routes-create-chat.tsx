'use client';

// ----------------------------------------------------------------------
// AI Routes Create Chat View - Generate learning path with AI
// ----------------------------------------------------------------------

import type { IAiRoute, IAiRouteModule } from 'src/types/ai-route-generation';

import { useRef, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Step from '@mui/material/Step';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Stepper from '@mui/material/Stepper';
import StepLabel from '@mui/material/StepLabel';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { SaveOrUpdateLearningPathsService } from 'src/services/learning/learningPaths.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { AiRouteForm } from '../ai-route-form';
import { AiRouteChatPanel } from '../ai-route-chat-panel';
import { AiRoutePreviewRender } from '../ai-route-preview-render';

// ----------------------------------------------------------------------

const STEPS_KEYS = ['ai-route-generation.steps.generate', 'ai-route-generation.steps.edit', 'ai-route-generation.steps.preview'] as const;

export function AiRoutesCreateChatView() {
  const { t } = useTranslate('ai');
  const router = useRouter();

  const [activeStep, setActiveStep] = useState(0);
  const [routeData, setRouteData] = useState<Partial<IAiRoute> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const generationHadErrorRef = useRef(false);

  // Handle AI route generation
  const handleRouteGenerated = useCallback((data: any) => {
    const route: Partial<IAiRoute> = {
      id: crypto.randomUUID(),
      title: data.title || '',
      description: data.description || '',
      objectives: data.objectives || [],
      targetAudience: data.targetAudience || '',
      estimatedDuration: data.estimatedDuration || '',
      difficulty: data.difficulty || 'intermediate',
      language: data.language || 'es',
      tags: data.tags || [],
      bannerUrl: data.bannerUrl || '',
      banner: data.banner || '',
      videoUrl: data.videoUrl || '',
      positionId: data.positionId ? Number(data.positionId) : undefined,
      positionName: data.positionName || '',
      isAIGenerated: data.isAIGenerated ?? true,
      modules: data.modules?.map((mod: any, modIdx: number): IAiRouteModule => ({
        competencyId: Number(mod.competencyId),
        competencyName: mod.competencyName || '',
        skillLevelId: Number(mod.skillLevelId),
        skillLevelName: mod.skillLevelName || '',
        order: mod.order ?? modIdx + 1,
        learningObjects: (mod.learningObjects || []).map((lo: any, loIdx: number) => ({
          learningObjectId: Number(lo.learningObjectId),
          displayName: lo.displayName || '',
          shortDescription: lo.shortDescription || '',
          image: lo.image || '',
          order: lo.order ?? loIdx + 1,
          isOptional: lo.isOptional ?? false,
        })),
      })) || [],
      programs: [],
      status: 'draft',
    };

    setRouteData(route);
    if (generationHadErrorRef.current) {
      generationHadErrorRef.current = false;
      return;
    }
    toast.success(t('ai-route-generation.messages.success.generated'));
  }, [t]);

  // Handle form submission
  const handleFormSubmit = useCallback((formData: any) => {
    setRouteData((prev) => ({
      ...prev,
      ...formData,
    }));
    setActiveStep(2);
  }, []);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!routeData) return;

    setIsSaving(true);
    try {
      const payload = {
        name: routeData.title,
        description: routeData.description,
        bannerUrl: routeData.bannerUrl,
        videoUrl: routeData.videoUrl,
        positionId: routeData.positionId ? Number(routeData.positionId) : undefined,
        isAIGenerated: routeData.isAIGenerated ?? true,
        modules: routeData.modules?.map((mod, modIdx) => ({
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

      await SaveOrUpdateLearningPathsService(payload as any as IAiRoute);

      toast.success(t('ai-route-generation.messages.success.saved'));
      router.push(paths.dashboard.learning.learningPaths);
    } catch (error) {
      console.error('Error saving route:', error);
      toast.error(t('ai-route-generation.messages.error.saving'));
    } finally {
      setIsSaving(false);
    }
  }, [t, routeData, router]);

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <AiRouteChatPanel
            onRouteGenerated={handleRouteGenerated}
            onError={(error) => {
              generationHadErrorRef.current = true;
              toast.error(error);
            }}
            onGenerationStart={() => {
              generationHadErrorRef.current = false;
            }}
          />
        );

      case 1:
        return (
          <AiRouteForm
            currentRoute={routeData as Partial<IAiRoute>}
            onSubmit={handleFormSubmit}
            onCancel={handleBack}
            isLoading={isSaving}
          />
        );

      case 2:
        return routeData ? (
          <AiRoutePreviewRender route={routeData as IAiRoute} />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs
        heading={t('ai-route-generation.create.title')}
        links={[
          { name: t('ai-route-generation.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('ai-route-generation.breadcrumbs.learningPaths'), href: paths.dashboard.learning.learningPaths },
          { name: t('ai-route-generation.breadcrumbs.create') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {/* Stepper */}
      <Card sx={{ py: 1.5, px: 2, mb: 2 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {STEPS_KEYS.map((stepKey, index) => (
            <Step key={stepKey}>
              <StepLabel
                icon={
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: index <= activeStep ? 'primary.main' : 'grey.300',
                      color: 'common.white',
                    }}
                  >
                    <Iconify
                      icon={
                        index === 0
                          ? 'solar:map-point-bold'
                          : index === 1
                            ? 'solar:pen-bold'
                            : 'solar:eye-bold'
                      }
                      width={16}
                    />
                  </Box>
                }
                sx={{
                  '& .MuiStepLabel-label': {
                    fontSize: '0.875rem',
                    mt: 0.5,
                  },
                }}
              >
                {t(stepKey)}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Card>

      {/* Step Content */}
      {renderStepContent()}

      {/* Navigation */}
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 3 }}>
        <Button
          variant="outlined"
          color="inherit"
          onClick={activeStep === 0 ? () => router.back() : handleBack}
          startIcon={<Iconify icon="solar:reply-bold" />}
        >
          {activeStep === 0 ? t('ai-route-generation.actions.cancel') : t('ai-route-generation.actions.back')}
        </Button>

        <Stack direction="row" spacing={2}>
          {activeStep === 0 && routeData && (
            <Button
              variant="contained"
              onClick={() => setActiveStep(1)}
              endIcon={<Iconify icon="solar:forward-bold" />}
            >
              {t('ai-route-generation.actions.continue')}
            </Button>
          )}

          {activeStep === 2 && (
            <>
              <Button
                variant="outlined"
                onClick={() => setActiveStep(1)}
                startIcon={<Iconify icon="solar:pen-bold" />}
              >
                {t('ai-route-generation.actions.editMore')}
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={isSaving}
                startIcon={<Iconify icon="solar:import-bold" />}
              >
                {t('ai-route-generation.actions.saveRoute')}
              </Button>
            </>
          )}
        </Stack>
      </Stack>
    </DashboardContent>
  );
}
