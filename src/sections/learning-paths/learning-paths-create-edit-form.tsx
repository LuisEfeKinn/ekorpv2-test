'use client';

import type { IPosition, ILearningPath, ILearningObject } from 'src/types/learning';

import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import  React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { GetPositionPaginationService } from 'src/services/learning/position.service';
import { SaveOrUpdateLearningPathsService } from 'src/services/learning/learningPaths.service';
import { GetCompetenciesPaginationService } from 'src/services/architecture/catalogs/competencies.service';
import {
  GetLearningObjectsPaginationService,
  GetLearningObjectsSelectLevelsService
} from 'src/services/learning/learningObjects.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

type LearningPathModuleObjectType = {
  learningObjectId: string;
  order: number;
  isOptional: boolean;
};

type LearningPathModuleType = {
  competencyId: string;
  skillLevelId: string;
  order: number;
  learningObjects: LearningPathModuleObjectType[];
};

export type LearningPathsFormSchemaType = {
  name: string;
  description: string;
  videoUrl?: string;
  bannerUrl?: string;
  positionId: string;
  modules: LearningPathModuleType[];
};

// ----------------------------------------------------------------------

type Props = {
  currentLearningPath?: ILearningPath | null;
};

export function LearningPathsCreateEditForm({ currentLearningPath }: Props) {
  const router = useRouter();
  const { t } = useTranslate('learning');

  const [positions, setPositions] = useState<IPosition[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [positionSearchTerm, setPositionSearchTerm] = useState('');

  const [learningObjects, setLearningObjects] = useState<ILearningObject[]>([]);
  const [learningObjectsLoading, setLearningObjectsLoading] = useState(false);
  const [learningObjectSearchTerm, setLearningObjectSearchTerm] = useState('');

  const [skills, setSkills] = useState<any[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [skillSearchTerm, setSkillSearchTerm] = useState('');

  const [skillLevels, setSkillLevels] = useState<any[]>([]);
  const [skillLevelsLoading, setSkillLevelsLoading] = useState(false);

  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Estado para manejo de errores de preview
  const [bannerError, setBannerError] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  // Si está editando (currentLearningPath existe), todos contraídos. Si es nuevo, expandir el primero
  const [expandedModule, setExpandedModule] = useState<string | false>(
    currentLearningPath ? false : 'module-0'
  );

  // Función para normalizar URLs (agregar https:// si falta)
  const normalizeUrl = (url: string): string => {
    if (!url) return '';
    const trimmedUrl = url.trim();
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      return `https://${trimmedUrl}`;
    }
    return trimmedUrl;
  };

  // Función para convertir URL de video a formato embebido
  const getEmbedUrl = (url: string): { embedUrl: string; platform: string } | null => {
    if (!url) return null;
    
    // YouTube
    const youtubePattern = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/;
    const youtubeMatch = url.match(youtubePattern);
    if (youtubeMatch && youtubeMatch[1]) {
      return {
        embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}`,
        platform: 'youtube'
      };
    }
    
    // Vimeo
    const vimeoPattern = /vimeo\.com\/(\d+)/;
    const vimeoMatch = url.match(vimeoPattern);
    if (vimeoMatch && vimeoMatch[1]) {
      return {
        embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
        platform: 'vimeo'
      };
    }
    
    // Si ya es una URL de embed, devolverla
    if (url.includes('/embed/')) {
      return {
        embedUrl: url,
        platform: 'unknown'
      };
    }
    
    return null;
  };

  const LearningPathsFormSchema = z.object({
    name: z.string().min(1, { message: t('learning-paths.form.fields.name.required') }),
    description: z.string().min(1, { message: t('learning-paths.form.fields.description.required') }),
    videoUrl: z.string().optional().or(z.literal('')),
    bannerUrl: z.string().optional().or(z.literal('')),
    positionId: z.union([z.string(), z.number()]).refine((val) => {
      const strVal = String(val);
      return strVal && strVal.trim().length > 0;
    }, { message: t('learning-paths.form.fields.position.required') }),
    modules: z.array(
      z.object({
        competencyId: z.union([z.string(), z.number()]).refine((val) => {
          const strVal = String(val);
          return strVal && strVal.trim().length > 0;
        }, { message: t('learning-paths.form.fields.skill.required') }),
        skillLevelId: z.union([z.string(), z.number()]).refine((val) => {
          const strVal = String(val);
          return strVal && strVal.trim().length > 0;
        }, { message: t('learning-paths.form.fields.skillLevel.required') }),
        order: z.number().min(1, { message: t('learning-paths.form.fields.moduleOrder.min') }),
        learningObjects: z.array(
          z.object({
            learningObjectId: z.union([z.string(), z.number()]).refine((val) => {
              const strVal = String(val);
              return strVal && strVal.trim().length > 0;
            }, { message: t('learning-paths.form.fields.learningObject.required') }),
            order: z.number().min(1, { message: t('learning-paths.form.fields.learningObjectOrder.min') }),
            isOptional: z.boolean(),
          })
        ).min(1, { message: t('learning-paths.form.fields.learningObjects.min') }),
      })
    ).min(1, { message: t('learning-paths.form.fields.modules.min') }),
  });

  const defaultValues: LearningPathsFormSchemaType = useMemo(() => {
    if (currentLearningPath?.modules && currentLearningPath.modules.length > 0) {
      return {
        name: currentLearningPath.name || '',
        description: currentLearningPath.description || '',
        videoUrl: currentLearningPath.videoUrl || '',
        bannerUrl: currentLearningPath.bannerUrl || '',
        positionId: String(currentLearningPath.jobPositionId || ''),
        modules: currentLearningPath.modules.map((module) => ({
          competencyId: String(module.competencyId || ''),
          skillLevelId: String(module.skillLevelId || ''),
          order: module.order || 1,
          learningObjects: module.learningObjects.map((obj) => ({
            learningObjectId: String(obj.learningObjectId || ''),
            order: obj.order || 1,
            isOptional: obj.isOptional ?? false,
          })),
        })),
      };
    }

    return {
      name: currentLearningPath?.name || '',
      description: currentLearningPath?.description || '',
      videoUrl: currentLearningPath?.videoUrl || '',
      bannerUrl: currentLearningPath?.bannerUrl || '',
      positionId: String(currentLearningPath?.jobPositionId || ''),
      modules: [
        {
          competencyId: '',
          skillLevelId: '',
          order: 1,
          learningObjects: [
            {
              learningObjectId: '',
              order: 1,
              isOptional: false,
            },
          ],
        },
      ],
    };
  }, [currentLearningPath]);

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(LearningPathsFormSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const { fields: moduleFields, append: appendModule, remove: removeModule } = useFieldArray({
    control,
    name: 'modules',
  });

  // Solo resetear una vez cuando carga currentLearningPath
  const hasResetRef = useRef(false);
  
  useEffect(() => {
    if (currentLearningPath && !hasResetRef.current) {
      reset(defaultValues);
      hasResetRef.current = true;
    }
  }, [currentLearningPath, defaultValues, reset]);

  // Cargar posiciones con búsqueda
  const loadPositions = useCallback(async (search: string = '') => {
    setPositionsLoading(true);
    try {
      const params = {
        page: 1,
        perPage: 20,
        ...(search && { search }),
      };
      const response = await GetPositionPaginationService(params);
      const positionsData = response?.data?.data || [];
      setPositions(positionsData);
    } catch (error) {
      console.error('Error loading positions:', error);
      toast.error(t('learning-paths.messages.error.loadingPositions'));
    } finally {
      setPositionsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadPositions();
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [loadPositions]);

  // Búsqueda de posiciones con debounce
  useEffect(() => {
    if (!isInitialLoad && positionSearchTerm !== undefined) {
      const handler = setTimeout(() => {
        loadPositions(positionSearchTerm);
      }, 500);

      return () => clearTimeout(handler);
    }
    return undefined;
  }, [positionSearchTerm, loadPositions, isInitialLoad]);

  // Cargar objetos de aprendizaje con búsqueda
  const loadLearningObjects = useCallback(async (search: string = '') => {
    setLearningObjectsLoading(true);
    try {
      const params = {
        page: 1,
        perPage: 20,
        ...(search && { search }),
      };
      const response = await GetLearningObjectsPaginationService(params);
      const objectsData = response?.data?.data || [];
      setLearningObjects(objectsData);
    } catch (error) {
      console.error('Error loading learning objects:', error);
      toast.error(t('learning-paths.messages.error.loadingLearningObjects'));
    } finally {
      setLearningObjectsLoading(false);
    }
  }, [t]);

  // Cargar habilidades con búsqueda
  const loadSkills = useCallback(async (search: string = '') => {
    setSkillsLoading(true);
    try {
      const params = {
        page: 1,
        perPage: 50,
        ...(search && { search }),
      };
      const response = await GetCompetenciesPaginationService(params);
      const competencieData = response?.data[0] || [];
      setSkills(competencieData);
    } catch (error) {
      console.error('Error loading skills:', error);
      toast.error(t('learning-paths.messages.error.loadingSkills'));
    } finally {
      setSkillsLoading(false);
    }
  }, [t]);

  // Cargar niveles de habilidad
  const loadSkillLevels = useCallback(async () => {
    setSkillLevelsLoading(true);
    try {
      const response = await GetLearningObjectsSelectLevelsService();
      const levelsData = response?.data || [];
      setSkillLevels(levelsData);
    } catch (error) {
      console.error('Error loading skill levels:', error);
      toast.error(t('learning-paths.messages.error.loadingSkillLevels'));
    } finally {
      setSkillLevelsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadLearningObjects();
    loadSkills();
    loadSkillLevels();
  }, [loadLearningObjects, loadSkills, loadSkillLevels]);

  // Búsqueda de objetos de aprendizaje con debounce
  useEffect(() => {
    if (!isInitialLoad && learningObjectSearchTerm !== undefined) {
      const handler = setTimeout(() => {
        loadLearningObjects(learningObjectSearchTerm);
      }, 500);

      return () => clearTimeout(handler);
    }
    return undefined;
  }, [learningObjectSearchTerm, loadLearningObjects, isInitialLoad]);

  // Búsqueda de habilidades con debounce
  useEffect(() => {
    if (!isInitialLoad && skillSearchTerm !== undefined) {
      const handler = setTimeout(() => {
        loadSkills(skillSearchTerm);
      }, 500);

      return () => clearTimeout(handler);
    }
    return undefined;
  }, [skillSearchTerm, loadSkills, isInitialLoad]);

  // Observar cambios en los campos del formulario en tiempo real
  const watchedVideoUrl = watch('videoUrl');
  const watchedBannerUrl = watch('bannerUrl');
  const watchedModules = watch('modules');

  // Normalizar URLs para preview
  const videoUrl = normalizeUrl(watchedVideoUrl || '');

  // Resetear error de banner cuando cambia la URL
  useEffect(() => {
    setBannerError(false);
  }, [watchedBannerUrl]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const dataToSend = {
        name: data.name,
        description: data.description,
        videoUrl: data.videoUrl,
        bannerUrl: data.bannerUrl,
        positionId: Number(data.positionId),
        modules: data.modules.map((module) => ({
          competencyId: Number(module.competencyId),
          skillLevelId: Number(module.skillLevelId),
          order: module.order,
          learningObjects: module.learningObjects.map((obj) => ({
            learningObjectId: Number(obj.learningObjectId),
            order: obj.order,
            isOptional: obj.isOptional,
          })),
        })),
      };

      const response = currentLearningPath
        ? await SaveOrUpdateLearningPathsService(dataToSend, currentLearningPath.id)
        : await SaveOrUpdateLearningPathsService(dataToSend);

      if (response.data.statusCode === 201 || response.data.statusCode === 200) {
        toast.success(
          currentLearningPath
            ? t('learning-paths.messages.success.updated')
            : t('learning-paths.messages.success.created')
        );
        router.push(paths.dashboard.learning.learningPaths);
      }
    } catch (error) {
      console.error('Error saving learning path:', error);
      toast.error(t('learning-paths.messages.error.saving'));
    }
  });

  const handleAddModule = () => {
    const nextOrder = moduleFields.length + 1;
    const newModuleIndex = moduleFields.length;
    appendModule({
      competencyId: '',
      skillLevelId: '',
      order: nextOrder,
      learningObjects: [
        {
          learningObjectId: '',
          order: 1,
          isOptional: false,
        },
      ],
    });
    // Expandir el nuevo módulo y hacer scroll después de agregarlo
    setTimeout(() => {
      setExpandedModule(`module-${newModuleIndex}`);
      
      // Hacer scroll al nuevo módulo
      const newModuleElement = document.querySelector(`[data-module-index="${newModuleIndex}"]`);
      if (newModuleElement) {
        newModuleElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }, 100);
  };

  const handleRemoveModule = (index: number) => {
    if (moduleFields.length > 1) {
      removeModule(index);
    }
  };

  const getModuleColor = (idx: number): 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' => {
    const colors: Array<'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error'> = [
      'info',
      'success',
      'secondary',
      'warning',
      'primary',
      'error',
    ];
    return colors[idx % colors.length];
  };

  // Calcular estadísticas del formulario
  const totalModules = watchedModules?.length || 0;
  const totalCourses = watchedModules?.reduce((acc, module) => acc + (module.learningObjects?.length || 0), 0) || 0;

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={4} sx={{ mb: 5 }}>
        {/* Columna izquierda: Información principal y formularios */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Stack spacing={3}>
            {/* Nombre del Learning Path */}
            <Field.Text
              name="name"
              placeholder={t('learning-paths.form.fields.name.placeholder')}
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
                  fontWeight: 800,
                  lineHeight: 1.2,
                  '& input': {
                    padding: '8px 0',
                  },
                },
              }}
            />

            {/* Descripción */}
            <Field.Text
              name="description"
              placeholder={t('learning-paths.form.fields.description.placeholder')}
              multiline
              rows={4}
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: { xs: '0.95rem', sm: '1rem' },
                  lineHeight: 1.8,
                },
              }}
            />

            {/* Posición */}
            <Box
              sx={{
                p: 2.5,
                borderRadius: 2,
                bgcolor: (theme) => alpha(theme.palette.info.main, 0.08),
                border: (theme) => `1px solid ${alpha(theme.palette.info.main, 0.24)}`,
              }}
            >
              <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                <Iconify icon="solar:case-minimalistic-bold" width={24} sx={{ color: 'info.main', mt: 0.5 }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'info.darker' }}>
                    {t('learning-paths.form.fields.position.label')}
                  </Typography>
                  <Field.Autocomplete
                    name="positionId"
                    placeholder={t('learning-paths.form.fields.position.placeholder')}
                    options={positions.map((position) => String(position.id))}
                    loading={positionsLoading}
                    onInputChange={(event, value, reason) => {
                      if (reason === 'input') {
                        setPositionSearchTerm(value);
                      }
                    }}
                    getOptionLabel={(option) => {
                      if (typeof option === 'string' || typeof option === 'number') {
                        const found = positions.find((p) => String(p.id) === String(option));
                        if (found) return found.name;
                        return String(option);
                      }
                      return '';
                    }}
                    isOptionEqualToValue={(option, value) => String(option) === String(value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'background.paper',
                      },
                    }}
                  />
                </Box>
              </Stack>
            </Box>
          </Stack>
        </Grid>

        {/* Columna derecha: Preview de multimedia */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card
            sx={{
              height: '100%',
              minHeight: { xs: 300, sm: 350, md: 400 },
              position: 'relative',
              overflow: 'hidden',
              borderRadius: { xs: 2, sm: 3 },
              boxShadow: {
                xs: '0 8px 24px rgba(145, 158, 171, 0.16)',
                sm: '0 20px 40px rgba(145, 158, 171, 0.24)',
              },
            }}
          >
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                height: '100%',
                minHeight: { xs: 300, sm: 350, md: 400 },
              }}
            >
              {(() => {
                const videoData = getEmbedUrl(videoUrl);
                const normalizedBannerUrl = normalizeUrl(watchedBannerUrl || '');

                // Si hay video Y banner, mostrar cover con play button
                if (videoData && normalizedBannerUrl && !isVideoPlaying) {
                  return (
                    <>
                      {!bannerError ? (
                        <Box
                          component="img"
                          src={normalizedBannerUrl}
                          alt="Banner"
                          onError={() => setBannerError(true)}
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: '100%',
                            height: '100%',
                            bgcolor: 'background.neutral',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Stack alignItems="center" spacing={1}>
                            <Iconify icon="solar:gallery-add-bold" width={64} sx={{ color: 'text.disabled' }} />
                            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                              {t('learning-paths.form.preview.bannerError')}
                            </Typography>
                          </Stack>
                        </Box>
                      )}
                      {/* Overlay oscuro */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          bgcolor: 'rgba(0, 0, 0, 0.3)',
                          zIndex: 1,
                        }}
                      />
                      {/* Play button */}
                      <IconButton
                        onClick={() => setIsVideoPlaying(true)}
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          zIndex: 2,
                          width: { xs: 64, sm: 80 },
                          height: { xs: 64, sm: 80 },
                          bgcolor: 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(8px)',
                          '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 1)',
                            transform: 'translate(-50%, -50%) scale(1.1)',
                          },
                          transition: 'all 0.2s',
                        }}
                      >
                        <Iconify icon="solar:play-circle-bold" width={32} sx={{ color: 'primary.main' }} />
                      </IconButton>
                    </>
                  );
                }

                // Si hay video y está reproduciéndose, mostrar iframe
                if (videoData && isVideoPlaying) {
                  return (
                    <Box
                      component="iframe"
                      src={videoData.embedUrl}
                      title="Video preview"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        border: 'none',
                      }}
                    />
                  );
                }

                // Si solo hay video sin banner
                if (videoData && !normalizedBannerUrl) {
                  return (
                    <Box
                      component="iframe"
                      src={videoData.embedUrl}
                      title="Video preview"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        border: 'none',
                      }}
                    />
                  );
                }

                // Si solo hay banner sin video
                if (normalizedBannerUrl && !videoData) {
                  return !bannerError ? (
                    <Box
                      component="img"
                      src={normalizedBannerUrl}
                      alt="Banner"
                      onError={() => setBannerError(true)}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: '100%',
                        height: '100%',
                        bgcolor: 'background.neutral',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Stack alignItems="center" spacing={1}>
                        <Iconify icon="solar:gallery-add-bold" width={64} sx={{ color: 'text.disabled' }} />
                        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                          {t('learning-paths.form.preview.bannerError')}
                        </Typography>
                      </Stack>
                    </Box>
                  );
                }

                // Placeholder cuando no hay nada - Mostrar campos de entrada
                return (
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      bgcolor: 'background.neutral',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      p: 3,
                    }}
                  >
                    <Stack spacing={3} sx={{ width: '100%', maxWidth: 400 }}>
                      <Stack alignItems="center" spacing={2} sx={{ textAlign: 'center' }}>
                        <Iconify icon="solar:gallery-add-bold" width={64} sx={{ color: 'text.disabled' }} />
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {t('learning-paths.form.preview.noMedia')}
                        </Typography>
                      </Stack>

                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <Iconify icon="solar:videocamera-record-bold" width={20} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {t('learning-paths.form.fields.videoUrl.label')}
                          </Typography>
                        </Stack>
                        <Field.Text
                          name="videoUrl"
                          placeholder="https://youtube.com/watch?v=..."
                          size="small"
                          helperText="YouTube o Vimeo"
                        />
                      </Box>

                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <Iconify icon="solar:gallery-add-bold" width={20} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {t('learning-paths.form.fields.bannerUrl.label')}
                          </Typography>
                        </Stack>
                        <Field.Text
                          name="bannerUrl"
                          placeholder="https://ejemplo.com/imagen.jpg"
                          size="small"
                          helperText="Imagen de portada"
                        />
                      </Box>
                    </Stack>
                  </Box>
                );
              })()}

              {/* Info overlay con campos de URL - Mostrar solo cuando hay contenido Y no está reproduciendo */}
              {(getEmbedUrl(videoUrl) || normalizeUrl(watchedBannerUrl || '')) && !isVideoPlaying && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    p: { xs: 2, sm: 3 },
                    background: 'linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, transparent 100%)',
                    zIndex: 1,
                  }}
                >
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Iconify icon="solar:videocamera-record-bold" width={20} sx={{ color: 'common.white' }} />
                      <Typography variant="caption" sx={{ color: 'common.white', fontWeight: 600 }}>
                        {t('learning-paths.form.fields.videoUrl.label')}
                      </Typography>
                    </Stack>
                    <Field.Text
                      name="videoUrl"
                      placeholder="https://youtube.com/watch?v=..."
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(8px)',
                        },
                      }}
                    />
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Iconify icon="solar:gallery-add-bold" width={20} sx={{ color: 'common.white' }} />
                      <Typography variant="caption" sx={{ color: 'common.white', fontWeight: 600 }}>
                        {t('learning-paths.form.fields.bannerUrl.label')}
                      </Typography>
                    </Stack>
                    <Field.Text
                      name="bannerUrl"
                      placeholder="https://ejemplo.com/imagen.jpg"
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(8px)',
                        },
                      }}
                    />
                  </Stack>
                </Box>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* Contenido del programa - Módulos */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={3}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
                {t('learning-paths.form.sections.modules')}
              </Typography>
              <Button
                size="small"
                variant="soft"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={handleAddModule}
              >
                {t('learning-paths.actions.addModule')}
              </Button>
            </Stack>

            {moduleFields.length > 0 ? (
              <Stack spacing={0}>
                {moduleFields.map((module, moduleIndex) => {
                  const moduleColor = getModuleColor(moduleIndex);
                  const skillData = skills.find((s) => String(s.id) === String(watchedModules?.[moduleIndex]?.competencyId));
                  const levelData = skillLevels.find(
                    (l) => String(l.id) === String(watchedModules?.[moduleIndex]?.skillLevelId)
                  );
                  const moduleLearningObjects = watchedModules?.[moduleIndex]?.learningObjects || [];

                  return (
                    <React.Fragment key={module.id}>
                      <Box
                        data-module-index={moduleIndex}
                        sx={{
                          boxShadow: (theme) => `0 0 0 1px ${alpha(theme.palette[moduleColor].main, 0.08)}, 0 8px 16px ${alpha(theme.palette[moduleColor].main, 0.08)}`,
                          border: (theme) => `2px solid ${alpha(theme.palette[moduleColor].main, 0.24)}`,
                          borderRadius: '16px',
                          overflow: 'hidden',
                          position: 'relative',
                          backgroundColor: (theme) => alpha(theme.palette[moduleColor].main, 0.04),
                          transition: 'all 0.3s ease',
                          ...(expandedModule === `module-${moduleIndex}` && {
                            boxShadow: (theme) => `0 0 0 2px ${alpha(theme.palette[moduleColor].main, 0.24)}, 0 20px 40px ${alpha(theme.palette[moduleColor].main, 0.16)}`,
                            backgroundColor: (theme) => alpha(theme.palette[moduleColor].main, 0.08),
                          }),
                        }}
                      >
                      {/* Botón de eliminar */}
                      {moduleFields.length > 1 && (
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveModule(moduleIndex);
                          }}
                          sx={{
                            position: 'absolute',
                            top: 16,
                            right: 56,
                            zIndex: 10,
                            color: 'error.main',
                            '&:hover': {
                              bgcolor: (theme) => alpha(theme.palette.error.main, 0.08),
                            },
                          }}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" width={20} />
                        </IconButton>
                      )}

                      <Box
                        onClick={() => {
                          const newValue = expandedModule === `module-${moduleIndex}` ? false : `module-${moduleIndex}`;
                          setExpandedModule(newValue);
                        }}
                        sx={{
                          minHeight: '80px',
                          px: 3,
                          py: 2.5,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderBottom: expandedModule === `module-${moduleIndex}` 
                            ? (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.12)}`
                            : 'none',
                          '&:hover': {
                            bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04),
                          },
                        }}
                      >
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%', pr: 2 }}>
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: '12px',
                              bgcolor: (theme) => alpha(theme.palette[moduleColor].main, 0.16),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <Typography
                              variant="h6"
                              sx={{
                                color: `${moduleColor}.main`,
                                fontWeight: 700,
                              }}
                            >
                              {moduleIndex + 1}
                            </Typography>
                          </Box>

                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {skillData?.name || t('learning-paths.form.fields.skill.placeholder')}
                              </Typography>
                              {levelData && (
                                <Chip
                                  label={levelData.name}
                                  size="small"
                                  color={moduleColor}
                                  variant="soft"
                                />
                              )}
                            </Stack>

                            <Stack direction="row" spacing={2} alignItems="center">
                              <Stack direction="row" spacing={0.5} alignItems="center">
                                <Iconify
                                  icon="solar:notebook-bold-duotone"
                                  width={16}
                                  sx={{ color: 'text.secondary' }}
                                />
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  {moduleLearningObjects.length}{' '}
                                  {moduleLearningObjects.length === 1
                                    ? t('learning-paths.details.courseSingle')
                                    : t('learning-paths.details.coursePlural')}
                                </Typography>
                              </Stack>
                            </Stack>
                          </Box>
                        </Stack>

                        {/* Botón de expandir/colapsar */}
                        <IconButton
                          sx={{
                            color: 'text.secondary',
                            transition: 'transform 0.3s',
                            transform: expandedModule === `module-${moduleIndex}` ? 'rotate(180deg)' : 'rotate(0deg)',
                          }}
                        >
                          <Iconify icon="eva:arrow-ios-downward-fill" width={24} />
                        </IconButton>
                      </Box>

                      {/* Contenido expandible */}
                      {expandedModule === `module-${moduleIndex}` && (
                        <Box sx={{ p: 3, bgcolor: 'background.neutral' }}>
                          <ModuleEditContent
                            moduleIndex={moduleIndex}
                            control={control}
                            learningObjects={learningObjects}
                            learningObjectsLoading={learningObjectsLoading}
                            skills={skills}
                            skillsLoading={skillsLoading}
                            skillLevels={skillLevels}
                            skillLevelsLoading={skillLevelsLoading}
                            onSearchLearningObject={setLearningObjectSearchTerm}
                            onSearchSkill={setSkillSearchTerm}
                            moduleColor={moduleColor}
                          />
                        </Box>
                      )}
                    </Box>

                    {/* Flecha decorativa entre módulos */}
                    {moduleIndex < moduleFields.length - 1 && (
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          py: 3,
                        }}
                      >
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            background: (theme) => 
                              `linear-gradient(135deg, ${alpha(theme.palette[moduleColor].main, 0.08)} 0%, ${alpha(theme.palette[moduleColor].main, 0.16)} 100%)`,
                            border: (theme) => `2px dashed ${alpha(theme.palette[moduleColor].main, 0.32)}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette[moduleColor].main, 0.16)}`,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(2px)',
                              boxShadow: (theme) => `0 6px 16px ${alpha(theme.palette[moduleColor].main, 0.24)}`,
                            },
                          }}
                        >
                          <Iconify
                            icon="eva:arrow-ios-downward-fill"
                            width={24}
                            sx={{ 
                              color: `${moduleColor}.main`,
                              animation: 'bounce 2s infinite',
                              '@keyframes bounce': {
                                '0%, 100%': {
                                  transform: 'translateY(0)',
                                },
                                '50%': {
                                  transform: 'translateY(4px)',
                                },
                              },
                            }}
                          />
                        </Box>
                      </Box>
                    )}
                  </React.Fragment>
                );
              })}
              </Stack>
            ) : null}
          </Stack>
        </Grid>

        {/* Panel lateral derecho - Resumen */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Box
            sx={{
              position: { lg: 'sticky' },
              top: { lg: 24 },
            }}
          >
            <Card
              sx={{
                p: 3,
                border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
                boxShadow: '0 8px 24px rgba(145, 158, 171, 0.12)',
              }}
            >
              <Stack spacing={3}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Resumen del Programa
                </Typography>

                <Divider />

                {/* Información del programa */}
                <Stack spacing={2}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 1.5,
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.16),
                        color: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Iconify icon="solar:list-bold" width={24} />
                    </Box>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {totalModules}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {totalModules === 1 ? t('learning-paths.details.moduleSingle') : t('learning-paths.details.modulePlural')} {t('learning-paths.details.inTotal')}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 1.5,
                        bgcolor: (theme) => alpha(theme.palette.success.main, 0.16),
                        color: 'success.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Iconify icon="solar:play-circle-bold" width={24} />
                    </Box>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {totalCourses}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {totalCourses === 1 ? t('learning-paths.details.courseSingle') : t('learning-paths.details.coursePlural')} {t('learning-paths.details.inTotal')}
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>

                {/* Botones de acción */}
                <Stack spacing={2}>
                  <LoadingButton
                    fullWidth
                    size="large"
                    type="submit"
                    variant="contained"
                    loading={isSubmitting}
                    sx={{ borderRadius: 1.5, py: 1.5 }}
                  >
                    {currentLearningPath ? t('learning-paths.actions.update') : t('learning-paths.actions.create')}
                  </LoadingButton>

                  <Button
                    fullWidth
                    size="large"
                    variant="outlined"
                    onClick={() => router.push(paths.dashboard.learning.learningPaths)}
                    sx={{ borderRadius: 1.5, py: 1.5 }}
                  >
                    {t('learning-paths.actions.cancel')}
                  </Button>
                </Stack>
              </Stack>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Form>
  );
}

// ----------------------------------------------------------------------

type ModuleEditContentProps = {
  moduleIndex: number;
  control: any;
  learningObjects: ILearningObject[];
  learningObjectsLoading: boolean;
  skills: any[];
  skillsLoading: boolean;
  skillLevels: any[];
  skillLevelsLoading: boolean;
  onSearchLearningObject: (search: string) => void;
  onSearchSkill: (search: string) => void;
  moduleColor: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';
};

function ModuleEditContent({
  moduleIndex,
  control,
  learningObjects,
  learningObjectsLoading,
  skills,
  skillsLoading,
  skillLevels,
  skillLevelsLoading,
  onSearchLearningObject,
  onSearchSkill,
  moduleColor,
}: ModuleEditContentProps) {
  const { t } = useTranslate('learning');

  const { fields: objectFields, append: appendObject, remove: removeObject } = useFieldArray({
    control,
    name: `modules.${moduleIndex}.learningObjects`,
  });

  const handleAddLearningObject = () => {
    const nextOrder = objectFields.length + 1;
    appendObject({
      learningObjectId: '',
      order: nextOrder,
      isOptional: false,
    });
  };

  const handleRemoveLearningObject = (objectIndex: number) => {
    if (objectFields.length > 1) {
      removeObject(objectIndex);
    }
  };

  return (
    <Stack spacing={3}>
      {/* Configuración del módulo */}
      <Box
        sx={{
          p: 2.5,
          borderRadius: 2,
          bgcolor: 'background.paper',
          border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>
          {t('learning-paths.form.fields.module.label')} {moduleIndex + 1} - Configuración
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Field.Autocomplete
              name={`modules.${moduleIndex}.competencyId`}
              label={t('learning-paths.form.fields.skill.label')}
              placeholder={t('learning-paths.form.fields.skill.placeholder')}
              options={skills.map((skill) => String(skill.id))}
              loading={skillsLoading}
              onInputChange={(event, value, reason) => {
                if (reason === 'input') {
                  onSearchSkill(value);
                }
              }}
              getOptionLabel={(option) => {
                if (typeof option === 'string' || typeof option === 'number') {
                  const found = skills.find((s) => String(s.id) === String(option));
                  if (found) return found.name;
                  return String(option);
                }
                return '';
              }}
              isOptionEqualToValue={(option, value) => String(option) === String(value)}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Field.Autocomplete
              name={`modules.${moduleIndex}.skillLevelId`}
              label={t('learning-paths.form.fields.skillLevel.label')}
              placeholder={t('learning-paths.form.fields.skillLevel.placeholder')}
              options={skillLevels.map((level) => String(level.id))}
              loading={skillLevelsLoading}
              getOptionLabel={(option) => {
                if (typeof option === 'string' || typeof option === 'number') {
                  const found = skillLevels.find((l) => String(l.id) === String(option));
                  if (found) return found.name;
                  return String(option);
                }
                return '';
              }}
              isOptionEqualToValue={(option, value) => String(option) === String(value)}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Field.Text
              name={`modules.${moduleIndex}.order`}
              label={t('learning-paths.form.fields.moduleOrder.label')}
              type="number"
              InputProps={{ inputProps: { min: 1 } }}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Objetos de aprendizaje */}
      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {t('learning-paths.form.fields.learningObjects.label')}
          </Typography>
          <Button
            size="small"
            variant="soft"
            color={moduleColor}
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={handleAddLearningObject}
          >
            {t('learning-paths.actions.addLearningObject')}
          </Button>
        </Stack>

        <Stack spacing={2}>
          {objectFields.map((object, objectIndex) => (
            <Box
              key={object.id}
              sx={{
                p: 2.5,
                borderRadius: 2,
                bgcolor: 'background.paper',
                border: (theme) => `1px solid ${alpha(theme.palette[moduleColor].main, 0.24)}`,
                position: 'relative',
              }}
            >
              {objectFields.length > 1 && (
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveLearningObject(objectIndex)}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      color: 'error.main',
                      '&:hover': {
                        bgcolor: (theme) => alpha(theme.palette.error.main, 0.08),
                      },
                    }}
                  >
                    <Iconify width={18} icon="solar:trash-bin-trash-bold" />
                  </IconButton>
                )}

                <Stack spacing={2}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 1,
                        bgcolor: (theme) => alpha(theme.palette[moduleColor].main, 0.16),
                        color: `${moduleColor}.main`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.875rem',
                      }}
                    >
                      {objectIndex + 1}
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Objeto de Aprendizaje {objectIndex + 1}
                    </Typography>
                  </Stack>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <Field.Autocomplete
                        name={`modules.${moduleIndex}.learningObjects.${objectIndex}.learningObjectId`}
                        label={t('learning-paths.form.fields.learningObject.label')}
                        placeholder={t('learning-paths.form.fields.learningObject.placeholder')}
                        options={learningObjects.map((obj) => String(obj.id))}
                        loading={learningObjectsLoading}
                        onInputChange={(event, value, reason) => {
                          if (reason === 'input') {
                            onSearchLearningObject(value);
                          }
                        }}
                        getOptionLabel={(option) => {
                          if (typeof option === 'string' || typeof option === 'number') {
                            const found = learningObjects.find((obj) => String(obj.id) === String(option));
                            if (found) return found.name;
                            return String(option);
                          }
                          return '';
                        }}
                        isOptionEqualToValue={(option, value) => String(option) === String(value)}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Field.Text
                        name={`modules.${moduleIndex}.learningObjects.${objectIndex}.order`}
                        label={t('learning-paths.form.fields.learningObjectOrder.label')}
                        type="number"
                        InputProps={{ inputProps: { min: 1 } }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Field.Switch
                        name={`modules.${moduleIndex}.learningObjects.${objectIndex}.isOptional`}
                        label={t('learning-paths.form.fields.isOptional.label')}
                      />
                    </Grid>
                  </Grid>
                </Stack>
              </Box>
            ))}
        </Stack>
      </Box>
    </Stack>
  );
}
