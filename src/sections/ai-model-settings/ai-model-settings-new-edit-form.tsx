'use client';

import type { IAiModelSetting } from 'src/types/ai-model-settings';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useMemo, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { SaveOrUpdateAIModelSettingService } from 'src/services/ai/AiModelsSettings.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { AI_MODEL_CAPABILITIES } from 'src/types/ai-model-settings';

// ----------------------------------------------------------------------

export type AiModelSettingsFormSchemaType = {
  modelKey: string;
  name: string;
  description: string;
  maxTokens: number;
  contextWindow: number;
  capabilities: string[];
  isDefault: boolean;
  endpoint: string;
};

// ----------------------------------------------------------------------

type Props = {
  providerId: string;
  currentModel?: IAiModelSetting | null;
};

export function AiModelSettingsNewEditForm({ providerId, currentModel }: Props) {
  const router = useRouter();
  const { t } = useTranslate('ai');

  // Esquema de validación
  const AiModelSettingsFormSchema = z.object({
    modelKey: z.string().min(1, { message: t('models.form.fields.modelKey.required') }),
    name: z.string().min(1, { message: t('models.form.fields.name.required') }),
    description: z.string(),
    maxTokens: z.preprocess(
      (val) => (val === '' || val === null || val === undefined ? 0 : Number(val)),
      z.number().min(0)
    ),
    contextWindow: z.preprocess(
      (val) => (val === '' || val === null || val === undefined ? 0 : Number(val)),
      z.number().min(0)
    ),
    capabilities: z.array(z.string()),
    isDefault: z.boolean(),
    endpoint: z.string().min(1, { message: t('models.form.fields.endpoint.required') }),
  });

  // Parse capabilities from JSON string or array if editing
  const parseCapabilities = useCallback((cap: string | string[]): string[] => {
    try {
      // Si ya es un array, retornarlo directamente
      if (Array.isArray(cap)) {
        return cap;
      }
      // Si es un string, parsearlo
      if (typeof cap === 'string') {
        return JSON.parse(cap);
      }
      return [];
    } catch {
      return [];
    }
  }, []);

  // Valores por defecto
  const defaultValues: AiModelSettingsFormSchemaType = useMemo(() => ({
    modelKey: currentModel?.modelKey || '',
    name: currentModel?.name || '',
    description: currentModel?.description || '',
    maxTokens: currentModel?.maxTokens || 0,
    contextWindow: currentModel?.contextWindow || 0,
    capabilities: currentModel ? parseCapabilities(currentModel.capabilities) : [],
    isDefault: currentModel?.isDefault ?? false,
    endpoint: currentModel?.endpoint || '',
  }), [currentModel, parseCapabilities]);

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(AiModelSettingsFormSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const watchCapabilities = watch('capabilities');

  // Enviar formulario
  const onSubmit = handleSubmit(async (data) => {
    try {
      const dataToSend = {
        aiProviderId: currentModel ? undefined : Number(providerId),
        modelKey: data.modelKey,
        name: data.name,
        description: data.description,
        maxTokens: data.maxTokens,
        contextWindow: data.contextWindow,
        capabilities: data.capabilities,
        isDefault: data.isDefault,
        endpoint: data.endpoint,
      };

      const response = await SaveOrUpdateAIModelSettingService(
        dataToSend,
        currentModel?.id
      );

      if (response.data.statusCode === 200 || response.data.statusCode === 201) {
        reset();
        toast.success(
          currentModel
            ? t('models.messages.success.updated')
            : t('models.messages.success.created')
        );
        router.push(paths.dashboard.ai.modelsSettings.root(providerId));
      }
    } catch (error) {
      console.error('Error saving model:', error);
      toast.error(t('models.messages.error.saving'));
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        {/* Información básica */}
        <Grid size={{ xs: 12 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              {t('models.form.sections.basic')}
            </Typography>

            <Grid container spacing={3}>
              {/* Model Key */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Field.Text
                  name="modelKey"
                  label={t('models.form.fields.modelKey.label')}
                  placeholder={t('models.form.fields.modelKey.placeholder')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify icon={"mdi:key-variant" as any} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Name */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Field.Text
                  name="name"
                  label={t('models.form.fields.name.label')}
                  placeholder={t('models.form.fields.name.placeholder')}
                />
              </Grid>

              {/* Description */}
              <Grid size={{ xs: 12 }}>
                <Field.Text
                  name="description"
                  label={t('models.form.fields.description.label')}
                  placeholder={t('models.form.fields.description.placeholder')}
                  multiline
                  rows={3}
                />
              </Grid>

              {/* Endpoint */}
              <Grid size={{ xs: 12 }}>
                <Field.Text
                  name="endpoint"
                  label={t('models.form.fields.endpoint.label')}
                  placeholder={t('models.form.fields.endpoint.placeholder')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify icon={"mdi:link-variant" as any} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Max Tokens */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Field.Text
                  name="maxTokens"
                  type="number"
                  label={t('models.form.fields.maxTokens.label')}
                  placeholder={t('models.form.fields.maxTokens.placeholder')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify icon={"mdi:counter" as any} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Context Window */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Field.Text
                  name="contextWindow"
                  type="number"
                  label={t('models.form.fields.contextWindow.label')}
                  placeholder={t('models.form.fields.contextWindow.placeholder')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify icon={"mdi:window-maximize" as any} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Capabilities */}
              <Grid size={{ xs: 12 }}>
                <Autocomplete
                  multiple
                  options={AI_MODEL_CAPABILITIES as unknown as string[]}
                  value={watchCapabilities}
                  onChange={(_, newValue) => setValue('capabilities', newValue)}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        {...getTagProps({ index })}
                        key={option}
                        label={option}
                        size="small"
                        variant="soft"
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('models.form.fields.capabilities.label')}
                      placeholder={t('models.form.fields.capabilities.placeholder')}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Card>
        </Grid>

        {/* Panel inferior - Configuración y acciones */}
        <Grid size={{ xs: 12 }}>
          <Card sx={{ p: 3 }}>
            <Stack spacing={3}>
              <Typography variant="h6">
                {t('models.form.sections.settings')}
              </Typography>

              {/* Is Default */}
              <FormControlLabel
                control={
                  <Switch
                    checked={watch('isDefault')}
                    onChange={(e) => setValue('isDefault', e.target.checked)}
                    color="success"
                  />
                }
                label={t('models.form.fields.isDefault.label')}
              />

              {/* Acciones */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => router.push(paths.dashboard.ai.modelsSettings.root(providerId))}
                  sx={{ minWidth: 200 }}
                >
                  {t('models.actions.cancel')}
                </Button>

                <LoadingButton
                  type="submit"
                  variant="contained"
                  size="large"
                  loading={isSubmitting}
                  sx={{ minWidth: 200 }}
                >
                  {currentModel 
                    ? t('models.actions.update')
                    : t('models.actions.create')
                  }
                </LoadingButton>
              </Stack>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Form>
  );
}
