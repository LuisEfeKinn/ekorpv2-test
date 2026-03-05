'use client';

import type { IconifyName } from 'src/components/iconify';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import InputAdornment from '@mui/material/InputAdornment';

import { useTranslate } from 'src/locales';

import { Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';

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

export function StepConfig() {
  const { t } = useTranslate('performance');
  const theme = useTheme();

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12 }}>
        <StepHeader
          icon="solar:settings-bold"
          title={t('configure-evaluations.drawer.steps.configTitle')}
          description={t('configure-evaluations.drawer.steps.configDesc')}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <Field.Text
          name="startDate"
          label={t('configure-evaluations.form.fields.startDate.label')}
          type="date"
          InputLabelProps={{ shrink: true }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="solar:calendar-date-bold" width={18} sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <Field.Text
          name="endDate"
          label={t('configure-evaluations.form.fields.endDate.label')}
          type="date"
          InputLabelProps={{ shrink: true }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="solar:calendar-date-bold" width={18} sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <Box
          sx={{
            p: 2.5,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.grey[500], 0.16)}`,
            bgcolor: alpha(theme.palette.grey[500], 0.04),
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.04),
              borderColor: alpha(theme.palette.primary.main, 0.24),
            },
            transition: 'all 0.2s',
          }}
        >
          <Field.Switch
            name="autoAssign"
            label={t('configure-evaluations.form.fields.autoAssign.label')}
            helperText={t('configure-evaluations.form.fields.autoAssign.helperText')}
          />
        </Box>
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <Box
          sx={{
            p: 2.5,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.grey[500], 0.16)}`,
            bgcolor: alpha(theme.palette.grey[500], 0.04),
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.04),
              borderColor: alpha(theme.palette.primary.main, 0.24),
            },
            transition: 'all 0.2s',
          }}
        >
          <Field.Switch
            name="editableEvaluators"
            label={t('configure-evaluations.form.fields.editableEvaluators.label')}
            helperText={t('configure-evaluations.form.fields.editableEvaluators.helperText')}
          />
        </Box>
      </Grid>
    </Grid>
  );
}
