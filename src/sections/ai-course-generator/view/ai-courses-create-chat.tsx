'use client';

// ----------------------------------------------------------------------
// AI Courses Create Chat View - Generate course with AI
// ----------------------------------------------------------------------

import type { IAiCourse, IAiCourseFormData } from 'src/types/ai-course';

import { useState, useCallback } from 'react';

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
import { SaveOrUpdateAiCourseGenerationService } from 'src/services/ai/SaveOrUpdateAiCourseGeneration.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { AiCourseForm } from '../ai-course-form';
import { AiCourseChatPanel } from '../ai-course-chat-panel';
import { AiCoursePreviewRender } from '../ai-course-preview-render';

// ----------------------------------------------------------------------

const STEPS = ['generate', 'edit', 'preview'];

export function AiCoursesCreateChatView() {
  const { t } = useTranslate('ai-course');
  const router = useRouter();

  const [activeStep, setActiveStep] = useState(0);
  const [courseData, setCourseData] = useState<Partial<IAiCourse> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Handle AI course generation
  const handleCourseGenerated = useCallback((data: any) => {
    // Transform AI response to course format
    const course: Partial<IAiCourse> = {
      id: crypto.randomUUID(),
      title: data.title || '',
      description: data.description || '',
      objectives: data.objectives || [],
      targetAudience: data.targetAudience || '',
      duration: data.duration || '',
      difficulty: data.difficulty || 'intermediate',
      language: data.language || 'es',
      tags: data.tags || [],
      bannerUrl: data.bannerUrl || '',
      banner: data.banner || '',
      sections: data.sections?.map((section: any, index: number) => ({
        id: crypto.randomUUID(),
        title: section.title,
        description: section.description,
        order: index,
        blocks: section.blocks?.map((block: any, blockIndex: number) => ({
          id: crypto.randomUUID(),
          type: block.type || 'text',
          content: block.content || { text: block.text || '' },
          order: blockIndex,
          sectionId: '',
        })) || [],
        duration: section.duration,
        // Media fields from AI generation
        image: section.image || '',
        video: section.video || '',
        needsImage: section.needsImage ?? false,
        needsVideo: section.needsVideo ?? false,
        images: section.images || [],
        videos: section.videos || [],
        imageUrl: section.imageUrl || '',
        videoUrl: section.videoUrl || '',
      })) || [],
      status: 'draft',
    };

    setCourseData(course);
    toast.success(t('messages.success.generated'));
  }, [t]);

  // Handle form submission
  const handleFormSubmit = useCallback((formData: IAiCourseFormData) => {
    setCourseData((prev) => ({
      ...prev,
      ...formData,
    }));
    setActiveStep(2);
  }, []);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!courseData) return;

    setIsSaving(true);
    try {
      const response = await SaveOrUpdateAiCourseGenerationService(courseData as IAiCourse);

      if (response.statusCode === 200 || response.statusCode === 201) {
        toast.success(t('messages.success.saved'));
        router.push(paths.dashboard.ai.courseGenerator.root);
      }
    } catch (error) {
      console.error('Error saving course:', error);
      toast.error(t('messages.error.saving'));
    } finally {
      setIsSaving(false);
    }
  }, [courseData, router, t]);

  // Navigate steps
  const handleNext = () => {
    if (activeStep === 0 && courseData) {
      setActiveStep(1);
    } else if (activeStep === 1) {
      setActiveStep(2);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSkipToEdit = () => {
    // Create empty course template
    const emptyCourse: Partial<IAiCourse> = {
      id: crypto.randomUUID(),
      title: '',
      description: '',
      objectives: [''],
      targetAudience: '',
      duration: '',
      difficulty: 'intermediate',
      language: 'es',
      tags: [],
      sections: [],
      status: 'draft',
    };
    setCourseData(emptyCourse);
    setActiveStep(1);
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <AiCourseChatPanel
            onCourseGenerated={handleCourseGenerated}
            onError={(error) => toast.error(error)}
          />
        );

      case 1:
        return (
          <AiCourseForm
            currentCourse={courseData as IAiCourseFormData}
            onSubmit={handleFormSubmit}
            onCancel={handleBack}
            isLoading={isSaving}
          />
        );

      case 2:
        return courseData ? (
          <AiCoursePreviewRender course={courseData as IAiCourse} />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs
        heading={t('create.title')}
        links={[
          { name: t('breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('title'), href: paths.dashboard.ai.courseGenerator.root },
          { name: t('create.title') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {/* Stepper - Compacto */}
      <Card sx={{ py: 1.5, px: 2, mb: 2 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {STEPS.map((step, index) => (
            <Step key={step}>
              <StepLabel
                optional={
                  index === 0 ? (
                    <Button
                      size="small"
                      variant="text"
                      onClick={handleSkipToEdit}
                      sx={{ mt: 0.25, fontSize: '0.7rem', py: 0.25 }}
                    >
                      {t('steps.skipToManual')}
                    </Button>
                  ) : null
                }
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
                          ? 'tabler:robot'
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
                {t(`steps.${step}`)}
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
          {activeStep === 0 ? t('actions.cancel') : t('actions.back')}
        </Button>

        <Stack direction="row" spacing={2}>
          {activeStep === 0 && courseData && (
            <Button
              variant="contained"
              onClick={handleNext}
              endIcon={<Iconify icon="solar:forward-bold" />}
            >
              {t('actions.continue')}
            </Button>
          )}

          {activeStep === 2 && (
            <>
              <Button
                variant="outlined"
                onClick={() => setActiveStep(1)}
                startIcon={<Iconify icon="solar:pen-bold" />}
              >
                {t('actions.editMore')}
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={isSaving}
                startIcon={<Iconify icon="solar:import-bold" />}
              >
                {t('actions.saveCourse')}
              </Button>
            </>
          )}
        </Stack>
      </Stack>
    </DashboardContent>
  );
}
