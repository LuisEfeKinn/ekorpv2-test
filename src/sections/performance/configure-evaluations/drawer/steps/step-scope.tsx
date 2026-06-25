'use client';

import type { IconifyName } from 'src/components/iconify';

import { useState, useEffect } from 'react';
import { useDebounce } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import { alpha, useTheme } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

function omitKey({ key, ...rest }: any): any {
  return rest;
}

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
  onSearchDepartments: (search: string) => void;
  onSearchPositions: (search: string) => void;
  onSearchEmployees: (search: string) => void;
  loadingDepartments?: boolean;
  loadingPositions?: boolean;
  loadingEmployees?: boolean;
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
  onSearchDepartments,
  onSearchPositions,
  onSearchEmployees,
  loadingDepartments = false,
  loadingPositions = false,
  loadingEmployees = false,
  disabled = false,
}: Props) {
  const { t } = useTranslate('performance');

  const [deptInput, setDeptInput] = useState('');
  const [posInput, setPosInput] = useState('');
  const [empInput, setEmpInput] = useState('');

  const debouncedDept = useDebounce(deptInput, 400);
  const debouncedPos = useDebounce(posInput, 400);
  const debouncedEmp = useDebounce(empInput, 400);

  useEffect(() => { onSearchDepartments(debouncedDept); }, [debouncedDept, onSearchDepartments]);
  useEffect(() => { onSearchPositions(debouncedPos); }, [debouncedPos, onSearchPositions]);
  useEffect(() => { onSearchEmployees(debouncedEmp); }, [debouncedEmp, onSearchEmployees]);

  // Pin selected items at the top — only those not already in the current search results
  const deptOptions = [
    ...selectedDepartments.filter((s) => !departments.some((o) => String(o.id) === String(s.id))),
    ...departments,
  ];
  const posOptions = [
    ...selectedPositions.filter((s) => !positions.some((o) => String(o.id) === String(s.id))),
    ...positions,
  ];
  const empOptions = [
    ...selectedEmployees.filter((s) => !employees.some((o) => String(o.id) === String(s.id))),
    ...employees,
  ];

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12 }}>
        <StepHeader
          icon="solar:target-bold-duotone"
          title={t('configure-evaluations.drawer.steps.scopeTitle')}
          description={t('configure-evaluations.drawer.steps.scopeDesc')}
        />
      </Grid>

      {/* Departments */}
      <Grid size={{ xs: 12 }}>
        <Autocomplete
          multiple
          fullWidth
          disabled={disabled}
          options={deptOptions}
          value={selectedDepartments}
          inputValue={deptInput}
          onInputChange={(_, value, reason) => {
            if (reason !== 'reset') setDeptInput(value);
          }}
          onChange={(_, newValue) => onDepartmentsChange(newValue)}
          getOptionLabel={(option) => option.name || ''}
          isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
          filterOptions={(x) => x}
          disableCloseOnSelect
          loading={loadingDepartments}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('configure-evaluations.form.fields.departments.label')}
              placeholder={
                selectedDepartments.length === 0
                  ? t('configure-evaluations.form.fields.departments.placeholder')
                  : undefined
              }
              slotProps={{
                input: {
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingDepartments && <CircularProgress size={14} />}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                },
              }}
            />
          )}
          renderOption={(props, option) => {
            const isPinned = !departments.some((o) => String(o.id) === String(option.id));
            return (
              <Box component="li" key={String(option.id)} {...omitKey(props)}>
                <Typography variant="body2" sx={{ flex: 1 }}>
                  {option.name}
                </Typography>
                {isPinned && (
                  <Chip label="✓" size="small" color="primary" sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} />
                )}
              </Box>
            );
          }}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip {...getTagProps({ index })} key={option.id} label={option.name} size="small" />
            ))
          }
        />
      </Grid>

      {/* Positions */}
      <Grid size={{ xs: 12 }}>
        <Autocomplete
          multiple
          fullWidth
          disabled={disabled}
          options={posOptions}
          value={selectedPositions}
          inputValue={posInput}
          onInputChange={(_, value, reason) => {
            if (reason !== 'reset') setPosInput(value);
          }}
          onChange={(_, newValue) => onPositionsChange(newValue)}
          getOptionLabel={(option) => option.name || ''}
          isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
          filterOptions={(x) => x}
          disableCloseOnSelect
          loading={loadingPositions}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('configure-evaluations.form.fields.positions.label')}
              placeholder={
                selectedPositions.length === 0
                  ? t('configure-evaluations.form.fields.positions.placeholder')
                  : undefined
              }
              slotProps={{
                input: {
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingPositions && <CircularProgress size={14} />}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                },
              }}
            />
          )}
          renderOption={(props, option) => {
            const isPinned = !positions.some((o) => String(o.id) === String(option.id));
            return (
              <Box component="li" key={String(option.id)} {...omitKey(props)}>
                <Typography variant="body2" sx={{ flex: 1 }}>
                  {option.name}
                </Typography>
                {isPinned && (
                  <Chip label="✓" size="small" color="primary" sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} />
                )}
              </Box>
            );
          }}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip {...getTagProps({ index })} key={option.id} label={option.name} size="small" />
            ))
          }
        />
      </Grid>

      {/* Employees */}
      <Grid size={{ xs: 12 }}>
        <Autocomplete
          multiple
          fullWidth
          disabled={disabled}
          options={empOptions}
          value={selectedEmployees}
          inputValue={empInput}
          onInputChange={(_, value, reason) => {
            if (reason !== 'reset') setEmpInput(value);
          }}
          onChange={(_, newValue) => onEmployeesChange(newValue)}
          getOptionLabel={(option) => {
            const fullName = `${option.firstName || ''} ${option.firstLastName || ''}`.trim();
            return fullName || option.email || 'Sin información';
          }}
          isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
          filterOptions={(x) => x}
          disableCloseOnSelect
          loading={loadingEmployees}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('configure-evaluations.form.fields.employees.label')}
              placeholder={
                selectedEmployees.length === 0
                  ? t('configure-evaluations.form.fields.employees.placeholder')
                  : undefined
              }
              slotProps={{
                input: {
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingEmployees && <CircularProgress size={14} />}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                },
              }}
            />
          )}
          renderOption={(props, option) => {
            const fullName = `${option.firstName || ''} ${option.firstLastName || ''}`.trim();
            const isPinned = !employees.some((o) => String(o.id) === String(option.id));
            return (
              <Box component="li" key={String(option.id)} {...omitKey(props)}>
                <Stack sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2">{fullName || 'Sin nombre'}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.email || 'Sin email'}
                  </Typography>
                </Stack>
                {isPinned && (
                  <Chip label="✓" size="small" color="primary" sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} />
                )}
              </Box>
            );
          }}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const fullName = `${option.firstName || ''} ${option.firstLastName || ''}`.trim();
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
