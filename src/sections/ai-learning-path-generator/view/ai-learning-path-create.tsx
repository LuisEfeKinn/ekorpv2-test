'use client';

// ----------------------------------------------------------------------
// AI Learning Path Generator - Main View with Steps
// Step 1: Chat - User describes the learning path, AI returns instruction JSON
// Step 2: Course Generation - Generate and save all courses in parallel
// Step 3: Program Generation - Generate and save all programs in parallel
// Step 4: Route Creation - Organize programs into modules and save the learning path
// ----------------------------------------------------------------------

import type { IAiProvider, IAiProviderModel } from 'src/types/ai-provider';
import type {
  ILPProviderConfig,
  ILPGeneratedCourse,
  ILPInstructionJSON,
  ILPGeneratedProgram,
} from 'src/types/ai-learning-path';

import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Step from '@mui/material/Step';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import Slider from '@mui/material/Slider';
import Divider from '@mui/material/Divider';
import Stepper from '@mui/material/Stepper';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import StepLabel from '@mui/material/StepLabel';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useAiProvidersDynamic } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { parseCapabilities } from 'src/types/ai-provider';

import { LPChatPanel } from '../lp-chat-panel';
import { LPRouteGenerationPanel } from '../lp-route-generation-panel';
import { LPCourseGenerationPanel } from '../lp-course-generation-panel';
import { LPProgramGenerationPanel } from '../lp-program-generation-panel';

// ----------------------------------------------------------------------

const STEPS = ['defineRoute', 'generateCourses', 'generatePrograms', 'createRoute'];

const PROPRIETARY_IMAGE_MODEL_OPTIONS = [
  { label: 'Google', value: 'Google' },
  { label: 'OpenAI', value: 'OpenAI' },
];

// ----------------------------------------------------------------------

export function AiLearningPathCreateView() {
  const { t } = useTranslate('ai');
  const [activeStep, setActiveStep] = useState(0);
  const [instructionJSON, setInstructionJSON] = useState<ILPInstructionJSON | null>(null);
  const [generatedCourses, setGeneratedCourses] = useState<ILPGeneratedCourse[]>([]);
  const [generatedPrograms, setGeneratedPrograms] = useState<ILPGeneratedProgram[]>([]);
  const generationHadErrorRef = useRef(false);

  const [showSettings, setShowSettings] = useState(false);

  // ------- Provider/Model Management (centralized) -------

  const {
    isLoading: isLoadingProviders,
    error: providersError,
    textProviders,
    imageProviders,
    videoProviders,
    selectedProvider,
    selectedModel,
    availableModels,
    temperature,
    selectProvider,
    selectModel,
    setTemperature,
    getLegacyProviderType,
  } = useAiProvidersDynamic({ capability: 'text' });

  // Image provider
  const [selectedImageProviderId, setSelectedImageProviderId] = useState<string>('');
  const [selectedImageModelId, setSelectedImageModelId] = useState<string>('');

  // Video provider
  const [selectedVideoProviderId, setSelectedVideoProviderId] = useState<string>('');
  const [selectedVideoModelId, setSelectedVideoModelId] = useState<string>('');

  // Proprietary video options
  const [proprietaryDurationScenes, setProprietaryDurationScenes] = useState<number>(4);
  const [proprietaryScenesNumber, setProprietaryScenesNumber] = useState<number>(5);
  const [proprietaryImageModel, setProprietaryImageModel] = useState<string>(
    PROPRIETARY_IMAGE_MODEL_OPTIONS[0]?.value || ''
  );

  // Helper: find default provider and model
  const findDefaultProviderAndModel = useCallback(
    (providers: IAiProvider[], capability: 'text' | 'image' | 'video') => {
      for (const provider of providers) {
        const modelsWithCapability = provider.models.filter((m) => {
          const caps = parseCapabilities(m.capabilities);
          return caps.includes(capability);
        });
        const defaultModel = modelsWithCapability.find((m) => m.isDefault);
        if (defaultModel) return { provider, model: defaultModel };
      }
      if (providers.length > 0) {
        const first = providers[0];
        const models = first.models.filter((m) =>
          parseCapabilities(m.capabilities).includes(capability)
        );
        if (models.length > 0) return { provider: first, model: models[0] };
      }
      return null;
    },
    []
  );

  const getDefaultModel = useCallback(
    (provider: IAiProvider | undefined, capability: 'text' | 'image' | 'video'): IAiProviderModel | undefined => {
      if (!provider) return undefined;
      const modelsWithCapability = provider.models.filter((m) => {
        const caps = parseCapabilities(m.capabilities);
        return caps.includes(capability);
      });
      return modelsWithCapability.find((m) => m.isDefault) || modelsWithCapability[0];
    },
    []
  );

  // Auto-select defaults for image and video
  useEffect(() => {
    if (imageProviders.length > 0 && !selectedImageProviderId) {
      const def = findDefaultProviderAndModel(imageProviders, 'image');
      if (def) {
        setSelectedImageProviderId(def.provider.id);
        setSelectedImageModelId(def.model.id);
      }
    }
  }, [imageProviders, selectedImageProviderId, findDefaultProviderAndModel]);

  useEffect(() => {
    if (videoProviders.length > 0 && !selectedVideoProviderId) {
      const def = findDefaultProviderAndModel(videoProviders, 'video');
      if (def) {
        setSelectedVideoProviderId(def.provider.id);
        setSelectedVideoModelId(def.model.id);
      }
    }
  }, [videoProviders, selectedVideoProviderId, findDefaultProviderAndModel]);

  // Derived values
  const selectedImageProvider = imageProviders.find((p) => p.id === selectedImageProviderId);
  const selectedVideoProvider = videoProviders.find((p) => p.id === selectedVideoProviderId);

  const availableImageModels = useMemo(() => {
    if (!selectedImageProvider) return [];
    return selectedImageProvider.models.filter((m) =>
      parseCapabilities(m.capabilities).includes('image')
    );
  }, [selectedImageProvider]);

  const availableVideoModels = useMemo(() => {
    if (!selectedVideoProvider) return [];
    return selectedVideoProvider.models.filter((m) =>
      parseCapabilities(m.capabilities).includes('video')
    );
  }, [selectedVideoProvider]);

  const selectedImageModel = availableImageModels.find((m) => m.id === selectedImageModelId);
  const selectedVideoModel = availableVideoModels.find((m) => m.id === selectedVideoModelId);

  // Build shared provider config
  const providerConfig: ILPProviderConfig = useMemo(
    () => ({
      textProvider: selectedProvider,
      textModel: selectedModel,
      imageProvider: selectedImageProvider,
      imageModel: selectedImageModel,
      videoProvider: selectedVideoProvider,
      videoModel: selectedVideoModel,
      temperature,
      proprietaryDurationScenes,
      proprietaryScenesNumber,
      proprietaryImageModel,
      isLoadingProviders,
      getLegacyProviderType,
    }),
    [
      selectedProvider,
      selectedModel,
      selectedImageProvider,
      selectedImageModel,
      selectedVideoProvider,
      selectedVideoModel,
      temperature,
      proprietaryDurationScenes,
      proprietaryScenesNumber,
      proprietaryImageModel,
      isLoadingProviders,
      getLegacyProviderType,
    ]
  );

  // ------- Step callbacks -------

  const handleInstructionGenerated = useCallback((data: ILPInstructionJSON) => {
    setInstructionJSON(data);
    if (!generationHadErrorRef.current) {
      toast.success(t('ai-learning-path.messages.success.structureGenerated'));
    }
    generationHadErrorRef.current = false;
  }, [t]);

  const handleCoursesGenerated = useCallback((courses: ILPGeneratedCourse[]) => {
    setGeneratedCourses(courses);
    const completed = courses.filter((c) => c.status === 'completed').length;
    const errors = courses.filter((c) => c.status === 'error').length;
    if (errors === 0) {
      toast.success(t('ai-learning-path.messages.success.coursesGeneratedSaved', { count: completed }));
    } else {
      toast.warning(
        t('ai-learning-path.messages.warning.coursesGeneratedWithErrors', {
          completed,
          errors,
        })
      );
    }
  }, [t]);

  const handleProgramsGenerated = useCallback((programs: ILPGeneratedProgram[]) => {
    setGeneratedPrograms(programs);
    const completed = programs.filter((p) => p.status === 'completed').length;
    const errors = programs.filter((p) => p.status === 'error').length;
    if (errors === 0) {
      toast.success(t('ai-learning-path.messages.success.programsGeneratedSaved', { count: completed }));
    } else {
      toast.warning(
        t('ai-learning-path.messages.warning.programsGeneratedWithErrors', {
          completed,
          errors,
        })
      );
    }
  }, [t]);

  // Navigation
  const handleNext = () => {
    if (activeStep === 0 && instructionJSON) {
      setActiveStep(1);
    } else if (activeStep === 1 && generatedCourses.length > 0) {
      setActiveStep(2);
    } else if (activeStep === 2 && generatedPrograms.length > 0) {
      setActiveStep(3);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <LPChatPanel
            providerConfig={providerConfig}
            onInstructionGenerated={handleInstructionGenerated}
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
        return instructionJSON ? (
          <LPCourseGenerationPanel
            providerConfig={providerConfig}
            instructionJSON={instructionJSON}
            onCoursesGenerated={handleCoursesGenerated}
            onError={(error) => toast.error(error)}
          />
        ) : null;

      case 2:
        return instructionJSON ? (
          <LPProgramGenerationPanel
            providerConfig={providerConfig}
            instructionJSON={instructionJSON}
            generatedCourses={generatedCourses}
            onProgramsGenerated={handleProgramsGenerated}
            onError={(error) => toast.error(error)}
          />
        ) : null;

      case 3:
        return instructionJSON ? (
          <LPRouteGenerationPanel
            providerConfig={providerConfig}
            instructionJSON={instructionJSON}
            generatedPrograms={generatedPrograms}
            onError={(error) => toast.error(error)}
          />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs
        heading={t('ai-learning-path.heading')}
        links={[
          { name: t('ai-learning-path.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('ai-learning-path.breadcrumbs.learningPath'), href: paths.dashboard.learning.learningPaths },
          { name: t('ai-learning-path.breadcrumbs.create') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {/* Toolbar - Provider/Model Selection */}
      <Card sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
              <Iconify icon="tabler:robot" width={20} />
            </Avatar>
            <Box>
              <Typography variant="subtitle1">{t('ai-learning-path.toolbar.title')}</Typography>
              <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap">
                <Chip
                  label={selectedProvider?.name || t('ai-learning-path.toolbar.noProvider')}
                  size="small"
                  variant="soft"
                  color="primary"
                  icon={<Iconify icon="solar:chat-round-dots-bold" width={12} />}
                />
                <Chip
                  label={selectedImageProvider?.name || t('ai-learning-path.toolbar.noProvider')}
                  size="small"
                  variant="soft"
                  color="success"
                  icon={<Iconify icon="solar:gallery-circle-outline" width={12} />}
                />
                <Chip
                  label={selectedVideoProvider?.name || t('ai-learning-path.toolbar.noProvider')}
                  size="small"
                  variant="soft"
                  color="error"
                  icon={<Iconify icon="solar:videocamera-record-bold" width={12} />}
                />
              </Stack>
            </Box>
          </Stack>

          <IconButton size="small" onClick={() => setShowSettings(!showSettings)}>
            <Iconify icon="solar:settings-bold-duotone" />
          </IconButton>
        </Stack>

        {showSettings && (
          <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Stack spacing={2}>
              {isLoadingProviders && (
                <Alert severity="info" icon={<CircularProgress size={16} />}>
                  {t('ai-learning-path.toolbar.loadingProviders')}
                </Alert>
              )}
              {providersError && (
                <Alert severity="error">
                  {t('ai-learning-path.toolbar.providersError')}: {providersError}
                </Alert>
              )}

              {/* Language Model */}
              <Typography variant="subtitle2" color="text.secondary">
                {t('ai-learning-path.toolbar.languageModel')}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>{t('ai-learning-path.toolbar.provider')}</InputLabel>
                  <Select
                    value={selectedProvider?.id || ''}
                    label={t('ai-learning-path.toolbar.provider')}
                    onChange={(e) => selectProvider(e.target.value)}
                    disabled={isLoadingProviders}
                  >
                    {textProviders.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>{t('ai-learning-path.toolbar.model')}</InputLabel>
                  <Select
                    value={selectedModel?.id || ''}
                    label={t('ai-learning-path.toolbar.model')}
                    onChange={(e) => selectModel(e.target.value)}
                    disabled={isLoadingProviders}
                  >
                    {availableModels.map((m) => (
                      <MenuItem key={m.id} value={m.id}>
                        {m.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              <Divider />

              {/* Image Model */}
              <Typography variant="subtitle2" color="text.secondary">
                {t('ai-learning-path.toolbar.imageModel')}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>{t('ai-learning-path.toolbar.provider')}</InputLabel>
                  <Select
                    value={selectedImageProviderId}
                    label={t('ai-learning-path.toolbar.provider')}
                    onChange={(e) => {
                      const newId = e.target.value;
                      setSelectedImageProviderId(newId);
                      const newProvider = imageProviders.find((p) => p.id === newId);
                      const defModel = getDefaultModel(newProvider, 'image');
                      if (defModel) setSelectedImageModelId(defModel.id);
                    }}
                    disabled={isLoadingProviders}
                  >
                    {imageProviders.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>{t('ai-learning-path.toolbar.model')}</InputLabel>
                  <Select
                    value={selectedImageModelId}
                    label={t('ai-learning-path.toolbar.model')}
                    onChange={(e) => setSelectedImageModelId(e.target.value)}
                    disabled={isLoadingProviders || !selectedImageProvider}
                  >
                    {availableImageModels.map((m) => (
                      <MenuItem key={m.id} value={m.id}>
                        {m.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              <Divider />

              {/* Video Model */}
              <Typography variant="subtitle2" color="text.secondary">
                {t('ai-learning-path.toolbar.videoModel')}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>{t('ai-learning-path.toolbar.provider')}</InputLabel>
                  <Select
                    value={selectedVideoProviderId}
                    label={t('ai-learning-path.toolbar.provider')}
                    onChange={(e) => {
                      const newId = e.target.value;
                      setSelectedVideoProviderId(newId);
                      const newProvider = videoProviders.find((p) => p.id === newId);
                      const defModel = getDefaultModel(newProvider, 'video');
                      if (defModel) setSelectedVideoModelId(defModel.id);
                    }}
                    disabled={isLoadingProviders}
                  >
                    {videoProviders.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>{t('ai-learning-path.toolbar.model')}</InputLabel>
                  <Select
                    value={selectedVideoModelId}
                    label={t('ai-learning-path.toolbar.model')}
                    onChange={(e) => setSelectedVideoModelId(e.target.value)}
                    disabled={isLoadingProviders || !selectedVideoProvider}
                  >
                    {availableVideoModels.map((m) => (
                      <MenuItem key={m.id} value={m.id}>
                        {m.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              {/* Proprietary Video Options */}
              {selectedVideoProvider?.name === 'Propietario' && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.lighter', borderRadius: 1 }}>
                  <Typography
                    variant="caption"
                    color="primary.dark"
                    sx={{ mb: 2, display: 'block', fontWeight: 600 }}
                  >
                    {t('ai-learning-path.toolbar.proprietaryOptions')}
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                      <InputLabel>{t('ai-learning-path.toolbar.sceneDuration')}</InputLabel>
                      <Select
                        value={proprietaryDurationScenes}
                        label={t('ai-learning-path.toolbar.sceneDuration')}
                        onChange={(e) => setProprietaryDurationScenes(Number(e.target.value))}
                      >
                        <MenuItem value={4}>4 {t('ai-learning-path.toolbar.seconds')}</MenuItem>
                        <MenuItem value={6}>6 {t('ai-learning-path.toolbar.seconds')}</MenuItem>
                        <MenuItem value={12}>12 {t('ai-learning-path.toolbar.seconds')}</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      size="small"
                      type="number"
                      label={t('ai-learning-path.toolbar.scenesNumber')}
                      value={proprietaryScenesNumber}
                      onChange={(e) =>
                        setProprietaryScenesNumber(
                          Math.max(1, Math.min(20, Number(e.target.value)))
                        )
                      }
                      inputProps={{ min: 1, max: 20 }}
                      sx={{ minWidth: 150 }}
                      helperText={t('ai-learning-path.toolbar.totalDuration', {
                        duration: proprietaryDurationScenes * proprietaryScenesNumber,
                      })}
                    />

                    <FormControl size="small" sx={{ minWidth: 180 }}>
                      <InputLabel>{t('ai-learning-path.toolbar.imageModelLabel')}</InputLabel>
                      <Select
                        value={proprietaryImageModel}
                        label={t('ai-learning-path.toolbar.imageModelLabel')}
                        onChange={(e) => setProprietaryImageModel(e.target.value)}
                      >
                        {PROPRIETARY_IMAGE_MODEL_OPTIONS.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>
                </Box>
              )}

              <Divider />

              {/* Temperature */}
              <Box sx={{ px: 1, pb: 1 }}>
                <Typography variant="caption" gutterBottom>
                  {t('ai-learning-path.toolbar.temperature')}: {temperature}
                </Typography>
                <Slider
                  size="small"
                  value={temperature}
                  onChange={(_, value) => setTemperature(value as number)}
                  min={0}
                  max={1}
                  step={0.1}
                  marks={[
                    { value: 0, label: t('ai-learning-path.toolbar.precise') },
                    { value: 1, label: t('ai-learning-path.toolbar.creative') },
                  ]}
                  sx={{
                    mt: 2,
                    mb: 1.5,
                    '& .MuiSlider-markLabel': { fontSize: '0.75rem', top: 28 },
                  }}
                />
              </Box>
            </Stack>
          </Box>
        )}
      </Card>

      {/* Stepper */}
      <Card sx={{ py: 1.5, px: 2, mb: 2 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {STEPS.map((step, index) => (
            <Step key={step}>
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
                          ? 'tabler:robot'
                          : index === 1
                            ? 'solar:book-bold'
                            : index === 2
                              ? 'solar:case-minimalistic-bold'
                              : 'solar:map-point-bold'
                      }
                      width={16}
                    />
                  </Box>
                }
              >
                <Typography variant="caption" fontWeight={index <= activeStep ? 700 : 400}>
                  {t(`ai-learning-path.steps.${step}`)}
                </Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Card>

      {/* Navigation Buttons */}
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<Iconify icon="solar:reply-bold" />}
          onClick={handleBack}
          disabled={activeStep === 0}
        >
          {t('ai-learning-path.actions.back')}
        </Button>

        <Button
          variant="contained"
          endIcon={<Iconify icon="solar:forward-bold" />}
          onClick={handleNext}
          disabled={
            activeStep === STEPS.length - 1 ||
            (activeStep === 0 && !instructionJSON) ||
            (activeStep === 1 && generatedCourses.length === 0) ||
            (activeStep === 2 && generatedPrograms.length === 0)
          }
        >
          {t('ai-learning-path.actions.next')}
        </Button>
      </Stack>

      {/* Step Content */}
      {renderStepContent()}

      {/* Summary when courses are generated */}
      {generatedCourses.length > 0 && activeStep === 1 && (
        <Card sx={{ p: { xs: 2, sm: 3 }, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('ai-learning-path.summary.coursesTitle')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.5 }}>
            {t('ai-learning-path.summary.coursesDescription')}
          </Typography>

          <Stack spacing={1}>
            {generatedCourses
              .filter((c) => c.status === 'completed')
              .map((course, idx) => (
                <Stack
                  key={idx}
                  direction={{ xs: 'column', sm: 'row' }}
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  spacing={{ xs: 1, sm: 2 }}
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: 'success.lighter',
                  }}
                >
                  <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ width: '100%' }}>
                    <Iconify
                      icon="solar:check-circle-bold"
                      width={20}
                      color="success.main"
                      style={{ flexShrink: 0, marginTop: 2 }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          wordBreak: 'break-word',
                          overflowWrap: 'anywhere',
                          lineHeight: 1.45,
                        }}
                      >
                        {course.courseData?.title || course.instruction_c}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('ai-learning-path.summary.programCourse', {
                          program: course.programIndex + 1,
                          course: course.courseIndex + 1,
                        })}
                      </Typography>
                    </Box>
                  </Stack>

                  <Chip
                    size="small"
                    variant="soft"
                    color="success"
                    label={t('ai-learning-path.common.rowIdLabel', { id: course.rowId })}
                    sx={{
                      alignSelf: { xs: 'flex-start', sm: 'center' },
                      maxWidth: '100%',
                      '& .MuiChip-label': {
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      },
                    }}
                  />
                </Stack>
              ))}
          </Stack>
        </Card>
      )}
    </DashboardContent>
  );
}
