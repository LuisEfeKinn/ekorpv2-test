'use client';

// ----------------------------------------------------------------------
// Learning Path - Course Generation Panel
// Step 2: Takes the instruction JSON, generates each course using AI,
// saves each one via SaveOrUpdateAiCourseGenerationService,
// and collects all rowIds in a temporary variable.
// Courses are generated in parallel where possible.
// ----------------------------------------------------------------------

import type { IAiCourse } from 'src/types/ai-course';
import type {
  ILPProviderConfig,
  ILPGeneratedCourse,
  ILPInstructionJSON,
  ILPCourseInstruction,
} from 'src/types/ai-learning-path';

import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import { SaveOrUpdateAiCourseGenerationService } from 'src/services/ai/SaveOrUpdateAiCourseGeneration.service';

import { Iconify } from 'src/components/iconify';

import { singleCourseGenerate } from './lp-course-generate-utils';
import { generateCourseMedia } from './lp-media-generation-utils';

// ----------------------------------------------------------------------

type Props = {
  providerConfig: ILPProviderConfig;
  instructionJSON: ILPInstructionJSON;
  onCoursesGenerated?: (courses: ILPGeneratedCourse[]) => void;
  onError?: (error: string) => void;
};

// ----------------------------------------------------------------------

export function LPCourseGenerationPanel({
  providerConfig,
  instructionJSON,
  onCoursesGenerated,
  onError,
}: Props) {
  const { t } = useTranslate('ai');
  const [generatedCourses, setGeneratedCourses] = useState<ILPGeneratedCourse[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const abortRef = useRef(false);

  // Build flat list of all courses to generate
  const allCourses: Array<{
    programIndex: number;
    courseIndex: number;
    instruction: ILPCourseInstruction;
    programInstruction: string;
  }> = [];

  instructionJSON.learning_path.programs.forEach((program, pIdx) => {
    program.courses.forEach((course, cIdx) => {
      allCourses.push({
        programIndex: pIdx,
        courseIndex: cIdx,
        instruction: course,
        programInstruction: program.instruction_pg,
      });
    });
  });

  const totalCourses = allCourses.length;
  const completedCourses = generatedCourses.filter((c) => c.status === 'completed').length;
  const errorCourses = generatedCourses.filter((c) => c.status === 'error').length;
  const progress = totalCourses > 0 ? ((completedCourses + errorCourses) / totalCourses) * 100 : 0;

  // Initialize the generated courses tracking array
  useEffect(() => {
    if (generatedCourses.length === 0 && allCourses.length > 0) {
      const initial: ILPGeneratedCourse[] = allCourses.map((c) => ({
        rowId: '',
        programIndex: c.programIndex,
        courseIndex: c.courseIndex,
        instruction_c: c.instruction.instruction_c,
        courseData: {} as IAiCourse,
        status: 'pending',
      }));
      setGeneratedCourses(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start generating all courses in parallel
  const handleStartGeneration = useCallback(async () => {
    if (!providerConfig.textProvider || !providerConfig.textModel) {
      onError?.(t('ai-learning-path.errors.selectProviderModel'));
      return;
    }

    setIsGenerating(true);
    setHasStarted(true);
    abortRef.current = false;

    // Initialize all courses as 'generating'
    const initialCourses: ILPGeneratedCourse[] = allCourses.map((c) => ({
      rowId: '',
      programIndex: c.programIndex,
      courseIndex: c.courseIndex,
      instruction_c: c.instruction.instruction_c,
      courseData: {} as IAiCourse,
      status: 'generating',
    }));
    setGeneratedCourses(initialCourses);

    // Generate all courses in parallel
    const promises = allCourses.map(async (courseInfo, idx) => {
      if (abortRef.current) return;

      try {
        // Generate course using AI
        let courseData = await singleCourseGenerate({
          instruction: courseInfo.instruction.instruction_c,
          programInstruction: courseInfo.programInstruction,
          learningPathInstruction: instructionJSON.learning_path.instruction_lp,
          provider: providerConfig.textProvider!,
          model: providerConfig.textModel!,
          imageProvider: providerConfig.imageProvider,
          imageModel: providerConfig.imageModel,
          getLegacyProviderType: providerConfig.getLegacyProviderType,
        });

        if (abortRef.current) return;

        // Generate media (banner, section images, section videos)
        courseData = await generateCourseMedia(courseData, providerConfig);

        if (abortRef.current) return;

        // Save course to backend
        const saveResponse = await SaveOrUpdateAiCourseGenerationService(courseData);

        const rowId = (saveResponse.data as any)?.rowId || (saveResponse.data as any)?.id || '';

        // Update state with completed course
        setGeneratedCourses((prev) =>
          prev.map((c, i) =>
            i === idx
              ? {
                  ...c,
                  status: 'completed' as const,
                  courseData,
                  rowId: String(rowId),
                }
              : c
          )
        );
      } catch (err: any) {
        console.error(`Error generating course ${idx}:`, err);
        setGeneratedCourses((prev) =>
          prev.map((c, i) =>
            i === idx
              ? {
                  ...c,
                  status: 'error' as const,
                  error: err.message || t('ai-learning-path.errors.unknown'),
                }
              : c
          )
        );
      }
    });

    await Promise.allSettled(promises);
    setIsGenerating(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerConfig, instructionJSON, onError, t]);

  // Notify parent when all courses are done
  useEffect(() => {
    if (
      hasStarted &&
      !isGenerating &&
      generatedCourses.length > 0 &&
      generatedCourses.every((c) => c.status === 'completed' || c.status === 'error')
    ) {
      onCoursesGenerated?.(generatedCourses);
    }
  }, [hasStarted, isGenerating, generatedCourses, onCoursesGenerated]);

  const handleAbort = () => {
    abortRef.current = true;
  };

  return (
    <Stack spacing={2}>
      {/* Header */}
      <Card sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Iconify icon="solar:book-bold" width={32} color="primary.main" />
          <Box>
            <Typography variant="h6">{t('ai-learning-path.courseStep.title')}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t('ai-learning-path.courseStep.generatingCount', { count: totalCourses })}
            </Typography>
          </Box>
        </Stack>
      </Card>

      {/* Instruction JSON Overview */}
      <Card sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="subtitle1" gutterBottom sx={{ lineHeight: 1.5 }}>
          <Iconify icon="solar:point-on-map-perspective-bold" width={20} sx={{ mr: 1, verticalAlign: 'middle' }} />
          {instructionJSON.learning_path.instruction_lp}
        </Typography>
        <Stack spacing={2} sx={{ mt: 2 }}>
          {instructionJSON.learning_path.programs.map((program, pIdx) => (
            <Card key={pIdx} variant="outlined" sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={1}
                sx={{ mb: 1 }}
              >
                <Chip label={`P${pIdx + 1}`} size="small" color="primary" />
                <Typography variant="subtitle2" sx={{ lineHeight: 1.5 }}>
                  {program.instruction_pg}
                </Typography>
              </Stack>
              <Stack spacing={1} sx={{ pl: { xs: 0, sm: 3 } }}>
                {program.courses.map((course, cIdx) => {
                  // Find the corresponding generated course
                  const gen = generatedCourses.find(
                    (g) => g.programIndex === pIdx && g.courseIndex === cIdx
                  );

                  const isCompleted = gen?.status === 'completed';
                  const isGeneratingCourse = gen?.status === 'generating';
                  const isError = gen?.status === 'error';
                  const isPending = !gen || gen.status === 'pending';

                  return (
                    <Card
                      key={cIdx}
                      variant="outlined"
                      sx={{
                        p: { xs: 1.25, sm: 1.5 },
                        borderColor: isCompleted
                          ? 'success.light'
                          : isGeneratingCourse
                            ? 'primary.light'
                            : isError
                              ? 'error.light'
                              : 'divider',
                        bgcolor: isGeneratingCourse
                          ? 'primary.lighter'
                          : isCompleted
                            ? 'success.lighter'
                            : isError
                              ? 'error.lighter'
                              : 'transparent',
                        transition: 'all 0.3s ease',
                        ...(isGeneratingCourse && {
                          boxShadow: (theme) =>
                            `0 0 0 1px ${theme.palette.primary.light}, 0 2px 8px ${theme.palette.primary.lighter}`,
                        }),
                      }}
                    >
                      <Stack spacing={1.25}>
                        <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                          {/* Status indicator */}
                          {isCompleted && (
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '50%',
                                bgcolor: 'success.main',
                              }}
                            >
                              <Iconify icon="solar:check-circle-bold" width={20} sx={{ color: 'common.white' }} />
                            </Box>
                          )}
                          {isGeneratingCourse && (
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <CircularProgress size={28} thickness={5} />
                            </Box>
                          )}
                          {isError && (
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '50%',
                                bgcolor: 'error.main',
                              }}
                            >
                              <Iconify icon="solar:danger-triangle-bold" width={20} sx={{ color: 'common.white' }} />
                            </Box>
                          )}
                          {isPending && (
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '50%',
                                bgcolor: 'grey.200',
                              }}
                            >
                              <Iconify icon="solar:clock-circle-outline" width={20} sx={{ color: 'text.disabled' }} />
                            </Box>
                          )}

                          {/* Content */}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="body2"
                              color={
                                isError
                                  ? 'error.main'
                                  : isCompleted
                                    ? 'text.primary'
                                    : 'text.secondary'
                              }
                              fontWeight={isGeneratingCourse ? 600 : 400}
                              sx={{
                                wordBreak: 'break-word',
                                overflowWrap: 'anywhere',
                              }}
                            >
                              {course.instruction_c}
                            </Typography>
                            {isGeneratingCourse && (
                              <Typography variant="caption" color="primary.main" sx={{ mt: 0.25, display: 'block' }}>
                                {t('ai-learning-path.courseStep.generatingCourse')}
                              </Typography>
                            )}
                            {isError && gen?.error && (
                              <Typography variant="caption" color="error.main" sx={{ mt: 0.25, display: 'block' }}>
                                {gen.error}
                              </Typography>
                            )}
                          </Box>
                        </Stack>

                        {/* Row ID badge */}
                        {gen?.rowId && (
                          <Chip
                            label={t('ai-learning-path.common.idLabel', { id: gen.rowId })}
                            size="small"
                            variant="soft"
                            color="success"
                            sx={{
                              alignSelf: 'flex-start',
                              maxWidth: '100%',
                              '& .MuiChip-label': {
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              },
                            }}
                          />
                        )}
                      </Stack>
                    </Card>
                  );
                })}
              </Stack>
            </Card>
          ))}
        </Stack>
      </Card>

      {/* Progress */}
      {hasStarted && (
        <Card sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack spacing={2}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              justifyContent="space-between"
              spacing={{ xs: 0.75, sm: 0 }}
            >
              <Typography variant="subtitle2">
                {t('ai-learning-path.courseStep.progress', {
                  completed: completedCourses,
                  total: totalCourses,
                })}
                {errorCourses > 0 &&
                  ` ${t('ai-learning-path.common.withErrorsInline', { count: errorCourses })}`}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {Math.round(progress)}%
              </Typography>
            </Stack>
            <LinearProgress variant="determinate" value={progress} />

            {!isGenerating && completedCourses === totalCourses && (
              <Alert severity="success" icon={<Iconify icon="solar:check-circle-bold" />}>
                {t('ai-learning-path.courseStep.allCoursesSuccess')}
              </Alert>
            )}

            {!isGenerating && errorCourses > 0 && (
              <Alert severity="warning">
                {t('ai-learning-path.courseStep.coursesWithErrors', { count: errorCourses })}
              </Alert>
            )}
          </Stack>
        </Card>
      )}

      {/* Action Buttons */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        justifyContent="center"
        alignItems={{ xs: 'stretch', sm: 'center' }}
      >
        {!hasStarted && (
          <LoadingButton
            variant="contained"
            size="large"
            startIcon={<Iconify icon="solar:play-circle-bold" />}
            onClick={handleStartGeneration}
            loading={providerConfig.isLoadingProviders}
            disabled={!providerConfig.textProvider || !providerConfig.textModel}
            fullWidth
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            {t('ai-learning-path.courseStep.generateCoursesCta', { count: totalCourses })}
          </LoadingButton>
        )}
        {isGenerating && (
          <LoadingButton
            variant="outlined"
            color="error"
            startIcon={<Iconify icon="solar:stop-circle-bold" />}
            onClick={handleAbort}
            fullWidth
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            {t('ai-learning-path.actions.stop')}
          </LoadingButton>
        )}
      </Stack>
    </Stack>
  );
}
