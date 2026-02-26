'use client';

// ----------------------------------------------------------------------
// AI Course Form Component
// ----------------------------------------------------------------------

import type { IAiCourse, IAiCourseFormData } from 'src/types/ai-course';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { useMemo, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

type Props = {
  currentCourse?: IAiCourse | IAiCourseFormData;
  onSubmit: (data: IAiCourseFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
};

// ----------------------------------------------------------------------

export function AiCourseForm({ currentCourse, onSubmit, onCancel, isLoading }: Props) {
  const { t } = useTranslate('ai-course');

  // Validation schema
  const CourseSchema = useMemo(
    () =>
      z.object({
        title: z.string().min(1, t('validation.titleRequired')),
        description: z.string().min(1, t('validation.descriptionRequired')),
        objectives: z.array(z.string()).min(1, t('validation.objectivesRequired')),
        targetAudience: z.string().min(1, t('validation.targetAudienceRequired')),
        duration: z.string().min(1, t('validation.durationRequired')),
        difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
        language: z.string().min(1, t('validation.languageRequired')),
        tags: z.array(z.string()),
        bannerUrl: z.string().optional(),
        status: z.enum(['draft', 'generating', 'completed', 'published', 'archived']).optional(),
      }),
    [t]
  );

  type FormValues = z.infer<typeof CourseSchema>;

  const defaultValues: FormValues = useMemo(
    () => ({
      title: currentCourse?.title || '',
      description: currentCourse?.description || '',
      objectives: currentCourse?.objectives || [''],
      targetAudience: currentCourse?.targetAudience || '',
      duration: currentCourse?.duration || '',
      difficulty: currentCourse?.difficulty || 'intermediate',
      language: currentCourse?.language || 'es',
      tags: currentCourse?.tags || [],
      bannerUrl: currentCourse?.bannerUrl || '',
      status: (currentCourse as IAiCourse)?.status || 'draft',
    }),
    [currentCourse]
  );

  const methods = useForm<FormValues>({
    resolver: zodResolver(CourseSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const objectives = watch('objectives');
  const bannerUrl = watch('bannerUrl');
  const status = watch('status');

  useEffect(() => {
    if (currentCourse) {
      reset(defaultValues);
    }
  }, [currentCourse, defaultValues, reset]);

  // Add objective
  const handleAddObjective = () => {
    setValue('objectives', [...objectives, '']);
  };

  // Remove objective
  const handleRemoveObjective = (index: number) => {
    const newObjectives = objectives.filter((_, i) => i !== index);
    setValue('objectives', newObjectives.length > 0 ? newObjectives : ['']);
  };

  // Update objective
  const handleObjectiveChange = (index: number, value: string) => {
    const newObjectives = [...objectives];
    newObjectives[index] = value;
    setValue('objectives', newObjectives);
  };

  const handleFormSubmit = handleSubmit((data) => {
    // Filter empty objectives
    const filteredData = {
      ...data,
      objectives: data.objectives.filter((obj) => obj.trim() !== ''),
    };
    onSubmit(filteredData as IAiCourseFormData);
  });

  const DIFFICULTY_OPTIONS = [
    { value: 'beginner', label: t('difficulty.beginner') },
    { value: 'intermediate', label: t('difficulty.intermediate') },
    { value: 'advanced', label: t('difficulty.advanced') },
  ];

  const LANGUAGE_OPTIONS = [
    { value: 'es', label: t('languages.es') },
    { value: 'en', label: t('languages.en') },
    { value: 'pt', label: t('languages.pt') },
    { value: 'fr', label: t('languages.fr') },
  ];

  return (
    <Form methods={methods} onSubmit={handleFormSubmit}>
      <Stack spacing={3}>
        {/* Basic Information */}
        <Card sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
            <Typography variant="h6">
              {t('form.basicInfo')}
            </Typography>

            {/* Status Switch */}
            <FormControlLabel
              control={
                <Switch
                  checked={status === 'published'}
                  onChange={(e) => setValue('status', e.target.checked ? 'published' : 'draft')}
                  color="success"
                />
              }
              label={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Iconify
                    icon={status === 'published' ? 'solar:check-circle-bold' : 'solar:file-text-bold'}
                    width={18}
                    color={status === 'published' ? 'success.main' : 'warning.main'}
                  />
                  <Typography variant="body2" fontWeight={500}>
                    {status === 'published' ? t('status.published') || 'Publicado' : t('status.draft') || 'Borrador'}
                  </Typography>
                </Stack>
              }
              labelPlacement="start"
            />
          </Stack>

          <Stack spacing={3}>
            <Field.Text
              name="title"
              label={t('form.title')}
              placeholder={t('form.titlePlaceholder')}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="solar:file-text-bold" width={20} />
                  </InputAdornment>
                ),
              }}
            />

            <Field.Text
              name="description"
              label={t('form.description')}
              placeholder={t('form.descriptionPlaceholder')}
              multiline
              rows={4}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Field.Select name="difficulty" label={t('form.difficulty')} sx={{ flex: 1 }}>
                {DIFFICULTY_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Field.Select>

              <Field.Select name="language" label={t('form.language')} sx={{ flex: 1 }}>
                {LANGUAGE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Field.Select>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Field.Text
                name="duration"
                label={t('form.duration')}
                placeholder={t('form.durationPlaceholder')}
                sx={{ flex: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="solar:clock-circle-bold" width={20} />
                    </InputAdornment>
                  ),
                }}
              />

              <Field.Text
                name="targetAudience"
                label={t('form.targetAudience')}
                placeholder={t('form.targetAudiencePlaceholder')}
                sx={{ flex: 1 }}
              />
            </Stack>
          </Stack>
        </Card>

        {/* Learning Objectives */}
        <Card sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
            <Typography variant="h6">{t('form.objectives')}</Typography>
            <Button
              size="small"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={handleAddObjective}
            >
              {t('form.addObjective')}
            </Button>
          </Stack>

          <Stack spacing={2}>
            {objectives.map((objective, index) => (
              <Stack key={index} direction="row" spacing={1} alignItems="center">
                <Field.Text
                  name={`objectives.${index}`}
                  label={`${t('form.objective')} ${index + 1}`}
                  value={objective}
                  onChange={(e) => handleObjectiveChange(index, e.target.value)}
                  sx={{ flex: 1 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify icon="solar:flag-bold" width={20} />
                      </InputAdornment>
                    ),
                  }}
                />
                {objectives.length > 1 && (
                  <Button
                    color="error"
                    size="small"
                    onClick={() => handleRemoveObjective(index)}
                  >
                    <Iconify icon="solar:trash-bin-trash-bold" width={20} />
                  </Button>
                )}
              </Stack>
            ))}
          </Stack>
        </Card>

        {/* Tags */}
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            {t('form.tags')}
          </Typography>

          <Field.Autocomplete
            name="tags"
            label={t('form.tagsLabel')}
            placeholder={t('form.tagsPlaceholder')}
            multiple
            freeSolo
            options={[]}
            getOptionLabel={(option) => option}
            renderOption={(props, option) => (
              <li {...props} key={option}>
                {option}
              </li>
            )}
          />
        </Card>

        {/* Media */}
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            {t('form.media')}
          </Typography>

          <Stack spacing={3}>
            <Field.Text
              name="bannerUrl"
              label={t('form.bannerUrl')}
              placeholder="https://..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="solar:gallery-add-bold" width={20} />
                  </InputAdornment>
                ),
              }}
            />

            {/* Banner Preview */}
            {bannerUrl && (
              <Box
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'grey.100',
                }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    height: 200,
                    bgcolor: 'grey.200',
                  }}
                >
                  <img
                    src={bannerUrl}
                    alt="Banner preview"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        parent.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#666;"><span>Vista previa no disponible</span></div>';
                      }
                    }}
                  />
                </Box>
                <Box sx={{ p: 1, bgcolor: 'background.paper' }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('form.bannerPreview') || 'Vista previa del banner'}
                  </Typography>
                </Box>
              </Box>
            )}
          </Stack>
        </Card>

        {/* Course Content (Sections) - Detailed View */}
        {currentCourse && 'sections' in currentCourse && currentCourse.sections && currentCourse.sections.length > 0 && (
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              {t('form.courseContent')} ({currentCourse.sections.length} {t('sections').toLowerCase()})
            </Typography>

            <Stack spacing={2}>
              {currentCourse.sections.map((section: any, index: number) => (
                <Card
                  key={section.id || index}
                  variant="outlined"
                  sx={{ overflow: 'hidden' }}
                >
                  {/* Section Header */}
                  <Box sx={{ p: 2, bgcolor: 'background.neutral' }}>
                    <Stack spacing={1}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography
                          variant="caption"
                          sx={{
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            fontWeight: 'bold',
                          }}
                        >
                          {index + 1}
                        </Typography>
                        <Typography variant="subtitle2">{section.title}</Typography>
                        {section.duration && (
                          <Chip
                            icon={<Iconify icon="solar:clock-circle-bold" width={14} />}
                            label={section.duration}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Stack>

                      {section.description && (
                        <Typography variant="caption" color="text.secondary">
                          {section.description}
                        </Typography>
                      )}

                      {/* Media indicators */}
                      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                        {(section.images?.length > 0 || section.imageUrl) && (
                          <Chip
                            icon={<Iconify icon="solar:gallery-circle-outline" width={14} />}
                            label={`${section.images?.length || 1} imagen${section.images?.length > 1 ? 'es' : ''}`}
                            size="small"
                            color="primary"
                            variant="soft"
                          />
                        )}
                        {(section.videos?.length > 0 || section.videoUrl) && (
                          <Chip
                            icon={<Iconify icon="solar:videocamera-record-bold" width={14} />}
                            label={`${section.videos?.length || 1} video${section.videos?.length > 1 ? 's' : ''}`}
                            size="small"
                            color="error"
                            variant="soft"
                          />
                        )}
                        {section.blocks && section.blocks.length > 0 && (
                          <Chip
                            icon={<Iconify icon="solar:list-bold" width={14} />}
                            label={`${section.blocks.length} bloque${section.blocks.length > 1 ? 's' : ''}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    </Stack>
                  </Box>

                  {/* Media Content - Images */}
                  {(section.images?.length > 0 || section.imageUrl) && (
                    <Box sx={{ p: 2, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                        <Iconify icon="solar:gallery-circle-outline" width={16} sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                        {t('form.imagesInSection')}:
                      </Typography>
                      <Stack spacing={1.5}>
                        {section.images?.map((img: any, imgIndex: number) => {
                          const imageUrl = img.url || '';
                          return (
                            <Stack key={imgIndex} spacing={1}>
                              <Box
                                sx={{
                                  borderRadius: 1.5,
                                  overflow: 'hidden',
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  bgcolor: 'grey.100',
                                }}
                              >
                                <Box
                                  sx={{
                                    position: 'relative',
                                    height: 120,
                                    bgcolor: 'grey.200',
                                  }}
                                >
                                  {imageUrl && (
                                    <img
                                      src={imageUrl}
                                      alt={`Section ${index + 1} - Image ${imgIndex + 1}`}
                                      style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                      }}
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  )}
                                </Box>
                              </Box>
                              <TextField
                                fullWidth
                                size="small"
                                value={imageUrl}
                                onChange={(e) => {
                                  const updatedSections = [...(currentCourse as any).sections];
                                  updatedSections[index].images[imgIndex].url = e.target.value;
                                  // Force re-render by creating new object
                                  setValue('title', watch('title'), { shouldDirty: true });
                                }}
                                placeholder="URL de la imagen"
                                InputProps={{
                                  sx: {
                                    fontFamily: 'monospace',
                                    fontSize: '0.75rem',
                                  },
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <Iconify icon="solar:gallery-circle-outline" width={16} />
                                    </InputAdornment>
                                  ),
                                }}
                              />
                            </Stack>
                          );
                        })}
                        {!section.images?.length && section.imageUrl && (
                          <Stack spacing={1}>
                            <Box
                              sx={{
                                borderRadius: 1.5,
                                overflow: 'hidden',
                                border: '1px solid',
                                borderColor: 'divider',
                                bgcolor: 'grey.100',
                              }}
                            >
                              <Box
                                sx={{
                                  position: 'relative',
                                  height: 120,
                                  bgcolor: 'grey.200',
                                }}
                              >
                                {section.imageUrl && (
                                  <img
                                    src={section.imageUrl}
                                    alt={`Section ${index + 1} - Image`}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                    }}
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                )}
                              </Box>
                            </Box>
                            <TextField
                              fullWidth
                              size="small"
                              value={section.imageUrl || ''}
                              onChange={(e) => {
                                const updatedSections = [...(currentCourse as any).sections];
                                updatedSections[index].imageUrl = e.target.value;
                                // Force re-render
                                setValue('title', watch('title'), { shouldDirty: true });
                              }}
                              placeholder="URL de la imagen"
                              InputProps={{
                                sx: {
                                  fontFamily: 'monospace',
                                  fontSize: '0.75rem',
                                },
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <Iconify icon="solar:gallery-circle-outline" width={16} />
                                  </InputAdornment>
                                ),
                              }}
                            />
                          </Stack>
                        )}
                      </Stack>
                    </Box>
                  )}

                  {/* Media Content - Videos */}
                  {(section.videos?.length > 0 || section.videoUrl) && (
                    <Box sx={{ p: 2, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                        <Iconify icon="solar:videocamera-record-bold" width={16} sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                        {t('form.videosInSection')}:
                      </Typography>
                      <Stack spacing={1.5}>
                        {section.videos?.map((vid: any, vidIndex: number) => {
                          const videoUrl = vid.url || '';
                          return (
                            <Stack key={vidIndex} spacing={1}>
                              <Box
                                sx={{
                                  borderRadius: 1.5,
                                  overflow: 'hidden',
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  bgcolor: 'grey.900',
                                }}
                              >
                                {videoUrl && (
                                  <Box
                                    component="video"
                                    controls
                                    key={videoUrl}
                                    sx={{
                                      width: '100%',
                                      height: 150,
                                      bgcolor: 'grey.900',
                                    }}
                                  >
                                    <source src={videoUrl} type="video/mp4" />
                                  </Box>
                                )}
                              </Box>
                              <TextField
                                fullWidth
                                size="small"
                                value={videoUrl}
                                onChange={(e) => {
                                  const updatedSections = [...(currentCourse as any).sections];
                                  updatedSections[index].videos[vidIndex].url = e.target.value;
                                  // Force re-render
                                  setValue('title', watch('title'), { shouldDirty: true });
                                }}
                                placeholder="URL del video"
                                InputProps={{
                                  sx: {
                                    fontFamily: 'monospace',
                                    fontSize: '0.75rem',
                                  },
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <Iconify icon="solar:videocamera-record-bold" width={16} />
                                    </InputAdornment>
                                  ),
                                }}
                              />
                              {vid.videoId && (
                                <Chip
                                  label={`ID: ${vid.videoId}`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ width: 'fit-content' }}
                                />
                              )}
                            </Stack>
                          );
                        })}
                        {!section.videos?.length && section.videoUrl && (
                          <Stack spacing={1}>
                            <Box
                              sx={{
                                borderRadius: 1.5,
                                overflow: 'hidden',
                                border: '1px solid',
                                borderColor: 'divider',
                                bgcolor: 'grey.900',
                              }}
                            >
                              {section.videoUrl && (
                                <Box
                                  component="video"
                                  controls
                                  key={section.videoUrl}
                                  sx={{
                                    width: '100%',
                                    height: 150,
                                    bgcolor: 'grey.900',
                                  }}
                                >
                                  <source src={section.videoUrl} type="video/mp4" />
                                </Box>
                              )}
                            </Box>
                            <TextField
                              fullWidth
                              size="small"
                              value={section.videoUrl || ''}
                              onChange={(e) => {
                                const updatedSections = [...(currentCourse as any).sections];
                                updatedSections[index].videoUrl = e.target.value;
                                // Force re-render
                                setValue('title', watch('title'), { shouldDirty: true });
                              }}
                              placeholder="URL del video"
                              InputProps={{
                                sx: {
                                  fontFamily: 'monospace',
                                  fontSize: '0.75rem',
                                },
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <Iconify icon="solar:videocamera-record-bold" width={16} />
                                  </InputAdornment>
                                ),
                              }}
                            />
                          </Stack>
                        )}
                      </Stack>
                    </Box>
                  )}
                </Card>
              ))}
            </Stack>
          </Card>
        )}

        <Divider />

        {/* Actions */}
        <Stack direction="row" justifyContent="flex-end" spacing={2}>
          {onCancel && (
            <Button variant="outlined" color="inherit" onClick={onCancel}>
              {t('actions.cancel')}
            </Button>
          )}
          <LoadingButton
            type="submit"
            variant="contained"
            loading={isSubmitting || isLoading}
            startIcon={<Iconify icon="solar:import-bold" />}
          >
            {currentCourse ? t('actions.update') : t('actions.create')}
          </LoadingButton>
        </Stack>
      </Stack>
    </Form>
  );
}
