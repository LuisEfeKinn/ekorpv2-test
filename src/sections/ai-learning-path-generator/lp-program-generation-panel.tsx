'use client';

// ----------------------------------------------------------------------
// Learning Path - Program Generation Panel
// Step 3: Takes the instruction JSON + generated courses (with rowIds),
// generates each program using AI in parallel,
// saves each via SaveOrUpdateAiProgramService,
// and collects all rowIds in a temporary variable.
// ----------------------------------------------------------------------

import type {
  ICatalogCategory,
  ICatalogDifficultyLevel,
} from 'src/types/ai-program-generation';
import type {
  ILPProviderConfig,
  ILPGeneratedCourse,
  ILPInstructionJSON,
  ILPGeneratedProgram,
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
import { SaveOrUpdateAiProgramService } from 'src/services/ai/SaveOrUpdateAiProgram.service';
import {
  GetLearningObjectsSelectLevelsService,
  GetLearningObjectsSelectCategoriesService,
} from 'src/services/learning/learningObjects.service';

import { Iconify } from 'src/components/iconify';

import { generateProgramMedia } from './lp-media-generation-utils';
import { singleProgramGenerate } from './lp-program-generate-utils';

// ----------------------------------------------------------------------

type Props = {
  providerConfig: ILPProviderConfig;
  instructionJSON: ILPInstructionJSON;
  generatedCourses: ILPGeneratedCourse[];
  onProgramsGenerated?: (programs: ILPGeneratedProgram[]) => void;
  onError?: (error: string) => void;
};

// ----------------------------------------------------------------------

export function LPProgramGenerationPanel({
  providerConfig,
  instructionJSON,
  generatedCourses,
  onProgramsGenerated,
  onError,
}: Props) {
  const { t } = useTranslate('ai');
  const [generatedPrograms, setGeneratedPrograms] = useState<ILPGeneratedProgram[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const abortRef = useRef(false);

  // Category and difficulty level catalogs
  const [categoriesCatalog, setCategoriesCatalog] = useState<ICatalogCategory[]>([]);
  const [difficultyLevelsCatalog, setDifficultyLevelsCatalog] = useState<ICatalogDifficultyLevel[]>([]);
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(false);

  // Load categories and difficulty levels on mount
  useEffect(() => {
    const loadCatalogs = async () => {
      setIsLoadingCatalogs(true);
      try {
        const [categoriesRes, levelsRes] = await Promise.all([
          GetLearningObjectsSelectCategoriesService({ page: 1, perPage: 100 }),
          GetLearningObjectsSelectLevelsService(),
        ]);

        const categories: ICatalogCategory[] = (categoriesRes?.data?.data || []).map(
          (item: any) => ({
            id: String(item.id),
            name: item.name || '',
            abreviation: item.abreviation || '',
          })
        );
        setCategoriesCatalog(categories);

        const levels: ICatalogDifficultyLevel[] = (
          Array.isArray(levelsRes?.data) ? levelsRes.data : levelsRes?.data?.data || []
        ).map((item: any) => ({
          id: String(item.id),
          name: item.name || '',
          levelOrder: item.levelOrder,
        }));
        setDifficultyLevelsCatalog(levels);
      } catch (err) {
        console.error('Error loading catalogs:', err);
      } finally {
        setIsLoadingCatalogs(false);
      }
    };

    loadCatalogs();
  }, []);

  // Build flat list of programs to generate
  const allPrograms = instructionJSON.learning_path.programs.map((program, pIdx) => {
    // Get the courses that belong to this program (only completed ones with rowIds)
    const programCourses = generatedCourses.filter(
      (c) => c.programIndex === pIdx && c.status === 'completed' && c.rowId
    );
    return {
      programIndex: pIdx,
      instruction: program.instruction_pg,
      courses: programCourses,
    };
  });

  const totalPrograms = allPrograms.length;
  const completedPrograms = generatedPrograms.filter((p) => p.status === 'completed').length;
  const errorPrograms = generatedPrograms.filter((p) => p.status === 'error').length;
  const progress =
    totalPrograms > 0 ? ((completedPrograms + errorPrograms) / totalPrograms) * 100 : 0;

  // Initialize tracking array
  useEffect(() => {
    if (generatedPrograms.length === 0 && allPrograms.length > 0) {
      const initial: ILPGeneratedProgram[] = allPrograms.map((p) => ({
        rowId: '',
        programIndex: p.programIndex,
        instruction_pg: p.instruction,
        courseRowIds: p.courses.map((c) => c.rowId),
        programData: {},
        status: 'pending',
      }));
      setGeneratedPrograms(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start generating all programs in parallel
  const handleStartGeneration = useCallback(async () => {
    if (!providerConfig.textProvider || !providerConfig.textModel) {
      onError?.(t('ai-learning-path.errors.selectProviderModel'));
      return;
    }

    setIsGenerating(true);
    setHasStarted(true);
    abortRef.current = false;

    // Initialize all programs as 'generating'
    const initialPrograms: ILPGeneratedProgram[] = allPrograms.map((p) => ({
      rowId: '',
      programIndex: p.programIndex,
      instruction_pg: p.instruction,
      courseRowIds: p.courses.map((c) => c.rowId),
      programData: {},
      status: 'generating',
    }));
    setGeneratedPrograms(initialPrograms);

    // Generate all programs in parallel
    const promises = allPrograms.map(async (programInfo, idx) => {
      if (abortRef.current) return;

      try {
        // Build course references for this program
        const courseRefs = programInfo.courses.map((c, cIdx) => ({
          courseLmsId: c.rowId,
          title: c.courseData?.title || c.instruction_c,
          description: c.courseData?.description || '',
          order: cIdx + 1,
        }));

        // Generate program using AI
        let programData = await singleProgramGenerate({
          instruction: programInfo.instruction,
          learningPathInstruction: instructionJSON.learning_path.instruction_lp,
          courses: courseRefs,
          categories: categoriesCatalog,
          difficultyLevels: difficultyLevelsCatalog,
          provider: providerConfig.textProvider!,
          model: providerConfig.textModel!,
          imageProvider: providerConfig.imageProvider,
          imageModel: providerConfig.imageModel,
          getLegacyProviderType: providerConfig.getLegacyProviderType,
        });

        if (abortRef.current) return;

        // Generate media (banner and cover images)
        programData = await generateProgramMedia(programData, providerConfig);

        if (abortRef.current) return;

        // Save program to backend
        const saveResponse = await SaveOrUpdateAiProgramService(programData);

        const rowId =
          (saveResponse as any)?.data?.data?.rowId ||
          (saveResponse as any)?.data?.rowId ||
          '';

        // Update state with completed program
        setGeneratedPrograms((prev) =>
          prev.map((p, i) =>
            i === idx
              ? {
                  ...p,
                  status: 'completed' as const,
                  programData,
                  rowId: String(rowId),
                }
              : p
          )
        );
      } catch (err: any) {
        console.error(`Error generating program ${idx}:`, err);
        setGeneratedPrograms((prev) =>
          prev.map((p, i) =>
            i === idx
              ? {
                  ...p,
                  status: 'error' as const,
                  error: err.message || t('ai-learning-path.errors.unknown'),
                }
              : p
          )
        );
      }
    });

    await Promise.allSettled(promises);
    setIsGenerating(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    providerConfig,
    instructionJSON,
    categoriesCatalog,
    difficultyLevelsCatalog,
    onError,
    t,
  ]);

  // Notify parent when all programs are done
  useEffect(() => {
    if (
      hasStarted &&
      !isGenerating &&
      generatedPrograms.length > 0 &&
      generatedPrograms.every((p) => p.status === 'completed' || p.status === 'error')
    ) {
      onProgramsGenerated?.(generatedPrograms);
    }
  }, [hasStarted, isGenerating, generatedPrograms, onProgramsGenerated]);

  const handleAbort = () => {
    abortRef.current = true;
  };

  return (
    <Stack spacing={2}>
      {/* Header */}
      <Card sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Iconify icon="solar:case-minimalistic-bold" width={32} color="primary.main" />
          <Box>
            <Typography variant="h6">{t('ai-learning-path.programStep.title')}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t('ai-learning-path.programStep.generatingCount', { count: totalPrograms })}
            </Typography>
          </Box>
        </Stack>

        {/* Catalog status */}
        {isLoadingCatalogs && (
          <Alert severity="info" icon={<CircularProgress size={16} />} sx={{ mt: 2 }}>
            {t('ai-learning-path.programStep.loadingCatalogs')}
          </Alert>
        )}
        {!isLoadingCatalogs && categoriesCatalog.length > 0 && (
          <Alert severity="success" icon={false} sx={{ py: 0.5, mt: 2 }}>
            {t('ai-learning-path.programStep.catalogsLoaded', {
              categories: categoriesCatalog.length,
              levels: difficultyLevelsCatalog.length,
            })}
          </Alert>
        )}
      </Card>

      {/* Programs Overview */}
      <Card sx={{ p: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          <Iconify
            icon="solar:point-on-map-perspective-bold"
            width={20}
            sx={{ mr: 1, verticalAlign: 'middle' }}
          />
          {instructionJSON.learning_path.instruction_lp}
        </Typography>
        <Stack spacing={2} sx={{ mt: 2 }}>
          {allPrograms.map((programInfo, pIdx) => {
            const gen = generatedPrograms.find((g) => g.programIndex === pIdx);
            return (
              <Card key={pIdx} variant="outlined" sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  {gen?.status === 'completed' && (
                    <Iconify icon="solar:check-circle-bold" width={20} color="success.main" />
                  )}
                  {gen?.status === 'generating' && <CircularProgress size={18} />}
                  {gen?.status === 'error' && (
                    <Iconify icon="solar:danger-triangle-bold" width={20} color="error.main" />
                  )}
                  {(!gen || gen.status === 'pending') && (
                    <Iconify icon="solar:clock-circle-outline" width={20} color="text.disabled" />
                  )}
                  <Chip label={`P${pIdx + 1}`} size="small" color="primary" />
                  <Typography variant="subtitle2">{programInfo.instruction}</Typography>
                  {gen?.rowId && (
                    <Chip
                      label={t('ai-learning-path.common.idLabel', { id: gen.rowId })}
                      size="small"
                      variant="soft"
                      color="success"
                    />
                  )}
                </Stack>

                {/* Show courses belonging to this program */}
                <Stack spacing={0.5} sx={{ pl: 4 }}>
                  {programInfo.courses.map((course, cIdx) => (
                    <Stack key={cIdx} direction="row" alignItems="center" spacing={1}>
                      <Iconify icon="solar:check-circle-bold" width={14} color="success.main" />
                      <Typography variant="body2" color="text.secondary">
                        {course.courseData?.title || course.instruction_c}
                      </Typography>
                      <Chip
                        label={t('ai-learning-path.common.rowIdLabel', { id: course.rowId })}
                        size="small"
                        variant="soft"
                        color="info"
                        sx={{ fontSize: '0.65rem', height: 20 }}
                      />
                    </Stack>
                  ))}
                </Stack>

                {/* Show error message */}
                {gen?.status === 'error' && gen.error && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {gen.error}
                  </Alert>
                )}

                {/* Show generated program info */}
                {gen?.status === 'completed' && gen.programData?.name && (
                  <Box sx={{ mt: 1, p: 1.5, bgcolor: 'success.lighter', borderRadius: 1 }}>
                    <Typography variant="subtitle2" color="success.dark">
                      {gen.programData.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {gen.programData.description?.slice(0, 120)}
                      {(gen.programData.description?.length || 0) > 120 ? '...' : ''}
                    </Typography>
                  </Box>
                )}
              </Card>
            );
          })}
        </Stack>
      </Card>

      {/* Progress */}
      {hasStarted && (
        <Card sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle2">
                {t('ai-learning-path.programStep.progress', {
                  completed: completedPrograms,
                  total: totalPrograms,
                })}
                {errorPrograms > 0 &&
                  ` ${t('ai-learning-path.common.withErrorsInline', { count: errorPrograms })}`}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {Math.round(progress)}%
              </Typography>
            </Stack>
            <LinearProgress variant="determinate" value={progress} />

            {!isGenerating && completedPrograms === totalPrograms && (
              <Alert severity="success" icon={<Iconify icon="solar:check-circle-bold" />}>
                {t('ai-learning-path.programStep.allProgramsSuccess')}
              </Alert>
            )}

            {!isGenerating && errorPrograms > 0 && (
              <Alert severity="warning">
                {t('ai-learning-path.programStep.programsWithErrors', { count: errorPrograms })}
              </Alert>
            )}
          </Stack>
        </Card>
      )}

      {/* Action Buttons */}
      <Stack direction="row" spacing={2} justifyContent="center">
        {!hasStarted && (
          <LoadingButton
            variant="contained"
            size="large"
            startIcon={<Iconify icon="solar:play-circle-bold" />}
            onClick={handleStartGeneration}
            loading={providerConfig.isLoadingProviders || isLoadingCatalogs}
            disabled={!providerConfig.textProvider || !providerConfig.textModel || isLoadingCatalogs}
          >
            {t('ai-learning-path.programStep.generateProgramsCta', { count: totalPrograms })}
          </LoadingButton>
        )}
        {isGenerating && (
          <LoadingButton
            variant="outlined"
            color="error"
            startIcon={<Iconify icon="solar:stop-circle-bold" />}
            onClick={handleAbort}
          >
            {t('ai-learning-path.actions.stop')}
          </LoadingButton>
        )}
      </Stack>
    </Stack>
  );
}
