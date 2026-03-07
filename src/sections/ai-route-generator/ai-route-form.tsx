'use client';

// ----------------------------------------------------------------------
// AI Route Form Component
// ----------------------------------------------------------------------

import type { IAiRoute } from 'src/types/ai-route-generation';

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
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

type FormData = {
  title: string;
  description: string;
  objectives: string[];
  targetAudience: string;
  estimatedDuration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  tags: string[];
  bannerUrl?: string;
  status?: string;
};

type Props = {
  currentRoute?: Partial<IAiRoute>;
  onSubmit: (data: FormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
};

// ----------------------------------------------------------------------

export function AiRouteForm({ currentRoute, onSubmit, onCancel, isLoading }: Props) {
  const { t } = useTranslate('ai');

  const RouteSchema = useMemo(
    () =>
      z.object({
        title: z.string().min(1, t('ai-route-generation.validation.titleRequired')),
        description: z.string().min(1, t('ai-route-generation.validation.descriptionRequired')),
        objectives: z.array(z.string()).min(1, t('ai-route-generation.validation.objectivesRequired')),
        targetAudience: z.string().min(1, t('ai-route-generation.validation.targetAudienceRequired')),
        estimatedDuration: z.string().min(1, t('ai-route-generation.validation.durationRequired')),
        difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
        language: z.string().min(1, t('ai-route-generation.validation.languageRequired')),
        tags: z.array(z.string()),
        bannerUrl: z.string().optional(),
        status: z.enum(['draft', 'generating', 'completed', 'published', 'archived']).optional(),
      }),
    [t]
  );

  type SchemaValues = z.infer<typeof RouteSchema>;

  const defaultValues: SchemaValues = useMemo(
    () => ({
      title: currentRoute?.title || '',
      description: currentRoute?.description || '',
      objectives: currentRoute?.objectives || [''],
      targetAudience: currentRoute?.targetAudience || '',
      estimatedDuration: currentRoute?.estimatedDuration || '',
      difficulty: currentRoute?.difficulty || 'intermediate',
      language: currentRoute?.language || 'es',
      tags: currentRoute?.tags || [],
      bannerUrl: currentRoute?.bannerUrl || '',
      status: currentRoute?.status || 'draft',
    }),
    [currentRoute]
  );

  const methods = useForm<SchemaValues>({
    resolver: zodResolver(RouteSchema),
    defaultValues,
  });

  const { reset, watch, setValue, handleSubmit } = methods;

  const objectives = watch('objectives');
  const status = watch('status');

  useEffect(() => {
    if (currentRoute) reset(defaultValues);
  }, [currentRoute, defaultValues, reset]);

  const handleAddObjective = () => setValue('objectives', [...objectives, '']);

  const handleRemoveObjective = (index: number) => {
    const newObjectives = objectives.filter((_, i) => i !== index);
    setValue('objectives', newObjectives.length > 0 ? newObjectives : ['']);
  };

  const handleObjectiveChange = (index: number, value: string) => {
    const newObjectives = [...objectives];
    newObjectives[index] = value;
    setValue('objectives', newObjectives);
  };

  const handleFormSubmit = handleSubmit((data) => {
    const filteredData = {
      ...data,
      objectives: data.objectives.filter((obj) => obj.trim() !== ''),
    };
    onSubmit(filteredData as FormData);
  });

  const DIFFICULTY_OPTIONS = [
    { value: 'beginner', label: t('ai-route-generation.difficulty.beginner') },
    { value: 'intermediate', label: t('ai-route-generation.difficulty.intermediate') },
    { value: 'advanced', label: t('ai-route-generation.difficulty.advanced') },
  ];

  const LANGUAGE_OPTIONS = [
    { value: 'es', label: t('ai-route-generation.languages.es') },
    { value: 'en', label: t('ai-route-generation.languages.en') },
    { value: 'pt', label: t('ai-route-generation.languages.pt') },
    { value: 'fr', label: t('ai-route-generation.languages.fr') },
  ];

  return (
    <Form methods={methods} onSubmit={handleFormSubmit}>
      <Stack spacing={3}>
        {/* Basic Information */}
        <Card sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
            <Typography variant="h6">{t('ai-route-generation.form.basicInfo')}</Typography>
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
                    {status === 'published' ? t('ai-route-generation.status.published') : t('ai-route-generation.status.draft')}
                  </Typography>
                </Stack>
              }
              labelPlacement="start"
            />
          </Stack>

          <Stack spacing={3}>
            <Field.Text
              name="title"
              label={t('ai-route-generation.form.title')}
              placeholder={t('ai-route-generation.form.titlePlaceholder')}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="solar:map-point-bold" width={20} />
                  </InputAdornment>
                ),
              }}
            />

            <Field.Text
              name="description"
              label={t('ai-route-generation.form.description')}
              placeholder={t('ai-route-generation.form.descriptionPlaceholder')}
              multiline
              rows={4}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Field.Select name="difficulty" label={t('ai-route-generation.form.difficulty')} sx={{ flex: 1 }}>
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Field.Select>

              <Field.Select name="language" label={t('ai-route-generation.form.language')} sx={{ flex: 1 }}>
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Field.Select>

              <Field.Text
                name="estimatedDuration"
                label={t('ai-route-generation.form.duration')}
                placeholder={t('ai-route-generation.form.durationPlaceholder')}
                sx={{ flex: 1 }}
              />
            </Stack>

            <Field.Text
              name="targetAudience"
              label={t('ai-route-generation.form.targetAudience')}
              placeholder={t('ai-route-generation.form.targetAudiencePlaceholder')}
            />
          </Stack>
        </Card>

        {/* Objectives */}
        <Card sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="h6">{t('ai-route-generation.form.objectives')}</Typography>
            <Button
              size="small"
              startIcon={<Iconify icon="solar:add-circle-bold" />}
              onClick={handleAddObjective}
            >
              {t('ai-route-generation.actions.add')}
            </Button>
          </Stack>

          <Stack spacing={2}>
            {objectives.map((objective, index) => (
              <Stack key={index} direction="row" spacing={1} alignItems="center">
                <Field.Text
                  name={`objectives.${index}`}
                  label={t('ai-route-generation.form.objective', { number: index + 1 })}
                  value={objective}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleObjectiveChange(index, e.target.value)
                  }
                  sx={{ flex: 1 }}
                />
                {objectives.length > 1 && (
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleRemoveObjective(index)}
                    sx={{ minWidth: 'auto' }}
                  >
                    <Iconify icon="solar:trash-bin-trash-bold" />
                  </Button>
                )}
              </Stack>
            ))}
          </Stack>
        </Card>

        {/* Modules in Route (read-only display) */}
        {currentRoute?.modules && currentRoute.modules.length > 0 && (
          <Card sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {t('ai-route-generation.modulesIncluded', { count: currentRoute.modules.length })}
            </Typography>
            <Stack spacing={2}>
              {currentRoute.modules.map((mod, modIdx) => (
                <Card key={modIdx} variant="outlined" sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Stack spacing={1.5}>
                    {/* Module header */}
                    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                      <Chip
                        label={`${t('ai-route-generation.module')} ${modIdx + 1}`}
                        size="small"
                        color="primary"
                      />
                      {mod.competencyName && (
                        <Chip label={mod.competencyName} size="small" variant="outlined" color="info" />
                      )}
                      {mod.skillLevelName && (
                        <Chip label={mod.skillLevelName} size="small" variant="soft" color="warning" />
                      )}
                    </Stack>

                    {/* Learning objects */}
                    <Stack spacing={1}>
                      {mod.learningObjects.map((lo, loIdx) => (
                        <Card key={lo.learningObjectId || loIdx} variant="outlined" sx={{ overflow: 'hidden' }}>
                          <Stack direction={{ xs: 'column', sm: 'row' }}>
                            {lo.image && (
                              <Box
                                component="img"
                                src={lo.image}
                                alt={lo.displayName}
                                sx={{
                                  width: { xs: '100%', sm: 120 },
                                  height: { xs: 140, sm: 'auto' },
                                  objectFit: 'cover',
                                  flexShrink: 0,
                                }}
                              />
                            )}
                            <Stack spacing={0.5} sx={{ p: { xs: 1.5, sm: 2 }, flex: 1, minWidth: 0 }}>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Chip
                                  label={loIdx + 1}
                                  size="small"
                                  color="default"
                                  sx={{ minWidth: 28, flexShrink: 0 }}
                                />
                                <Typography
                                  variant="subtitle2"
                                  sx={{
                                    fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                                    lineHeight: 1.4,
                                  }}
                                >
                                  {lo.displayName}
                                </Typography>
                                {lo.isOptional && (
                                  <Chip label={t('ai-route-generation.optional')} size="small" variant="soft" color="default" />
                                )}
                              </Stack>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 3,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                                  lineHeight: 1.5,
                                }}
                              >
                                {lo.shortDescription}
                              </Typography>
                            </Stack>
                          </Stack>
                        </Card>
                      ))}
                    </Stack>
                  </Stack>
                </Card>
              ))}
            </Stack>
          </Card>
        )}

        {/* Actions */}
        <Stack direction="row" justifyContent="flex-end" spacing={2}>
          {onCancel && (
            <Button variant="outlined" color="inherit" onClick={onCancel}>
              {t('ai-route-generation.actions.cancel')}
            </Button>
          )}
          <LoadingButton type="submit" variant="contained" loading={isLoading}>
            {t('ai-route-generation.actions.continue')}
          </LoadingButton>
        </Stack>
      </Stack>
    </Form>
  );
}
