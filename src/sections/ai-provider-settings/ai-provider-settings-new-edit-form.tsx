'use client';

import type { IAiProviderSetting } from 'src/types/ai-provider-settings';

import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { SaveOrUpdateAIProviderSettingService } from 'src/services/ai/AiProviderSettings.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

type ParameterItem = {
  label: string;
  value: string;
};

export type AiProviderSettingsFormSchemaType = {
  name: string;
  logo: string;
  isActive: boolean;
  isAvailable: boolean;
  requiresApiKey: boolean;
  supportsStreaming: boolean;
  parameters: ParameterItem[];
};

// ----------------------------------------------------------------------

type Props = {
  currentSetting?: IAiProviderSetting | null;
};

export function AiProviderSettingsNewEditForm({ currentSetting }: Props) {
  const router = useRouter();
  const { t } = useTranslate('ai');

  // Estado para visibilidad de campos password
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({});

  // Esquema de validación
  const AiProviderSettingsFormSchema = z.object({
    name: z.string().min(1, { message: t('settings.form.fields.name.required') }),
    logo: z.string(),
    isActive: z.boolean(),
    isAvailable: z.boolean(),
    requiresApiKey: z.boolean(),
    supportsStreaming: z.boolean(),
    parameters: z.array(z.object({
      label: z.string().min(1, { message: t('settings.form.fields.parameterLabel.required') }),
      value: z.string().min(1, { message: t('settings.form.fields.parameterValue.required') }),
    })),
  });

  // Valores por defecto
  const defaultValues: AiProviderSettingsFormSchemaType = useMemo(() => ({
    name: currentSetting?.name || '',
    logo: currentSetting?.logo || '',
    isActive: currentSetting?.isActive ?? true,
    isAvailable: currentSetting?.isAvailable ?? true,
    requiresApiKey: currentSetting?.requiresApiKey ?? false,
    supportsStreaming: currentSetting?.supportsStreaming ?? false,
    parameters: currentSetting?.parameters?.map(p => ({
      label: p.label,
      value: p.value,
    })) || [],
  }), [currentSetting]);

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(AiProviderSettingsFormSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    control,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  // Field array para parámetros
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'parameters',
  });

  // Agregar parámetro adicional
  const handleAddParameter = useCallback(() => {
    append({
      label: '',
      value: '',
    });
  }, [append]);

  // Toggle visibilidad de password
  const handleTogglePassword = useCallback((index: number) => {
    setShowPasswords(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  }, []);

  // Determinar si un campo debe ser password (API_KEY, TOKEN, SECRET, etc.)
  const isPasswordField = useCallback((label: string) => {
    const passwordKeywords = ['API_KEY', 'TOKEN', 'SECRET', 'PASSWORD', 'KEY'];
    return passwordKeywords.some(keyword => label.toUpperCase().includes(keyword));
  }, []);

  // Enviar formulario
  const onSubmit = handleSubmit(async (data) => {
    try {
      const dataToSend = {
        name: data.name,
        logo: data.logo || null,
        isActive: data.isActive,
        isAvailable: data.isAvailable,
        requiresApiKey: data.requiresApiKey,
        supportsStreaming: data.supportsStreaming,
        parameters: data.parameters.filter(p => p.label && p.value),
      };

      const response = await SaveOrUpdateAIProviderSettingService(
        dataToSend,
        currentSetting?.id
      );

      if (response.data.statusCode === 200 || response.data.statusCode === 201) {
        reset();
        toast.success(
          currentSetting
            ? t('settings.messages.success.updated')
            : t('settings.messages.success.created')
        );
        router.push(paths.dashboard.ai.providerSettings.root);
      }
    } catch (error) {
      console.error('Error saving provider setting:', error);
      toast.error(t('settings.messages.error.saving'));
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        {/* Información básica */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              {t('settings.form.sections.basic')}
            </Typography>

            <Stack spacing={3}>
              {/* Nombre del proveedor */}
              <Field.Text
                name="name"
                label={t('settings.form.fields.name.label')}
                placeholder={t('settings.form.fields.name.placeholder')}
              />

              {/* Logo URL */}
              <Field.Text
                name="logo"
                label={t('settings.form.fields.logo.label')}
                placeholder={t('settings.form.fields.logo.placeholder')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon={"mdi:image" as any} />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Require API Key */}
              <FormControlLabel
                control={
                  <Switch
                    checked={watch('requiresApiKey')}
                    onChange={(e) => setValue('requiresApiKey', e.target.checked)}
                  />
                }
                label={t('settings.form.fields.requiresApiKey.label')}
              />

              {/* Supports Streaming */}
              <FormControlLabel
                control={
                  <Switch
                    checked={watch('supportsStreaming')}
                    onChange={(e) => setValue('supportsStreaming', e.target.checked)}
                  />
                }
                label={t('settings.form.fields.supportsStreaming.label')}
              />
            </Stack>
          </Card>
        </Grid>

        {/* Panel lateral - Estado y acciones */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              {t('settings.form.sections.status')}
            </Typography>

            {/* Estado activo/inactivo */}
            <FormControlLabel
              control={
                <Switch
                  checked={watch('isActive')}
                  onChange={(e) => setValue('isActive', e.target.checked)}
                  color="success"
                />
              }
              label={watch('isActive')
                ? t('settings.status.active')
                : t('settings.status.inactive')
              }
              sx={{ mb: 2 }}
            />
          </Card>

          {/* Sección de acciones */}
          <Card sx={{ p: 3 }}>
            <Stack spacing={2}>
              {/* Botón Modelos - Solo visible cuando estamos editando */}
              {currentSetting && (
                <Button
                  component={RouterLink}
                  href={paths.dashboard.ai.modelsSettings.root(currentSetting.id)}
                  variant="outlined"
                  color="info"
                  size="large"
                  startIcon={<Iconify icon="tabler:robot" />}
                  fullWidth
                >
                  {t('settings.actions.models')}
                </Button>
              )}

              <LoadingButton
                type="submit"
                variant="contained"
                size="large"
                loading={isSubmitting}
                fullWidth
              >
                {currentSetting
                  ? t('settings.actions.update')
                  : t('settings.actions.create')
                }
              </LoadingButton>

              <Button
                variant="outlined"
                size="large"
                onClick={() => router.push(paths.dashboard.ai.providerSettings.root)}
                fullWidth
              >
                {t('settings.actions.cancel')}
              </Button>
            </Stack>
          </Card>
        </Grid>

        {/* Sección de parámetros */}
        <Grid size={{ xs: 12 }}>
          <Card sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
              <Typography variant="h6">
                {t('settings.form.sections.parameters')}
              </Typography>

              <Button
                variant="outlined"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={handleAddParameter}
              >
                {t('settings.actions.addParameter')}
              </Button>
            </Stack>

            {fields.length === 0 ? (
              <Alert severity="info">
                {t('settings.form.noParameters')}
              </Alert>
            ) : (
              <Stack spacing={2}>
                {fields.map((field, index) => {
                  const label = watch(`parameters.${index}.label`);
                  const shouldHidePassword = isPasswordField(label);

                  return (
                    <Box key={field.id}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
                        {/* Campo Label del parámetro */}
                        <Field.Text
                          name={`parameters.${index}.label`}
                          label={t('settings.form.fields.parameterLabel.label')}
                          placeholder={t('settings.form.fields.parameterLabel.placeholder')}
                          sx={{ minWidth: 200 }}
                        />

                        {/* Campo Value del parámetro */}
                        <Field.Text
                          name={`parameters.${index}.value`}
                          label={t('settings.form.fields.parameterValue.label')}
                          type={shouldHidePassword && !showPasswords[index] ? 'password' : 'text'}
                          placeholder={t('settings.form.fields.parameterValue.placeholder')}
                          fullWidth
                          InputProps={{
                            startAdornment: shouldHidePassword ? (
                              <InputAdornment position="start">
                                <Iconify icon={"mdi:key" as any} />
                              </InputAdornment>
                            ) : undefined,
                            endAdornment: shouldHidePassword ? (
                              <InputAdornment position="end">
                                <IconButton
                                  onClick={() => handleTogglePassword(index)}
                                  edge="end"
                                >
                                  <Iconify icon={showPasswords[index] ? "solar:eye-bold" : "solar:eye-closed-bold"} />
                                </IconButton>
                              </InputAdornment>
                            ) : undefined,
                          }}
                        />

                        {/* Botón eliminar */}
                        <IconButton
                          color="error"
                          onClick={() => remove(index)}
                          sx={{ mt: { xs: 0, sm: 1 } }}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" />
                        </IconButton>
                      </Stack>

                      {index < fields.length - 1 && <Divider sx={{ my: 2 }} />}
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Card>
        </Grid>
      </Grid>
    </Form>
  );
}
