'use client';

import type {
  IIntegrationTemplate,
  IIntegrationFormData,
  IIntegrationInstanceResponse,
} from 'src/types/settings';

import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import Autocomplete from '@mui/material/Autocomplete';
import { alpha, useTheme } from '@mui/material/styles';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useTranslate } from 'src/locales';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

type Props = {
  integrations: IIntegrationTemplate[];
  currentInstance?: IIntegrationInstanceResponse;
  onSubmit: (data: IIntegrationFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  isEdit?: boolean;
};

export function IntegrationsCreateEditForm({
  integrations,
  currentInstance,
  onSubmit,
  onCancel,
  loading = false,
  isEdit = false,
}: Props) {
  const { t } = useTranslate('settings');
  const theme = useTheme();

  const [selectedIntegration, setSelectedIntegration] = useState<IIntegrationTemplate | null>(
    null
  );

  // Schema de validación
  const IntegrationSchema = useMemo(
    () =>
      zod.object({
        integrationId: zod.string().min(1, 'Debe seleccionar una integración'),
        name: zod.string().min(1, 'El nombre es requerido'),
        isActive: zod.boolean(),
        parameters: zod.array(
          zod.object({
            parameterId: zod.number(),
            value: zod.string(),
          })
        ),
      }),
    []
  );

  // Valores por defecto
  const defaultValues = useMemo(
    () => ({
      integrationId: '',
      name: '',
      isActive: true,
      parameters: [],
    }),
    []
  );

  const methods = useForm<IIntegrationFormData>({
    resolver: zodResolver(IntegrationSchema),
    defaultValues,
  });

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  // Cargar datos de edición
  useEffect(() => {
    if (currentInstance && integrations.length > 0) {
      const integration = integrations.find((i) => i.id === currentInstance.instance.integrationId);

      if (integration) {
        setSelectedIntegration(integration);
        setValue('integrationId', integration.id);
        setValue('name', currentInstance.instance.name);
        setValue('isActive', currentInstance.instance.isActive);

        // Cargar parámetros con valores
        const parametersWithValues = integration.defaultValues.map((defaultValue) => {
          const existingParam = currentInstance.parameters.find(
            (p) => p.parameterId === defaultValue.integrationsParameters.id
          );
          return {
            parameterId: Number(defaultValue.integrationsParameters.id),
            value: existingParam?.value || '',
          };
        });

        setValue('parameters', parametersWithValues);
      }
    }
  }, [currentInstance, integrations, setValue]);

  // Manejar cambio de integración seleccionada
  const handleIntegrationChange = useCallback(
    (integration: IIntegrationTemplate | null) => {
      setSelectedIntegration(integration);

      if (integration) {
        setValue('integrationId', integration.id);

        // Configurar parámetros vacíos basados en defaultValues
        const emptyParameters = integration.defaultValues.map((defaultValue) => ({
          parameterId: Number(defaultValue.integrationsParameters.id),
          value: '',
        }));

        setValue('parameters', emptyParameters);
      } else {
        setValue('integrationId', '');
        setValue('parameters', []);
      }
    },
    [setValue]
  );

  const handleFormSubmit = useCallback(
    async (data: IIntegrationFormData) => {
      try {
        await onSubmit(data);
      } catch (error: any) {
        console.error('Form submission error:', error);
        toast.error(
          t(error?.message) ||
          t('integrations.messages.error.updating'));
      }
    },
    [onSubmit, t]
  );

  const renderIntegrationSelector = (
    <Card
      sx={{
        p: 4,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.primary.main, 0.02)})`,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h6" sx={{ color: 'primary.main' }}>
            🔌
          </Typography>
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {isEdit
              ? t('integrations.form.title.edit')
              : t('integrations.form.title.create')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('integrations.form.subtitle')}
          </Typography>
        </Box>
      </Box>

      <Stack spacing={3}>
        {/* Campo oculto para integrationId */}
        <Field.Text name="integrationId" sx={{ display: 'none' }} />

        <Autocomplete
          fullWidth
          options={integrations}
          value={selectedIntegration}
          onChange={(_, newValue) => handleIntegrationChange(newValue)}
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderOption={(props, option) => (
            <Box component="li" {...props} sx={{ gap: 2, alignItems: 'center' }}>
              <Avatar src={option.image} variant="rounded" sx={{ width: 32, height: 32 }} />
              <Box>
                <Typography variant="subtitle2">{option.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {option.integrationType.name}
                </Typography>
              </Box>
            </Box>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('integrations.form.fields.integration.label')}
              placeholder={t('integrations.form.fields.integration.placeholder')}
            />
          )}
          disabled={isEdit}
        />

        {selectedIntegration && (
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              gap: 2,
              bgcolor: alpha(theme.palette.grey[500], 0.04),
              border: `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
            }}
          >
            <Avatar
              src={selectedIntegration.image}
              variant="rounded"
              sx={{ width: 56, height: 56 }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                {selectedIntegration.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {selectedIntegration.description || 'Sin descripción'}
              </Typography>
              <Chip
                label={selectedIntegration.integrationType.name}
                size="small"
                color="primary"
                variant="soft"
              />
            </Box>
          </Paper>
        )}
      </Stack>

      <Divider sx={{ my: 3 }} />

      <Stack spacing={2}>
        <Field.Text
          name="name"
          label={t('integrations.form.fields.instanceName.label')}
          placeholder={t('integrations.form.fields.instanceName.placeholder')}
          required
        />

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {t('integrations.form.fields.status.label')}
          </Typography>
          <FormControlLabel
            control={<Field.Switch name="isActive" label="" />}
            label={
              <Typography variant="caption" color="text.secondary">
                {watch('isActive')
                  ? t('integrations.form.fields.status.helperPositiveText')
                  : t('integrations.form.fields.status.helperNegativeText')}
              </Typography>
            }
          />
        </Box>
      </Stack>
    </Card>
  );

  const renderParameters = () => {
    if (!selectedIntegration || selectedIntegration.defaultValues.length === 0) {
      return (
        <Card
          sx={{
            p: 4,
            textAlign: 'center',
            border: `1px dashed ${alpha(theme.palette.grey[500], 0.32)}`,
            bgcolor: alpha(theme.palette.grey[500], 0.04),
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: alpha(theme.palette.grey[500], 0.08),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <Typography variant="h4" sx={{ color: 'text.disabled' }}>
              ⚙️
            </Typography>
          </Box>
          <Typography variant="h6" sx={{ mb: 1, color: 'text.secondary' }}>
            {selectedIntegration
              ? t('integrations.form.fields.parameters.noParameters')
              : t('integrations.form.fields.parameters.selectIntegration')}
          </Typography>
        </Card>
      );
    }

    return (
      <Card sx={{ p: 4, border: `1px solid ${alpha(theme.palette.grey[500], 0.12)}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.secondary.main, 0.12),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h6" sx={{ color: 'secondary.main' }}>
              ⚙️
            </Typography>
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {t('integrations.form.fields.parameters.title')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('integrations.form.fields.parameters.subtitle')}
            </Typography>
          </Box>
          <Box sx={{ ml: 'auto' }}>
            <Chip
              label={`${selectedIntegration.defaultValues.length} ${t('integrations.form.fields.parameters.title')}`}
              color="secondary"
              variant="soft"
              size="small"
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {selectedIntegration.defaultValues.map((defaultValue, index) => (
            <Paper
              key={defaultValue.integrationsParameters.id}
              sx={{
                p: 3,
                border: `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
                bgcolor: 'background.paper',
                '&:hover': {
                  borderColor: alpha(theme.palette.primary.main, 0.25),
                  bgcolor: alpha(theme.palette.primary.main, 0.02),
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: 'primary.main', fontWeight: 'bold' }}
                  >
                    {index + 1}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                    {defaultValue.integrationsParameters.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('integrations.form.fields.parameters.code')}:{' '}
                    {defaultValue.integrationsParameters.code}
                  </Typography>
                </Box>
              </Box>
              <Field.Text
                name={`parameters.${index}.value`}
                label={defaultValue.integrationsParameters.name}
                placeholder={`Ingresa ${defaultValue.integrationsParameters.name.toLowerCase()}`}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.default',
                  },
                }}
              />
            </Paper>
          ))}
        </Box>
      </Card>
    );
  };

  const renderActions = () => (
    <Paper
      sx={{
        p: 3,
        bgcolor: alpha(theme.palette.grey[500], 0.04),
        border: `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
        }}
      >
        <Box />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button
            variant="outlined"
            size="large"
            onClick={onCancel}
            disabled={isSubmitting || loading}
            sx={{ minWidth: 120 }}
          >
            {t('integrations.form.buttons.cancel')}
          </Button>

          <LoadingButton
            type="submit"
            variant="contained"
            size="large"
            loading={isSubmitting || loading}
            sx={{
              minWidth: 160,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
              },
            }}
          >
            {t('integrations.form.buttons.save')}
          </LoadingButton>
        </Stack>
      </Stack>
    </Paper>
  );

  return (
    <Box
      sx={{ width: '100%', minHeight: '100vh', bgcolor: alpha(theme.palette.grey[500], 0.02) }}
    >
      <Form methods={methods} onSubmit={handleSubmit(handleFormSubmit)}>
        <Stack spacing={0} sx={{ width: '100%', position: 'relative' }}>
          {/* Main Content Area */}
          <Box sx={{ flex: 1, p: { xs: 2, md: 4 } }}>
            <Stack spacing={4}>
              {renderIntegrationSelector}

              {renderParameters()}
            </Stack>
          </Box>

          {/* Fixed Actions at Bottom */}
          <Box
            sx={{
              position: 'sticky',
              bottom: 0,
              zIndex: 10,
              bgcolor: 'background.paper',
              borderTop: `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
              boxShadow: `0 -4px 20px ${alpha(theme.palette.grey[500], 0.08)}`,
            }}
          >
            {renderActions()}
          </Box>
        </Stack>
      </Form>
    </Box>
  );
}
