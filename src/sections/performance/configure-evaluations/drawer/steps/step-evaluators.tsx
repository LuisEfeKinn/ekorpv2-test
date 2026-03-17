'use client';

import type { IconifyName } from 'src/components/iconify';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import { alpha, useTheme } from '@mui/material/styles';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type OptionType = { value: string; label: string };

export type EvaluatorConfig = {
  relationship: string;
  weight: number;
  maxEvaluators: number;
  enabled: boolean;
};

type Props = {
  evaluatorConfigs: EvaluatorConfig[];
  evaluationRelationships: OptionType[];
  onUpdate: (index: number, field: keyof EvaluatorConfig, value: string | number | boolean) => void;
  disabled?: boolean;
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

export function StepEvaluators({
  evaluatorConfigs,
  evaluationRelationships,
  onUpdate,
  disabled = false,
}: Props) {
  const { t } = useTranslate('performance');
  const theme = useTheme();

  return (
    <Stack spacing={3}>
      <StepHeader
        icon="solar:users-group-rounded-bold"
        title={t('configure-evaluations.drawer.steps.evaluatorsTitle')}
        description={t('configure-evaluations.drawer.steps.evaluatorsDesc')}
      />

      {/* Empty state */}
      {evaluatorConfigs.length === 0 && (
        <Box
          sx={{
            py: 5,
            textAlign: 'center',
            borderRadius: 2,
            border: `2px dashed ${alpha(theme.palette.grey[500], 0.2)}`,
            bgcolor: alpha(theme.palette.grey[500], 0.04),
          }}
        >
          <Iconify icon="solar:user-plus-bold" width={40} sx={{ color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            {t('configure-evaluations.drawer.steps.evaluatorsEmpty')}
          </Typography>
        </Box>
      )}

      {/* Evaluator cards (inline editable) */}
      {evaluatorConfigs.map((config, index) => (
        <Card
          key={index}
          sx={{
            p: 2.5,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
            bgcolor: alpha(theme.palette.primary.main, 0.02),
          }}
        >
          {/* Card header */}
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Box
              sx={{
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1,
                bgcolor: alpha(theme.palette.primary.main, 0.12),
              }}
            >
              <Typography variant="caption" fontWeight={700} color="primary.main">
                {index + 1}
              </Typography>
            </Box>
            {config.relationship && (
              <Chip
                label={t(`configure-evaluations.relationships.${config.relationship}`)}
                size="small"
                color="primary"
                variant="soft"
              />
            )}
          </Stack>

          <Divider sx={{ mb: 2, opacity: 0.5 }} />

          <Grid container spacing={2}>
            {/* Relación — solo lectura (fijada por el preset) */}
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth size="small" disabled>
                <InputLabel>
                  {t('configure-evaluations.form.fields.evaluatorConfigs.relationship')}
                </InputLabel>
                <Select
                  value={config.relationship}
                  label={t('configure-evaluations.form.fields.evaluatorConfigs.relationship')}
                >
                  {evaluationRelationships.map((rel) => (
                    <MenuItem key={rel.value} value={rel.value}>
                      {t(`configure-evaluations.relationships.${rel.value}`)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Peso */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                disabled={disabled}
                label={t('configure-evaluations.form.fields.evaluatorConfigs.weight')}
                value={config.weight || ''}
                onChange={(e) => onUpdate(index, 'weight', Number(e.target.value))}
                inputProps={{ min: 1, max: 100, step: 1 }}
                InputProps={{
                  endAdornment: <Typography variant="caption" sx={{ color: 'text.disabled', pr: 1 }}>%</Typography>,
                }}
              />
            </Grid>

            {/* Máx. Evaluadores */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                disabled={disabled}
                label={t('configure-evaluations.form.fields.evaluatorConfigs.maxEvaluators')}
                value={config.maxEvaluators || ''}
                onChange={(e) => onUpdate(index, 'maxEvaluators', Number(e.target.value))}
                inputProps={{ min: 1, step: 1 }}
                helperText={t('configure-evaluations.form.fields.evaluatorConfigs.maxEvaluatorsHint')}
              />
            </Grid>

            {/* Habilitado */}
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.enabled}
                    disabled={disabled}
                    onChange={(e) => onUpdate(index, 'enabled', e.target.checked)}
                    color="primary"
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2">
                    {t('configure-evaluations.form.fields.evaluatorConfigs.enabled')}
                  </Typography>
                }
              />
            </Grid>
          </Grid>
        </Card>
      ))}
    </Stack>
  );
}
