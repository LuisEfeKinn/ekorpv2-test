'use client';

import { z as zod } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useId, useMemo, useEffect, useCallback } from 'react';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { useTranslate } from 'src/locales';

import { Form, Field } from 'src/components/hook-form';

export type AuditRating =
  | ''
  | 'excellent'
  | 'good'
  | 'needsImprovement'
  | 'urgentImprovement'
  | 'notApplicable';

export type AuditSelectOption = {
  value: string;
  label: string;
};

export type AuditRelationOption = {
  id: string;
  label: string;
};

export type AuditFrotmValues = {
  relatedSystems: AuditRelationOption[];
  user: string;
  date: string | null;
  report: string;
  recommendations: string;
  comments: string;
  processCompliance: AuditRating;
  organizationCompliance: AuditRating;
  policiesCompliance: AuditRating;
  toolsUsage: AuditRating;
  deliverablesCompliance: AuditRating;
  file: File | string | null;
  status: string;
  lastReview: string | null;
  collaborators: string;
  type: string;
};

export type AuditApiPayload = {
  date: string | null;
  report: string;
  recommendations: string;
  objectives: boolean;
  materials: boolean;
  methodology: boolean;
  tools: boolean;
  learning: boolean;
  status: boolean;
  lastReview: string | null;
  collaborators: string;
  auditClass: string;
  type: string;
  comments: string;
};

export type AuditPayloadMeta = Partial<
  Pick<
    AuditApiPayload,
    'objectives' | 'materials' | 'methodology' | 'tools' | 'learning' | 'auditClass'
  >
> & {
  status?: boolean;
};

function toIsoOrNull(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function parseBoolean(value: string): boolean | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'activo' || normalized === 'active') {
    return true;
  }
  if (
    normalized === 'false' ||
    normalized === '0' ||
    normalized === 'inactivo' ||
    normalized === 'inactive'
  ) {
    return false;
  }
  return null;
}

export function buildAuditPayload(values: AuditFrotmValues, meta?: AuditPayloadMeta): AuditApiPayload {
  const derivedStatus = parseBoolean(values.status);

  return {
    date: toIsoOrNull(values.date),
    report: values.report,
    recommendations: values.recommendations,
    objectives: meta?.objectives ?? true,
    materials: meta?.materials ?? true,
    methodology: meta?.methodology ?? true,
    tools: meta?.tools ?? true,
    learning: meta?.learning ?? true,
    status: meta?.status ?? derivedStatus ?? true,
    lastReview: toIsoOrNull(values.lastReview),
    collaborators: values.collaborators,
    auditClass: meta?.auditClass ?? 'A',
    type: values.type,
    comments: values.comments,
  };
}

type Props = {
  open?: boolean;
  userName?: string;
  defaultValues?: Partial<AuditFrotmValues>;
  typeOptions: AuditSelectOption[];
  statusOptions: AuditSelectOption[];
  relatedSystemOptions?: AuditRelationOption[];
  fileEnabled?: boolean;
  onSubmit: (values: AuditFrotmValues) => Promise<void> | void;
  onCancel: () => void;
};

const EMPTY_VALUES: AuditFrotmValues = {
  relatedSystems: [],
  user: '',
  date: null,
  report: '',
  recommendations: '',
  comments: '',
  processCompliance: '',
  organizationCompliance: '',
  policiesCompliance: '',
  toolsUsage: '',
  deliverablesCompliance: '',
  file: null,
  status: '',
  lastReview: null,
  collaborators: '',
  type: '',
};

export function AuditFrotm({
  open,
  userName,
  defaultValues,
  typeOptions,
  statusOptions,
  relatedSystemOptions = [],
  fileEnabled = false,
  onSubmit,
  onCancel,
}: Props) {
  const { t } = useTranslate('architecture');

  const schema = useMemo(() => {
    const requiredSelect = (message: string) =>
      zod
        .string()
        .min(1, { message })
        .transform((value) => value.trim());

    const isAuditRating = (value: unknown): value is AuditRating => {
      if (typeof value !== 'string') return false;
      return (
        value === '' ||
        value === 'excellent' ||
        value === 'good' ||
        value === 'needsImprovement' ||
        value === 'urgentImprovement' ||
        value === 'notApplicable'
      );
    };

    const ratingRequired = () =>
      zod
        .custom<AuditRating>(
          (value) => isAuditRating(value) && value !== '',
          t('audit.form.errors.required')
        )
        .transform((value) => value);

    const base = zod.object({
      relatedSystems: zod.array(zod.object({ id: zod.string(), label: zod.string() })),
      user: zod.string(),
      date: zod.string().nullable(),
      report: zod.string(),
      recommendations: zod.string(),
      comments: zod.string(),
      processCompliance: ratingRequired(),
      organizationCompliance: ratingRequired(),
      policiesCompliance: ratingRequired(),
      toolsUsage: ratingRequired(),
      deliverablesCompliance: ratingRequired(),
      file: zod.union([zod.instanceof(File), zod.string()]).nullable(),
      status: requiredSelect(t('audit.form.errors.required')),
      lastReview: zod.string().nullable(),
      collaborators: requiredSelect(t('audit.form.errors.required')),
      type: requiredSelect(t('audit.form.errors.required')),
    });

    if (!fileEnabled) return base;

    return base.superRefine((data, ctx) => {
      if (!data.file) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          message: t('audit.form.errors.required'),
          path: ['file'],
        });
      }
    });
  }, [fileEnabled, t]);

  const resolvedDefaults = useMemo<AuditFrotmValues>(() => {
    const merged: AuditFrotmValues = { ...EMPTY_VALUES, ...defaultValues };
    return {
      ...merged,
      user: userName ?? merged.user,
      relatedSystems: Array.isArray(merged.relatedSystems) ? merged.relatedSystems : [],
    };
  }, [defaultValues, userName]);

  const methods = useForm<AuditFrotmValues>({
    mode: 'onSubmit',
    resolver: zodResolver(schema),
    defaultValues: resolvedDefaults,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (open === undefined || open) {
      reset(resolvedDefaults);
    }
  }, [open, reset, resolvedDefaults]);

  const handleClear = useCallback(() => {
    reset({ ...EMPTY_VALUES, user: userName ?? '' });
  }, [reset, userName]);

  const handleFormSubmit: SubmitHandler<AuditFrotmValues> = useCallback(
    async (values) => {
      await onSubmit(values);
    },
    [onSubmit]
  );

  const ratingOptions = useMemo(
    () =>
      [
        { value: '', label: t('audit.form.placeholders.select') },
        { value: 'excellent', label: t('audit.form.compliance.options.excellent') },
        { value: 'good', label: t('audit.form.compliance.options.good') },
        { value: 'needsImprovement', label: t('audit.form.compliance.options.needsImprovement') },
        { value: 'urgentImprovement', label: t('audit.form.compliance.options.urgentImprovement') },
        { value: 'notApplicable', label: t('audit.form.compliance.options.notApplicable') },
      ] satisfies ReadonlyArray<{ value: AuditRating; label: string }>,
    [t]
  );

  const fileInputId = useId();

  return (
    <Form methods={methods} onSubmit={handleSubmit(handleFormSubmit)}>
      <Stack spacing={2.5} sx={{ p: 2.5 }}>
        <Field.Autocomplete
          multiple
          name="relatedSystems"
          options={relatedSystemOptions}
          getOptionLabel={(option) => (option && typeof option === 'object' ? option.label : '')}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          label={t('audit.form.fields.relatedSystems.label')}
          placeholder={t('audit.form.placeholders.select')}
        />

        <Field.Text name="user" label={t('audit.form.fields.user.label')} disabled />

        <Field.DatePicker
          name="date"
          label={t('audit.form.fields.date.label')}
          slotProps={{ textField: { fullWidth: true } }}
        />

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {t('audit.form.fields.report.label')}
          </Typography>
          <Field.Editor
            fullItem
            name="report"
            placeholder={t('audit.form.fields.report.placeholder')}
            sx={{ maxHeight: 360 }}
          />
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {t('audit.form.fields.recommendations.label')}
          </Typography>
          <Field.Editor
            fullItem
            name="recommendations"
            placeholder={t('audit.form.fields.recommendations.placeholder')}
            sx={{ maxHeight: 360 }}
          />
        </Box>

        <Field.Text
          name="comments"
          label={t('audit.form.fields.comments.label')}
          multiline
          minRows={3}
        />

        <Field.Select
          required
          name="processCompliance"
          label={t('audit.form.fields.processCompliance.label')}
        >
          {ratingOptions.map((opt) => (
            <MenuItem key={opt.value || 'select'} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Field.Select>

        <Field.Select
          required
          name="organizationCompliance"
          label={t('audit.form.fields.organizationCompliance.label')}
        >
          {ratingOptions.map((opt) => (
            <MenuItem key={opt.value || 'select'} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Field.Select>

        <Field.Select
          required
          name="policiesCompliance"
          label={t('audit.form.fields.policiesCompliance.label')}
        >
          {ratingOptions.map((opt) => (
            <MenuItem key={opt.value || 'select'} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Field.Select>

        <Field.Select required name="toolsUsage" label={t('audit.form.fields.toolsUsage.label')}>
          {ratingOptions.map((opt) => (
            <MenuItem key={opt.value || 'select'} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Field.Select>

        <Field.Select
          required
          name="deliverablesCompliance"
          label={t('audit.form.fields.deliverablesCompliance.label')}
        >
          {ratingOptions.map((opt) => (
            <MenuItem key={opt.value || 'select'} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Field.Select>

        <Box>
          <Controller
            name="file"
            control={methods.control}
            render={({ field, fieldState }) => {
              const currentName =
                typeof field.value === 'string' ? field.value : field.value ? field.value.name : '';

              return (
                <TextField
                    fullWidth
                    required
                    label={t('audit.form.fields.file.label')}
                    value={currentName}
                    disabled={!fileEnabled}
                    placeholder={t('audit.form.fields.file.placeholder')}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message ?? t('audit.form.fields.file.helper')}
                    slotProps={{
                      htmlInput: { id: fileInputId, readOnly: true },
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Button
                            component="label"
                            size="small"
                            variant="outlined"
                            disabled={!fileEnabled || isSubmitting}
                          >
                            {t('audit.form.actions.chooseFile')}
                            <input
                              hidden
                              type="file"
                              accept=".pdf,.doc,.docx,image/*"
                              onChange={(event) => {
                                const file = event.target.files?.[0] ?? null;
                                event.target.value = '';
                                field.onChange(file);
                              }}
                            />
                          </Button>
                        </InputAdornment>
                      ),
                    }}
                  />
              );
            }}
          />
        </Box>

        <Field.Select required name="status" label={t('audit.form.fields.status.label')}>
          <MenuItem value="">{t('audit.form.placeholders.select')}</MenuItem>
          {statusOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Field.Select>

        <Field.DatePicker
          name="lastReview"
          label={t('audit.form.fields.lastReview.label')}
          slotProps={{ textField: { fullWidth: true } }}
        />

        <Field.Text
          required
          name="collaborators"
          label={t('audit.form.fields.collaborators.label')}
          multiline
          minRows={3}
        />

        <Field.Select required name="type" label={t('audit.form.fields.type.label')}>
          <MenuItem value="">{t('audit.form.placeholders.select')}</MenuItem>
          {typeOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Field.Select>
      </Stack>

      <Box
        sx={{
          p: 2.5,
          gap: 2,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          borderTop: (theme) => `solid 1px ${theme.vars.palette.divider}`,
        }}
      >
        <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
          {t('audit.form.actions.save')}
        </LoadingButton>
        <Button variant="contained" color="inherit" onClick={handleClear} disabled={isSubmitting}>
          {t('audit.form.actions.clear')}
        </Button>
        <Button variant="contained" color="inherit" onClick={onCancel} disabled={isSubmitting}>
          {t('audit.form.actions.cancel')}
        </Button>
      </Box>
    </Form>
  );
}
