'use client';

// ----------------------------------------------------------------------
// AI Programs Create Chat View - Generate learning program with AI
// ----------------------------------------------------------------------

import type { IAiProgram } from 'src/types/ai-program-generation';

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
import { SaveOrUpdateAiProgramService } from 'src/services/ai/SaveOrUpdateAiProgram.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { AiProgramForm } from '../ai-program-form';
import { AiProgramChatPanel } from '../ai-program-chat-panel';
import { AiProgramPreviewRender } from '../ai-program-preview-render';

// ----------------------------------------------------------------------

const STEPS_KEYS = [
  'ai-program-generation.steps.generate',
  'ai-program-generation.steps.edit',
  'ai-program-generation.steps.preview',
] as const;

export function AiProgramsCreateChatView() {
  const { t } = useTranslate('ai');
  const router = useRouter();

  const [activeStep, setActiveStep] = useState(0);
  const [programData, setProgramData] = useState<Partial<IAiProgram> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const generationHadErrorRef = useRef(false);

  // Handle AI program generation
  const handleProgramGenerated = useCallback((data: any) => {
    const program: Partial<IAiProgram> = {
      id: crypto.randomUUID(),
      name: data.name || '',
      description: data.description || '',
      duration: data.duration || '',
      objective: data.objective || '',
      skillsToAcquire: data.skillsToAcquire || '',
      whatYouWillLearn: data.whatYouWillLearn || '',
      tags: data.tags || '',
      imageUrl: data.imageUrl || '',
      bannerUrl: data.bannerUrl || '',
      videoUrl: data.videoUrl || '',
      isActive: false,
      isAIGenerated: true,
      categoryId: data.categoryId ? String(data.categoryId) : undefined,
      difficultyLevelId: data.difficultyLevelId ? String(data.difficultyLevelId) : undefined,
      courses: (data.courses || []).map((course: any, idx: number) => ({
        courseLmsId: course.courseLmsId,
        displayName: course.displayName || '',
        shortDescription: course.shortDescription || '',
        image: course.image || '',
        order: course.order ?? idx + 1,
      })),
    };

    setProgramData(program);
    if (generationHadErrorRef.current) {
      generationHadErrorRef.current = false;
      return;
    }
    toast.success(t('ai-program-generation.messages.success.generated'));
  }, [t]);

  // Handle form submission
  const handleFormSubmit = useCallback((formData: any) => {
    setProgramData((prev) => ({
      ...prev,
      ...formData,
    }));
    setActiveStep(2);
  }, []);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!programData) return;

    setIsSaving(true);
    try {
      await SaveOrUpdateAiProgramService(programData);

      toast.success(t('ai-program-generation.messages.success.saved'));
      router.push(paths.dashboard.learning.learningObjects);
    } catch (error) {
      console.error('Error saving program:', error);
      toast.error(t('ai-program-generation.messages.error.saving'));
    } finally {
      setIsSaving(false);
    }
  }, [t, programData, router]);

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <AiProgramChatPanel
            onProgramGenerated={handleProgramGenerated}
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
          <AiProgramForm
            currentProgram={programData as Partial<IAiProgram>}
            onSubmit={handleFormSubmit}
            onCancel={handleBack}
            isLoading={isSaving}
          />
        );

      case 2:
        return programData ? (
          <AiProgramPreviewRender program={programData as IAiProgram} />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs
        heading={t('ai-program-generation.create.title')}
        links={[
          { name: t('ai-program-generation.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('ai-program-generation.breadcrumbs.programs'), href: paths.dashboard.learning.learningObjects },
          { name: t('ai-program-generation.breadcrumbs.create') },
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
                          ? 'solar:book-bold'
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
          {activeStep === 0 ? t('ai-program-generation.actions.cancel') : t('ai-program-generation.actions.back')}
        </Button>

        <Stack direction="row" spacing={2}>
          {activeStep === 0 && programData && (
            <Button
              variant="contained"
              onClick={() => setActiveStep(1)}
              endIcon={<Iconify icon="solar:forward-bold" />}
            >
              {t('ai-program-generation.actions.continue')}
            </Button>
          )}

          {activeStep === 2 && (
            <>
              <Button
                variant="outlined"
                onClick={() => setActiveStep(1)}
                startIcon={<Iconify icon="solar:pen-bold" />}
              >
                {t('ai-program-generation.actions.editMore')}
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={isSaving}
                startIcon={<Iconify icon="solar:import-bold" />}
              >
                {t('ai-program-generation.actions.saveProgram')}
              </Button>
            </>
          )}
        </Stack>
      </Stack>
    </DashboardContent>
  );
}
