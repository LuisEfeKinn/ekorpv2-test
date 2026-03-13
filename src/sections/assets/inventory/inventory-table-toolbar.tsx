import type { IState, ICategory, IEmployee, IAssetsTableFilters } from 'src/types/assets';

import { useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  filters: IAssetsTableFilters;
  onFilters: (name: string, value: string | ICategory[] | IState[] | IEmployee[] | boolean | undefined) => void;
  categoryOptions: ICategory[];
  stateOptions: IState[];
  employeeOptions: IEmployee[];
  onSearchCategories: (search: string) => void;
  onSearchStates: (search: string) => void;
  onSearchEmployees: (search: string) => void;
};

export function InventoryTableToolbar({
  filters,
  onFilters,
  categoryOptions,
  stateOptions,
  employeeOptions,
  onSearchCategories,
  onSearchStates,
  onSearchEmployees,
}: Props) {
  const { t } = useTranslate('assets');

  const handleFilterName = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFilters('name', event.target.value);
    },
    [onFilters]
  );

  const handleFilterSerial = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFilters('serial', event.target.value);
    },
    [onFilters]
  );

  const handleFilterInternalId = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFilters('internalId', event.target.value);
    },
    [onFilters]
  );

  const handleFilterCategory = useCallback(
    (newValue: ICategory[]) => {
      onFilters('category', newValue);
    },
    [onFilters]
  );

  const handleFilterState = useCallback(
    (newValue: IState[]) => {
      onFilters('state', newValue);
    },
    [onFilters]
  );

  const handleFilterEmployee = useCallback(
    (newValue: IEmployee[]) => {
      onFilters('employee', newValue);
    },
    [onFilters]
  );

  const handleFilterIncludeInactive = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFilters('includeInactive', event.target.checked);
    },
    [onFilters]
  );

  const handleFilterHasActiveAssignment = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFilters('hasActiveAssignment', event.target.checked ? true : undefined);
    },
    [onFilters]
  );

  // Función para formatear el nombre del empleado
  const getEmployeeDisplayName = (employee: IEmployee) => {
    const firstName = employee.firstName || '';
    const firstLastName = employee.firstLastName || '';
    const name = [firstName, firstLastName].filter(Boolean).join(' ').trim() || 'Sin nombre';
    return name;
  };

  return (
    <Stack spacing={2} sx={{ p: 2.5, pr: { xs: 2.5, md: 1 } }}>
      {/* Primera fila: Búsqueda general y filtros principales */}
      <Stack direction={{ xs: 'column', md: 'row' }} alignItems="center" spacing={2}>
        <TextField
          fullWidth
          value={filters.name}
          onChange={handleFilterName}
          placeholder={t('inventory.table.search')}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />

        <Autocomplete
          multiple
          fullWidth
          options={categoryOptions}
          getOptionLabel={(option) => option.name}
          value={filters.category}
          onChange={(event, newValue) => handleFilterCategory(newValue)}
          onInputChange={(event, value) => {
            if (event) {
              onSearchCategories(value);
            }
          }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              placeholder={t('inventory.table.filterByCategory')}
            />
          )}
        />

        <Autocomplete
          multiple
          fullWidth
          options={stateOptions}
          getOptionLabel={(option) => option.name}
          value={filters.state}
          onChange={(event, newValue) => handleFilterState(newValue)}
          onInputChange={(event, value) => {
            if (event) {
              onSearchStates(value);
            }
          }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              placeholder={t('inventory.table.filterByState')}
            />
          )}
        />
      </Stack>

      {/* Segunda fila: Filtros adicionales */}
      <Stack direction={{ xs: 'column', md: 'row' }} alignItems="center" spacing={2}>
        <Autocomplete
          multiple
          fullWidth
          options={employeeOptions}
          getOptionLabel={(option) => getEmployeeDisplayName(option)}
          value={filters.employee}
          onChange={(event, newValue) => handleFilterEmployee(newValue)}
          onInputChange={(event, value) => {
            if (event) {
              onSearchEmployees(value);
            }
          }}
          renderOption={(props, option) => (
            <li {...props} key={option.id}>
              <Stack>
                <Typography variant="body2">
                  {getEmployeeDisplayName(option)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {option.email}
                </Typography>
              </Stack>
            </li>
          )}
          renderInput={(params) => (
            <TextField 
              {...params} 
              placeholder={t('inventory.table.filterByEmployee')}
            />
          )}
        />

        <TextField
          fullWidth
          value={filters.serial}
          onChange={handleFilterSerial}
          placeholder={t('inventory.table.filterBySerial')}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="solar:eye-scan-bold" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          fullWidth
          value={filters.internalId}
          onChange={handleFilterInternalId}
          placeholder={t('inventory.table.filterByInternalId')}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="solar:flag-bold" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />
      </Stack>

      {/* Tercera fila: Switches */}
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" spacing={2}>
        <FormControlLabel
          control={
            <Switch
              checked={filters.includeInactive}
              onChange={handleFilterIncludeInactive}
            />
          }
          label={t('inventory.table.includeInactive')}
        />

        <FormControlLabel
          control={
            <Switch
              checked={filters.hasActiveAssignment !== undefined}
              onChange={handleFilterHasActiveAssignment}
            />
          }
          label={t('inventory.table.hasActiveAssignment')}
        />
      </Stack>
    </Stack>
  );
}