'use client';

// ----------------------------------------------------------------------
// AI Course Form Component
// ----------------------------------------------------------------------

import type { IAiCourse, IAiCourseFormData } from 'src/types/ai-course';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogContent from '@mui/material/DialogContent';
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
  const { t } = useTranslate('ai');

  // Validation schema
  const CourseSchema = useMemo(
    () =>
      z.object({
        title: z.string().min(1, t('ai-course-generation.validation.titleRequired')),
        description: z.string().min(1, t('ai-course-generation.validation.descriptionRequired')),
        objectives: z.array(z.string()).min(1, t('ai-course-generation.validation.objectivesRequired')),
        targetAudience: z.string().min(1, t('ai-course-generation.validation.targetAudienceRequired')),
        duration: z.string().min(1, t('ai-course-generation.validation.durationRequired')),
        difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
        language: z.string().min(1, t('ai-course-generation.validation.languageRequired')),
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

  // Media lightbox state
  const [lightboxMedia, setLightboxMedia] = useState<{ type: 'image' | 'video'; url: string } | null>(null);

  const handleOpenLightbox = useCallback((type: 'image' | 'video', url: string) => {
    setLightboxMedia({ type, url });
  }, []);

  const handleCloseLightbox = useCallback(() => {
    setLightboxMedia(null);
  }, []);

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
    { value: 'beginner', label: t('ai-course-generation.difficulty.beginner') },
    { value: 'intermediate', label: t('ai-course-generation.difficulty.intermediate') },
    { value: 'advanced', label: t('ai-course-generation.difficulty.advanced') },
  ];

  const LANGUAGE_OPTIONS = [
    { value: 'es', label: t('ai-course-generation.languages.es') },
    { value: 'en', label: t('ai-course-generation.languages.en') },
    { value: 'pt', label: t('ai-course-generation.languages.pt') },
    { value: 'fr', label: t('ai-course-generation.languages.fr') },
  ];

  return (
    <Form methods={methods} onSubmit={handleFormSubmit}>
      <Stack spacing={3}>
        {/* Basic Information */}
        <Card sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
            <Typography variant="h6">
              {t('ai-course-generation.form.basicInfo')}
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
                    {status === 'published' ? t('ai-course-generation.status.published') || 'Publicado' : t('ai-course-generation.status.draft') || 'Borrador'}
                  </Typography>
                </Stack>
              }
              labelPlacement="start"
            />
          </Stack>

          <Stack spacing={3}>
            <Field.Text
              name="title"
              label={t('ai-course-generation.form.title')}
              placeholder={t('ai-course-generation.form.titlePlaceholder')}
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
              label={t('ai-course-generation.form.description')}
              placeholder={t('ai-course-generation.form.descriptionPlaceholder')}
              multiline
              rows={4}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Field.Select name="difficulty" label={t('ai-course-generation.form.difficulty')} sx={{ flex: 1 }}>
                {DIFFICULTY_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Field.Select>

              <Field.Select name="language" label={t('ai-course-generation.form.language')} sx={{ flex: 1 }}>
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
                label={t('ai-course-generation.form.duration')}
                placeholder={t('ai-course-generation.form.durationPlaceholder')}
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
                label={t('ai-course-generation.form.targetAudience')}
                placeholder={t('ai-course-generation.form.targetAudiencePlaceholder')}
                sx={{ flex: 1 }}
              />
            </Stack>
          </Stack>
        </Card>

        {/* Learning Objectives */}
        <Card sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
            <Typography variant="h6">{t('ai-course-generation.form.objectives')}</Typography>
            <Button
              size="small"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={handleAddObjective}
            >
              {t('ai-course-generation.form.addObjective')}
            </Button>
          </Stack>

          <Stack spacing={2}>
            {objectives.map((objective, index) => (
              <Stack key={index} direction="row" spacing={1} alignItems="center">
                <Field.Text
                  name={`objectives.${index}`}
                  label={`${t('ai-course-generation.form.objective')} ${index + 1}`}
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
            {t('ai-course-generation.form.tags')}
          </Typography>

          <Field.Autocomplete
            name="tags"
            label={t('ai-course-generation.form.tagsLabel')}
            placeholder={t('ai-course-generation.form.tagsPlaceholder')}
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
            {t('ai-course-generation.form.media')}
          </Typography>

          <Stack spacing={3}>
            <Field.Text
              name="bannerUrl"
              label={t('ai-course-generation.form.bannerUrl')}
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
                    {t('ai-course-generation.form.bannerPreview') || 'Vista previa del banner'}
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
              {t('ai-course-generation.form.courseContent')} ({currentCourse.sections.length} {t('ai-course-generation.form.sections').toLowerCase()})
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
                            label={`${section.images?.length || 1} ${t('ai-course-generation.form.image', { count: section.images?.length || 1 })}`}
                            size="small"
                            color="primary"
                            variant="soft"
                          />
                        )}
                        {(section.videos?.length > 0 || section.videoUrl) && (
                          <Chip
                            icon={<Iconify icon="solar:videocamera-record-bold" width={14} />}
                            label={`${section.videos?.length || 1} ${t('ai-course-generation.form.video', { count: section.videos?.length || 1 })}`}
                            size="small"
                            color="error"
                            variant="soft"
                          />
                        )}
                        {section.blocks && section.blocks.length > 0 && (
                          <Chip
                            icon={<Iconify icon="solar:list-bold" width={14} />}
                            label={`${section.blocks.length} ${t('ai-course-generation.form.block', { count: section.blocks.length })}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    </Stack>
                  </Box>

                  {/* Media Content - Compact rows */}
                  {((section.images?.length > 0 || section.imageUrl) || (section.videos?.length > 0 || section.videoUrl)) && (
                    <Box sx={{ p: 2, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider' }}>
                      <Stack spacing={1.5}>
                        {/* Images */}
                        {section.images?.map((img: any, imgIndex: number) => {
                          const imageUrl = img.url || '';
                          return (
                            <Stack
                              key={`img-${imgIndex}`}
                              direction="row"
                              spacing={1.5}
                              alignItems="center"
                              sx={{
                                p: 1,
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'divider',
                                bgcolor: 'background.neutral',
                              }}
                            >
                              <Box
                                onClick={() => imageUrl && handleOpenLightbox('image', imageUrl)}
                                sx={{
                                  width: 80,
                                  height: 52,
                                  flexShrink: 0,
                                  borderRadius: 1,
                                  overflow: 'hidden',
                                  bgcolor: 'grey.200',
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  cursor: imageUrl ? 'pointer' : 'default',
                                  position: 'relative',
                                  '&:hover .media-overlay': { opacity: 1 },
                                }}
                              >
                                {imageUrl && (
                                  <img
                                    src={imageUrl}
                                    alt={`Section ${index + 1} - Image ${imgIndex + 1}`}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                  />
                                )}
                                {imageUrl && (
                                  <Box
                                    className="media-overlay"
                                    sx={{
                                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                      bgcolor: 'rgba(0,0,0,0.4)', display: 'flex',
                                      alignItems: 'center', justifyContent: 'center',
                                      opacity: 0, transition: 'opacity 0.2s',
                                    }}
                                  >
                                    <Iconify icon="solar:eye-bold" width={20} sx={{ color: 'common.white' }} />
                                  </Box>
                                )}
                              </Box>
                              <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                  <Iconify icon="solar:gallery-circle-outline" width={14} sx={{ color: 'primary.main', flexShrink: 0 }} />
                                  <Typography variant="caption" color="text.secondary" noWrap>
                                    {t('ai-course-generation.form.image', { count: 1 })} {imgIndex + 1}
                                  </Typography>
                                </Stack>
                                <TextField
                                  fullWidth
                                  size="small"
                                  value={imageUrl}
                                  onChange={(e) => {
                                    const updatedSections = [...(currentCourse as any).sections];
                                    updatedSections[index].images[imgIndex].url = e.target.value;
                                    setValue('title', watch('title'), { shouldDirty: true });
                                  }}
                                  placeholder="URL"
                                  InputProps={{
                                    sx: { fontFamily: 'monospace', fontSize: '0.7rem', height: 32 },
                                  }}
                                />
                              </Stack>
                            </Stack>
                          );
                        })}

                        {!section.images?.length && section.imageUrl && (
                          <Stack
                            direction="row"
                            spacing={1.5}
                            alignItems="center"
                            sx={{
                              p: 1,
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: 'divider',
                              bgcolor: 'background.neutral',
                            }}
                          >
                            <Box
                              onClick={() => section.imageUrl && handleOpenLightbox('image', section.imageUrl)}
                              sx={{
                                width: 80,
                                height: 52,
                                flexShrink: 0,
                                borderRadius: 1,
                                overflow: 'hidden',
                                bgcolor: 'grey.200',
                                border: '1px solid',
                                borderColor: 'divider',
                                cursor: 'pointer',
                                position: 'relative',
                                '&:hover .media-overlay': { opacity: 1 },
                              }}
                            >
                              <img
                                src={section.imageUrl}
                                alt={`Section ${index + 1} - Image`}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                              <Box
                                className="media-overlay"
                                sx={{
                                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                  bgcolor: 'rgba(0,0,0,0.4)', display: 'flex',
                                  alignItems: 'center', justifyContent: 'center',
                                  opacity: 0, transition: 'opacity 0.2s',
                                }}
                              >
                                <Iconify icon="solar:eye-bold" width={20} sx={{ color: 'common.white' }} />
                              </Box>
                            </Box>
                            <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                              <Stack direction="row" alignItems="center" spacing={0.5}>
                                <Iconify icon="solar:gallery-circle-outline" width={14} sx={{ color: 'primary.main', flexShrink: 0 }} />
                                <Typography variant="caption" color="text.secondary" noWrap>
                                  {t('ai-course-generation.form.image', { count: 1 })}
                                </Typography>
                              </Stack>
                              <TextField
                                fullWidth
                                size="small"
                                value={section.imageUrl || ''}
                                onChange={(e) => {
                                  const updatedSections = [...(currentCourse as any).sections];
                                  updatedSections[index].imageUrl = e.target.value;
                                  setValue('title', watch('title'), { shouldDirty: true });
                                }}
                                placeholder="URL"
                                InputProps={{
                                  sx: { fontFamily: 'monospace', fontSize: '0.7rem', height: 32 },
                                }}
                              />
                            </Stack>
                          </Stack>
                        )}

                        {/* Videos */}
                        {section.videos?.map((vid: any, vidIndex: number) => {
                          const videoUrl = vid.url || '';
                          return (
                            <Stack
                              key={`vid-${vidIndex}`}
                              direction="row"
                              spacing={1.5}
                              alignItems="center"
                              sx={{
                                p: 1,
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'divider',
                                bgcolor: 'background.neutral',
                              }}
                            >
                              <Box
                                onClick={() => videoUrl && handleOpenLightbox('video', videoUrl)}
                                sx={{
                                  width: 80,
                                  height: 52,
                                  flexShrink: 0,
                                  borderRadius: 1,
                                  overflow: 'hidden',
                                  bgcolor: 'grey.900',
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: videoUrl ? 'pointer' : 'default',
                                  position: 'relative',
                                  '&:hover .media-overlay': { opacity: 1 },
                                }}
                              >
                                <Iconify icon="solar:videocamera-record-bold" width={24} sx={{ color: 'common.white' }} />
                                {videoUrl && (
                                  <Box
                                    className="media-overlay"
                                    sx={{
                                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                      bgcolor: 'rgba(0,0,0,0.3)', display: 'flex',
                                      alignItems: 'center', justifyContent: 'center',
                                      opacity: 0, transition: 'opacity 0.2s',
                                    }}
                                  >
                                    <Iconify icon="solar:play-circle-bold" width={24} sx={{ color: 'common.white' }} />
                                  </Box>
                                )}
                              </Box>
                              <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                  <Iconify icon="solar:videocamera-record-bold" width={14} sx={{ color: 'error.main', flexShrink: 0 }} />
                                  <Typography variant="caption" color="text.secondary" noWrap>
                                    {t('ai-course-generation.form.video', { count: 1 })} {vidIndex + 1}
                                  </Typography>
                                  {vid.videoId && (
                                    <Chip label={`ID: ${vid.videoId}`} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                                  )}
                                </Stack>
                                <TextField
                                  fullWidth
                                  size="small"
                                  value={videoUrl}
                                  onChange={(e) => {
                                    const updatedSections = [...(currentCourse as any).sections];
                                    updatedSections[index].videos[vidIndex].url = e.target.value;
                                    setValue('title', watch('title'), { shouldDirty: true });
                                  }}
                                  placeholder="URL"
                                  InputProps={{
                                    sx: { fontFamily: 'monospace', fontSize: '0.7rem', height: 32 },
                                  }}
                                />
                              </Stack>
                            </Stack>
                          );
                        })}

                        {!section.videos?.length && section.videoUrl && (
                          <Stack
                            direction="row"
                            spacing={1.5}
                            alignItems="center"
                            sx={{
                              p: 1,
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: 'divider',
                              bgcolor: 'background.neutral',
                            }}
                          >
                            <Box
                              onClick={() => handleOpenLightbox('video', section.videoUrl)}
                              sx={{
                                width: 80,
                                height: 52,
                                flexShrink: 0,
                                borderRadius: 1,
                                overflow: 'hidden',
                                bgcolor: 'grey.900',
                                border: '1px solid',
                                borderColor: 'divider',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                position: 'relative',
                                '&:hover .media-overlay': { opacity: 1 },
                              }}
                            >
                              <Iconify icon="solar:videocamera-record-bold" width={24} sx={{ color: 'common.white' }} />
                              <Box
                                className="media-overlay"
                                sx={{
                                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                  bgcolor: 'rgba(0,0,0,0.3)', display: 'flex',
                                  alignItems: 'center', justifyContent: 'center',
                                  opacity: 0, transition: 'opacity 0.2s',
                                }}
                              >
                                <Iconify icon="solar:play-circle-bold" width={24} sx={{ color: 'common.white' }} />
                              </Box>
                            </Box>
                            <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                              <Stack direction="row" alignItems="center" spacing={0.5}>
                                <Iconify icon="solar:videocamera-record-bold" width={14} sx={{ color: 'error.main', flexShrink: 0 }} />
                                <Typography variant="caption" color="text.secondary" noWrap>
                                  {t('ai-course-generation.form.video', { count: 1 })}
                                </Typography>
                              </Stack>
                              <TextField
                                fullWidth
                                size="small"
                                value={section.videoUrl || ''}
                                onChange={(e) => {
                                  const updatedSections = [...(currentCourse as any).sections];
                                  updatedSections[index].videoUrl = e.target.value;
                                  setValue('title', watch('title'), { shouldDirty: true });
                                }}
                                placeholder="URL"
                                InputProps={{
                                  sx: { fontFamily: 'monospace', fontSize: '0.7rem', height: 32 },
                                }}
                              />
                            </Stack>
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
              {t('ai-course-generation.actions.cancel')}
            </Button>
          )}
          <LoadingButton
            type="submit"
            variant="contained"
            loading={isSubmitting || isLoading}
            startIcon={<Iconify icon="solar:import-bold" />}
          >
            {currentCourse ? t('ai-course-generation.actions.update') : t('ai-course-generation.actions.create')}
          </LoadingButton>
        </Stack>
      </Stack>
      {/* Media Lightbox */}
      <Dialog
        open={!!lightboxMedia}
        onClose={handleCloseLightbox}
        maxWidth={false}
        fullScreen
        PaperProps={{ sx: { bgcolor: 'rgba(0, 0, 0, 0.95)', backdropFilter: 'blur(10px)' } }}
      >
        <DialogContent
          sx={{
            p: 0, position: 'relative', display: 'flex',
            alignItems: 'center', justifyContent: 'center', overflow: 'auto',
          }}
        >
          <IconButton
            onClick={handleCloseLightbox}
            sx={{
              position: 'fixed', top: 16, right: 16, zIndex: 10,
              bgcolor: 'rgba(255,255,255,0.1)', color: 'white',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
            }}
          >
            <Iconify icon="solar:close-circle-bold" width={28} />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', p: 3 }}>
            {lightboxMedia?.type === 'image' && (
              <Box
                component="img"
                src={lightboxMedia.url}
                alt="Preview"
                sx={{
                  maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain',
                  borderRadius: 2, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                }}
              />
            )}
            {lightboxMedia?.type === 'video' && (
              <Box
                component="video"
                src={lightboxMedia.url}
                autoPlay
                controls
                sx={{
                  maxWidth: '90vw', maxHeight: '85vh',
                  borderRadius: 2, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                }}
              />
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </Form>
  );
}
