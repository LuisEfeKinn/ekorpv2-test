'use client';

import type { IconifyName } from 'src/components/iconify';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import { alpha, useTheme } from '@mui/material/styles';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  departments: any[];
  positions: any[];
  employees: any[];
  selectedDepartments: any[];
  selectedPositions: any[];
  selectedEmployees: any[];
  onDepartmentsChange: (value: any[]) => void;
  onPositionsChange: (value: any[]) => void;
  onEmployeesChange: (value: any[]) => void;
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

export function StepScope({
  departments,
  positions,
  employees,
  selectedDepartments,
  selectedPositions,
  selectedEmployees,
  onDepartmentsChange,
  onPositionsChange,
  onEmployeesChange,
}: Props) {
  const { t } = useTranslate('performance');

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12 }}>
        <StepHeader
          icon="solar:target-bold-duotone"
          title={t('configure-evaluations.drawer.steps.scopeTitle')}
          description={t('configure-evaluations.drawer.steps.scopeDesc')}
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Autocomplete
          multiple
          fullWidth
          options={departments}
          value={selectedDepartments}
          onChange={(_, newValue) => onDepartmentsChange(newValue)}
          getOptionLabel={(option) => option.name || ''}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('configure-evaluations.form.fields.departments.label')}
              placeholder={
                selectedDepartments.length === 0
                  ? t('configure-evaluations.form.fields.departments.placeholder')
                  : undefined
              }
            />
          )}
          renderOption={(props, option) => (
            <Box component="li" {...props} key={option.id}>
              <Typography variant="body2">{option.name}</Typography>
            </Box>
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip {...getTagProps({ index })} key={option.id} label={option.name} size="small" />
            ))
          }
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Autocomplete
          multiple
          fullWidth
          options={positions}
          value={selectedPositions}
          onChange={(_, newValue) => onPositionsChange(newValue)}
          getOptionLabel={(option) => option.name || ''}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('configure-evaluations.form.fields.positions.label')}
              placeholder={
                selectedPositions.length === 0
                  ? t('configure-evaluations.form.fields.positions.placeholder')
                  : undefined
              }
            />
          )}
          renderOption={(props, option) => (
            <Box component="li" {...props} key={option.id}>
              <Typography variant="body2">{option.name}</Typography>
            </Box>
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip {...getTagProps({ index })} key={option.id} label={option.name} size="small" />
            ))
          }
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Autocomplete
          multiple
          fullWidth
          options={employees}
          value={selectedEmployees}
          onChange={(_, newValue) => onEmployeesChange(newValue)}
          getOptionLabel={(option) => {
            const firstName = option.firstName || '';
            const firstLastName = option.firstLastName || '';
            const fullName = `${firstName} ${firstLastName}`.trim();
            const email = option.email || '';
            return fullName ? `${fullName} - ${email}` : email || 'Sin información';
          }}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('configure-evaluations.form.fields.employees.label')}
              placeholder={
                selectedEmployees.length === 0
                  ? t('configure-evaluations.form.fields.employees.placeholder')
                  : undefined
              }
            />
          )}
          renderOption={(props, option) => {
            const firstName = option.firstName || '';
            const firstLastName = option.firstLastName || '';
            const fullName = `${firstName} ${firstLastName}`.trim();
            const email = option.email || 'Sin email';
            return (
              <Box component="li" {...props} key={option.id}>
                <Stack>
                  <Typography variant="body2">{fullName || 'Sin nombre'}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {email}
                  </Typography>
                </Stack>
              </Box>
            );
          }}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const firstName = option.firstName || '';
              const firstLastName = option.firstLastName || '';
              const fullName = `${firstName} ${firstLastName}`.trim();
              return (
                <Chip
                  {...getTagProps({ index })}
                  key={option.id}
                  label={fullName || option.email || 'Sin nombre'}
                  size="small"
                />
              );
            })
          }
        />
      </Grid>
    </Grid>
  );
}
