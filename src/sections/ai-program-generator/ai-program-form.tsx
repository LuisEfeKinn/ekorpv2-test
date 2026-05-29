'use client';

// ----------------------------------------------------------------------
// AI Program Form Component
// ----------------------------------------------------------------------

import type { IAiProgram } from 'src/types/ai-program-generation';

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
  name: string;
  description: string;
  duration: string;
  objective: string;
  skillsToAcquire: string;
  whatYouWillLearn: string;
  tags: string;
  isActive: boolean;
};

type Props = {
  currentProgram?: Partial<IAiProgram>;
  onSubmit: (data: FormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
};

// ----------------------------------------------------------------------

export function AiProgramForm({ currentProgram, onSubmit, onCancel, isLoading }: Props) {
  const { t } = useTranslate('ai');

  const ProgramSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t('ai-program-generation.validation.nameRequired')),
        description: z.string().min(1, t('ai-program-generation.validation.descriptionRequired')),
        duration: z.string(),
        objective: z.string(),
        skillsToAcquire: z.string(),
        whatYouWillLearn: z.string(),
        tags: z.string(),
        isActive: z.boolean(),
      }),
    [t]
  );

  type SchemaValues = z.infer<typeof ProgramSchema>;

  const defaultValues: SchemaValues = useMemo(
    () => ({
      name: currentProgram?.name || '',
      description: currentProgram?.description || '',
      duration: currentProgram?.duration || '',
      objective: currentProgram?.objective || '',
      skillsToAcquire: currentProgram?.skillsToAcquire || '',
      whatYouWillLearn: currentProgram?.whatYouWillLearn || '',
      tags: currentProgram?.tags || '',
      isActive: currentProgram?.isActive ?? false,
    }),
    [currentProgram]
  );

  const methods = useForm<SchemaValues>({
    resolver: zodResolver(ProgramSchema),
    defaultValues,
  });

  const { reset, watch, setValue, handleSubmit } = methods;

  const isActive = watch('isActive');

  useEffect(() => {
    if (currentProgram) reset(defaultValues);
  }, [currentProgram, defaultValues, reset]);

  const handleFormSubmit = handleSubmit((data: SchemaValues) => {
    onSubmit(data);
  });

  return (
    <Form methods={methods} onSubmit={handleFormSubmit}>
      <Stack spacing={3}>
        {/* Basic Information */}
        <Card sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
            <Typography variant="h6">{t('ai-program-generation.form.basicInfo')}</Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={isActive}
                  onChange={(e) => setValue('isActive', e.target.checked)}
                  color="success"
                />
              }
              label={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Iconify
                    icon={isActive ? 'solar:check-circle-bold' : 'solar:file-text-bold'}
                    width={18}
                    color={isActive ? 'success.main' : 'warning.main'}
                  />
                  <Typography variant="body2" fontWeight={500}>
                    {isActive ? t('ai-program-generation.status.active') : t('ai-program-generation.status.inactive')}
                  </Typography>
                </Stack>
              }
              labelPlacement="start"
            />
          </Stack>

          <Stack spacing={3}>
            <Field.Text
              name="name"
              label={t('ai-program-generation.form.name')}
              placeholder={t('ai-program-generation.form.namePlaceholder')}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="solar:book-bold" width={20} />
                  </InputAdornment>
                ),
              }}
            />

            <Field.Text
              name="description"
              label={t('ai-program-generation.form.description')}
              placeholder={t('ai-program-generation.form.descriptionPlaceholder')}
              multiline
              rows={4}
            />

            <Field.Text
              name="duration"
              label={t('ai-program-generation.form.duration')}
              placeholder={t('ai-program-generation.form.durationPlaceholder')}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="solar:clock-circle-bold" width={20} />
                  </InputAdornment>
                ),
              }}
            />

            <Field.Text
              name="objective"
              label={t('ai-program-generation.form.objective')}
              placeholder={t('ai-program-generation.form.objectivePlaceholder')}
              multiline
              rows={3}
            />

            <Field.Text
              name="skillsToAcquire"
              label={t('ai-program-generation.form.skillsToAcquire')}
              placeholder={t('ai-program-generation.form.skillsToAcquirePlaceholder')}
              multiline
              rows={3}
            />

            <Field.Text
              name="whatYouWillLearn"
              label={t('ai-program-generation.form.whatYouWillLearn')}
              placeholder={t('ai-program-generation.form.whatYouWillLearnPlaceholder')}
              multiline
              rows={3}
            />

            <Field.Text
              name="tags"
              label={t('ai-program-generation.form.tags')}
              placeholder={t('ai-program-generation.form.tagsPlaceholder')}
              helperText={t('ai-program-generation.form.tagsHelper')}
            />
          </Stack>
        </Card>

        {/* Courses in Program (read-only display) */}
        {currentProgram?.courses && currentProgram.courses.length > 0 && (
          <Card sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {t('ai-program-generation.coursesIncluded', { count: currentProgram.courses.length })}
            </Typography>
            <Stack spacing={2}>
              {currentProgram.courses.map((course, idx) => (
                <Card key={idx} variant="outlined" sx={{ overflow: 'hidden' }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }}>
                    {course.image && (
                      <Box
                        component="img"
                        src={course.image}
                        alt={course.displayName}
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
                          label={idx + 1}
                          size="small"
                          color="primary"
                          sx={{ minWidth: 28, flexShrink: 0 }}
                        />
                        <Typography
                          variant="subtitle2"
                          sx={{ fontSize: { xs: '0.875rem', sm: '0.9375rem' }, lineHeight: 1.4 }}
                        >
                          {course.displayName}
                        </Typography>
                      </Stack>
                      {course.shortDescription && (
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
                          {course.shortDescription}
                        </Typography>
                      )}
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
              {t('ai-program-generation.actions.cancel')}
            </Button>
          )}
          <LoadingButton type="submit" variant="contained" loading={isLoading}>
            {t('ai-program-generation.actions.continue')}
          </LoadingButton>
        </Stack>
      </Stack>
    </Form>
  );
}
