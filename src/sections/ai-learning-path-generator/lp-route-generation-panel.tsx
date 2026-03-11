'use client';

// ----------------------------------------------------------------------
// Learning Path - Route Generation Panel (Step 4 / Final Step)
// Takes the instruction JSON + generated programs (with rowIds),
// generates the learning path structure using AI,
// saves via SaveOrUpdateLearningPathsService,
// and redirects to the learning paths listing.
// ----------------------------------------------------------------------

import type {
  ILPProviderConfig,
  ILPInstructionJSON,
  ILPGeneratedProgram,
} from 'src/types/ai-learning-path';
import type {
  CatalogPosition,
  ProgramReference,
  CatalogCompetency,
  CatalogSkillLevel,
  GeneratedRouteData,
} from './lp-route-generate-utils';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { GetPositionPaginationService } from 'src/services/learning/position.service';
import { SaveOrUpdateLearningPathsService } from 'src/services/learning/learningPaths.service';
import { GetCompetenciesKmPaginationService } from 'src/services/learning/competencesKm.service';
import { GetLearningObjectsSelectLevelsService } from 'src/services/learning/learningObjects.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { generateRoute } from './lp-route-generate-utils';

// ----------------------------------------------------------------------

type Props = {
  providerConfig: ILPProviderConfig;
  instructionJSON: ILPInstructionJSON;
  generatedPrograms: ILPGeneratedProgram[];
  onRouteSaved?: () => void;
  onError?: (error: string) => void;
};

// ----------------------------------------------------------------------

export function LPRouteGenerationPanel({
  providerConfig,
  instructionJSON,
  generatedPrograms,
  onRouteSaved,
  onError,
}: Props) {
  const { t } = useTranslate('ai');
  const router = useRouter();

  const [routeData, setRouteData] = useState<GeneratedRouteData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Catalogs
  const [positionsCatalog, setPositionsCatalog] = useState<CatalogPosition[]>([]);
  const [competenciesCatalog, setCompetenciesCatalog] = useState<CatalogCompetency[]>([]);
  const [skillLevelsCatalog, setSkillLevelsCatalog] = useState<CatalogSkillLevel[]>([]);
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(false);

  // Load catalogs on mount (positions, competencies, skill levels)
  useEffect(() => {
    const loadCatalogs = async () => {
      setIsLoadingCatalogs(true);
      try {
        const [positionsRes, competenciesRes, levelsRes] = await Promise.all([
          GetPositionPaginationService({ page: 1, perPage: 20 }),
          GetCompetenciesKmPaginationService({ page: 1, perPage: 20 }),
          GetLearningObjectsSelectLevelsService(),
        ]);

        // Positions
        const posItems: CatalogPosition[] = (positionsRes?.data?.data || []).map((item: any) => ({
          id: Number(item.id),
          name: item.name || '',
        }));
        setPositionsCatalog(posItems);

        // Competencies: response is [[...items], count] or { data: [...] }
        const compData = competenciesRes?.data?.data;
        const compItems: CatalogCompetency[] = (
          Array.isArray(compData?.[0]) ? compData[0] : compData?.data || []
        ).map((item: any) => ({
          id: Number(item.id),
          name: item.name || '',
        }));
        setCompetenciesCatalog(compItems);

        // Skill levels
        const levelsData = levelsRes?.data?.data || levelsRes?.data || [];
        const levelItems: CatalogSkillLevel[] = (Array.isArray(levelsData) ? levelsData : []).map(
          (item: any) => ({
            id: Number(item.id),
            name: item.name || '',
            levelOrder: item.levelOrder,
          })
        );
        setSkillLevelsCatalog(levelItems);
      } catch (err) {
        console.error('Error loading catalogs:', err);
      } finally {
        setIsLoadingCatalogs(false);
      }
    };

    loadCatalogs();
  }, []);

  // Build programs reference from generatedPrograms temp variable
  const programRefs: ProgramReference[] = generatedPrograms
    .filter((p) => p.status === 'completed' && p.rowId)
    .map((p, idx) => ({
      learningObjectId: Number(p.rowId),
      displayName: p.programData?.name || p.instruction_pg,
      shortDescription:
        (p.programData?.description || '').replace(/<[^>]*>/g, '').slice(0, 200) || '',
      order: idx + 1,
    }));

  // Generate learning path structure via AI
  const handleGenerate = useCallback(async () => {
    if (!providerConfig.textProvider || !providerConfig.textModel) {
      onError?.(t('ai-learning-path.errors.selectProviderModel'));
      return;
    }

    if (programRefs.length === 0) {
      onError?.(t('ai-learning-path.errors.noCompletedPrograms'));
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setRouteData(null);

    try {
      const data = await generateRoute({
        learningPathInstruction: instructionJSON.learning_path.instruction_lp,
        programs: programRefs,
        positions: positionsCatalog,
        competencies: competenciesCatalog,
        skillLevels: skillLevelsCatalog,
        provider: providerConfig.textProvider,
        model: providerConfig.textModel,
        getLegacyProviderType: providerConfig.getLegacyProviderType,
      });

      // Generate banner image if requested
      if (data.banner && data.generateBanner && providerConfig.imageProvider && providerConfig.imageModel) {
        try {
          const { GenerateAndUploadAiImageService } = await import(
            'src/services/ai/GenerateAiImage.service'
          );
          const bannerResult = await GenerateAndUploadAiImageService({
            prompt: data.banner,
            size: '1536x1024',
            provider: providerConfig.getLegacyProviderType(providerConfig.imageProvider),
            model: providerConfig.imageModel.modelKey,
          });
          if (bannerResult?.imageUrl) {
            data.bannerUrl = bannerResult.imageUrl;
          }
        } catch (bannerError) {
          console.error('Failed to generate banner:', bannerError);
        }
      }

      setRouteData(data);
      setHasGenerated(true);
    } catch (err: any) {
      console.error('Error generating route:', err);
      const msg = err.message || t('ai-learning-path.errors.routeGenerationUnknown');
      setGenerationError(msg);
      onError?.(msg);
    } finally {
      setIsGenerating(false);
    }
  }, [
    providerConfig,
    instructionJSON,
    programRefs,
    positionsCatalog,
    competenciesCatalog,
    skillLevelsCatalog,
    onError,
    t,
  ]);

  // Save learning path
  const handleSave = useCallback(async () => {
    if (!routeData) return;

    setIsSaving(true);
    try {
      const payload = {
        name: routeData.title,
        description: routeData.description,
        bannerUrl: routeData.bannerUrl || '',
        videoUrl: '',
        positionId: routeData.positionId ? Number(routeData.positionId) : undefined,
        isAIGenerated: true,
        modules:
          routeData.modules?.map((mod, modIdx) => ({
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

      await SaveOrUpdateLearningPathsService(payload);

      toast.success(t('ai-learning-path.messages.success.routeSaved'));
      router.push(paths.dashboard.learning.learningPaths);
      onRouteSaved?.();
    } catch (error) {
      console.error('Error saving learning path:', error);
      toast.error(t('ai-learning-path.messages.error.routeSaveError'));
    } finally {
      setIsSaving(false);
    }
  }, [routeData, router, onRouteSaved, t]);

  const completedPrograms = generatedPrograms.filter((p) => p.status === 'completed').length;

  return (
    <Stack spacing={2}>
      {/* Header */}
      <Card sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Iconify icon="solar:map-point-bold" width={32} color="primary.main" />
          <Box>
            <Typography variant="h6">{t('ai-learning-path.routeStep.title')}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t('ai-learning-path.routeStep.organizingCount', { count: completedPrograms })}
            </Typography>
          </Box>
        </Stack>

        {/* Catalog status */}
        {isLoadingCatalogs && (
          <Alert severity="info" icon={<CircularProgress size={16} />} sx={{ mt: 2 }}>
            {t('ai-learning-path.routeStep.loadingCatalogs')}
          </Alert>
        )}
        {!isLoadingCatalogs && positionsCatalog.length > 0 && (
          <Alert severity="success" icon={false} sx={{ py: 0.5, mt: 2 }}>
            {t('ai-learning-path.routeStep.catalogsLoaded', {
              positions: positionsCatalog.length,
              competencies: competenciesCatalog.length,
              levels: skillLevelsCatalog.length,
            })}
          </Alert>
        )}
      </Card>

      {/* Programs summary */}
      <Card sx={{ p: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          <Iconify
            icon="solar:point-on-map-perspective-bold"
            width={20}
            sx={{ mr: 1, verticalAlign: 'middle' }}
          />
          {t('ai-learning-path.routeStep.availablePrograms')}
        </Typography>
        <Stack spacing={1} sx={{ mt: 2 }}>
          {programRefs.map((prog, idx) => (
            <Stack
              key={idx}
              direction="row"
              alignItems="center"
              spacing={2}
              sx={{ p: 1.5, borderRadius: 1, bgcolor: 'success.lighter' }}
            >
              <Iconify icon="solar:check-circle-bold" width={20} color="success.main" />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2">{prog.displayName}</Typography>
                {prog.shortDescription && (
                  <Typography variant="caption" color="text.secondary">
                    {prog.shortDescription.slice(0, 100)}
                    {prog.shortDescription.length > 100 ? '...' : ''}
                  </Typography>
                )}
              </Box>
              <Chip
                label={t('ai-learning-path.common.idLabel', { id: prog.learningObjectId })}
                size="small"
                variant="soft"
                color="success"
              />
            </Stack>
          ))}
        </Stack>
      </Card>

      {/* Generation progress */}
      {isGenerating && (
        <Card sx={{ p: 3 }}>
          <Stack spacing={2} alignItems="center">
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              {t('ai-learning-path.routeStep.generatingStructure')}
            </Typography>
            <LinearProgress sx={{ width: '100%' }} />
          </Stack>
        </Card>
      )}

      {/* Generation error */}
      {generationError && (
        <Alert severity="error">{generationError}</Alert>
      )}

      {/* Generated route preview */}
      {routeData && (
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            <Iconify
              icon="solar:map-point-bold"
              width={22}
              sx={{ mr: 1, verticalAlign: 'middle' }}
            />
            {t('ai-learning-path.routeStep.previewTitle')}
          </Typography>

          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                {t('ai-learning-path.routeStep.fields.title')}
              </Typography>
              <Typography variant="h6">{routeData.title}</Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                {t('ai-learning-path.routeStep.fields.description')}
              </Typography>
              <Typography variant="body2">{routeData.description}</Typography>
            </Box>

            {routeData.tags && routeData.tags.length > 0 && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {t('ai-learning-path.routeStep.fields.tags')}
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                  {routeData.tags.map((tag, idx) => (
                    <Chip key={idx} label={tag} size="small" variant="soft" />
                  ))}
                </Stack>
              </Box>
            )}

            {routeData.positionName && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('ai-learning-path.routeStep.fields.position')}
                </Typography>
                <Chip label={routeData.positionName} size="small" color="info" />
              </Box>
            )}

            {routeData.bannerUrl && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {t('ai-learning-path.routeStep.fields.banner')}
                </Typography>
                <Box
                  component="img"
                  src={routeData.bannerUrl}
                  alt={t('ai-learning-path.routeStep.fields.banner')}
                  sx={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 1 }}
                />
              </Box>
            )}

            <Divider />

            {/* Modules */}
            <Typography variant="subtitle1">
              {t('ai-learning-path.routeStep.modules', { count: routeData.modules.length })}
            </Typography>
            {routeData.modules.map((mod, modIdx) => (
              <Card key={modIdx} variant="outlined" sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <Chip label={`M${modIdx + 1}`} size="small" color="primary" />
                  {mod.competencyName && (
                    <Chip label={mod.competencyName} size="small" variant="soft" color="secondary" />
                  )}
                  {mod.skillLevelName && (
                    <Chip label={mod.skillLevelName} size="small" variant="soft" color="info" />
                  )}
                </Stack>
                <Stack spacing={0.5} sx={{ pl: 2 }}>
                  {mod.learningObjects.map((lo, loIdx) => (
                    <Stack key={loIdx} direction="row" alignItems="center" spacing={1}>
                      <Iconify icon="solar:check-circle-bold" width={14} color="success.main" />
                      <Typography variant="body2">
                        {lo.displayName || t('ai-learning-path.routeStep.programIdFallback', { id: lo.learningObjectId })}
                      </Typography>
                      <Chip
                        label={t('ai-learning-path.common.idLabel', { id: lo.learningObjectId })}
                        size="small"
                        variant="soft"
                        color="info"
                        sx={{ fontSize: '0.65rem', height: 20 }}
                      />
                      {lo.isOptional && (
                        <Chip
                          label={t('ai-learning-path.routeStep.optional')}
                          size="small"
                          variant="soft"
                          color="warning"
                          sx={{ fontSize: '0.65rem', height: 20 }}
                        />
                      )}
                    </Stack>
                  ))}
                </Stack>
              </Card>
            ))}
          </Stack>
        </Card>
      )}

      {/* Action Buttons */}
      <Stack direction="row" spacing={2} justifyContent="center">
        {!hasGenerated && (
          <LoadingButton
            variant="contained"
            size="large"
            startIcon={<Iconify icon="solar:play-circle-bold" />}
            onClick={handleGenerate}
            loading={isGenerating || providerConfig.isLoadingProviders || isLoadingCatalogs}
            disabled={
              !providerConfig.textProvider ||
              !providerConfig.textModel ||
              isLoadingCatalogs ||
              programRefs.length === 0
            }
          >
            {t('ai-learning-path.routeStep.generateCta')}
          </LoadingButton>
        )}

        {hasGenerated && generationError && (
          <LoadingButton
            variant="outlined"
            size="large"
            startIcon={<Iconify icon="solar:restart-bold" />}
            onClick={handleGenerate}
            loading={isGenerating}
          >
            {t('ai-learning-path.actions.retryGeneration')}
          </LoadingButton>
        )}

        {routeData && (
          <LoadingButton
            variant="contained"
            color="success"
            size="large"
            startIcon={<Iconify icon="solar:import-bold" />}
            onClick={handleSave}
            loading={isSaving}
          >
            {t('ai-learning-path.routeStep.saveCta')}
          </LoadingButton>
        )}
      </Stack>
    </Stack>
  );
}
