'use client';

import type { IconifyName } from 'src/components/iconify';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import { alpha, useTheme } from '@mui/material/styles';
import InputAdornment from '@mui/material/InputAdornment';

import { useTranslate } from 'src/locales';

import { Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type OptionType = { value: string; label: string };

type Props = {
  evaluationTypes: OptionType[];
  templates: any[];
  vigencies: any[];
  selectedTemplate: any;
  selectedVigency: any;
  onTemplateChange: (value: any) => void;
  onVigencyChange: (value: any) => void;
  loadTemplates: (search?: string) => Promise<void>;
  loadVigencies: (search?: string) => Promise<void>;
  onPreviewTemplate: (templateId: string | number) => void;
};

// ----------------------------------------------------------------------

function StepHeader({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: IconifyName;
}) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        mb: 3,
        p: 2.5,
        borderRadius: 2,
        bgcolor: alpha(theme.palette.primary.main, 0.04),
        border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1.5,
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            flexShrink: 0,
          }}
        >
          <Iconify icon={icon} width={20} sx={{ color: 'primary.main' }} />
        </Box>
        <Typography variant="subtitle1" fontWeight={700} color="primary.main">
          {title}
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ pl: '52px' }}>
        {description}
      </Typography>
    </Box>
  );
}

// ----------------------------------------------------------------------

export function StepBasicInfo({
  evaluationTypes,
  templates,
  vigencies,
  selectedTemplate,
  selectedVigency,
  onTemplateChange,
  onVigencyChange,
  loadTemplates,
  loadVigencies,
  onPreviewTemplate,
}: Props) {
  const { t } = useTranslate('performance');

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12 }}>
        <StepHeader
          icon="solar:book-bold"
          title={t('configure-evaluations.drawer.steps.basicInfoTitle')}
          description={t('configure-evaluations.drawer.steps.basicInfoDesc')}
        />
      </Grid>

      {/* Name — full width */}
      <Grid size={{ xs: 12 }}>
        <Field.Text
          name="name"
          label={t('configure-evaluations.form.fields.name.label')}
          placeholder={t('configure-evaluations.form.fields.name.helperText')}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="solar:pen-bold" width={18} sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />
      </Grid>

      {/* Type (sm:6) + Vigency (sm:6) */}
      <Grid size={{ xs: 12, sm: 6 }}>
        <Field.Select
          name="type"
          label={t('configure-evaluations.form.fields.type.label')}
          helperText={t('configure-evaluations.form.fields.type.helperText')}
        >
          {evaluationTypes.map((type) => (
            <MenuItem key={type.value} value={type.value}>
              {t(`configure-evaluations.types.${type.value}`)}
            </MenuItem>
          ))}
        </Field.Select>
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <Autocomplete
          value={selectedVigency}
          onChange={(_, newValue) => onVigencyChange(newValue)}
          onOpen={() => {
            if (!selectedVigency || vigencies.length === 0) {
              loadVigencies();
            }
          }}
          options={vigencies}
          getOptionLabel={(option) => option.name || ''}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('configure-evaluations.form.fields.vigency.label')}
              placeholder={t('configure-evaluations.form.fields.vigency.helperText')}
              onChange={(e) => loadVigencies(e.target.value)}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <InputAdornment position="start">
                      <Iconify
                        icon="solar:calendar-mark-bold"
                        width={18}
                        sx={{ color: 'text.disabled' }}
                      />
                    </InputAdornment>
                    {params.InputProps.startAdornment}
                  </>
                ),
              }}
            />
          )}
          renderOption={(props, option) => (
            <Box component="li" {...props} key={option.id}>
              <Typography variant="body2">{option.name}</Typography>
            </Box>
          )}
          noOptionsText="No se encontraron vigencias"
        />
      </Grid>

      {/* Template — full width + Preview button */}
      <Grid size={{ xs: 12 }}>
        <Stack direction="row" spacing={1} alignItems="flex-start">
          <Autocomplete
            sx={{ flex: 1 }}
            value={selectedTemplate}
            onChange={(_, newValue) => onTemplateChange(newValue)}
            onOpen={() => {
              if (!selectedTemplate || templates.length === 0) {
                loadTemplates();
              }
            }}
            options={templates}
            getOptionLabel={(option) => option.name || ''}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('configure-evaluations.form.fields.template.label')}
                placeholder={t('configure-evaluations.form.fields.template.helperText')}
                onChange={(e) => loadTemplates(e.target.value)}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <InputAdornment position="start">
                        <Iconify
                          icon="solar:documents-bold-duotone"
                          width={18}
                          sx={{ color: 'text.disabled' }}
                        />
                      </InputAdornment>
                      {params.InputProps.startAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props} key={option.id}>
                <Typography variant="body2">{option.name}</Typography>
              </Box>
            )}
            noOptionsText="No se encontraron plantillas"
          />
          {selectedTemplate && (
            <Button
              variant="outlined"
              color="inherit"
              size="medium"
              startIcon={<Iconify icon="solar:eye-bold" />}
              onClick={() => onPreviewTemplate(selectedTemplate.id)}
              sx={{ mt: 0.25, flexShrink: 0 }}
            >
              Preview
            </Button>
          )}
        </Stack>
      </Grid>

      {/* Description — full width */}
      <Grid size={{ xs: 12 }}>
        <Field.Text
          name="description"
          label={t('configure-evaluations.form.fields.description.label')}
          placeholder={t('configure-evaluations.form.fields.description.helperText')}
          multiline
          rows={3}
        />
      </Grid>
    </Grid>
  );
}
