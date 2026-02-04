'use client';

import type {
  ICategory,
  IAssetsItem,
  IAssetRecordType,
  IUserManagementEmployee,
  IAssetRecordTableFilters,
} from 'src/types/assets';

import { useCallback } from 'react';

import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  filters: IAssetRecordTableFilters;
  onFilters: (
    name: string,
    value: string | IAssetsItem[] | IAssetRecordType[] | ICategory[] | IUserManagementEmployee[]
  ) => void;
  assetOptions: IAssetsItem[];
  categoryOptions: ICategory[];
  employeeOptions: IUserManagementEmployee[];
  onSearchAssets: (search: string) => void;
  onSearchCategories: (search: string) => void;
  onSearchEmployees: (search: string) => void;
};

export function AssetRecordTableToolbar({
  filters,
  onFilters,
  assetOptions,
  categoryOptions,
  employeeOptions,
  onSearchAssets,
  onSearchCategories,
  onSearchEmployees,
}: Props) {
  const { t } = useTranslate('assets');

  const handleFilterName = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFilters('name', event.target.value);
    },
    [onFilters]
  );

  const handleFilterAsset = useCallback(
    (newValue: IAssetsItem[]) => {
      onFilters('assetId', newValue);
    },
    [onFilters]
  );

  const handleFilterType = useCallback(
    (newValue: IAssetRecordType[]) => {
      onFilters('type', newValue);
    },
    [onFilters]
  );

  const handleFilterCategory = useCallback(
    (newValue: ICategory[]) => {
      onFilters('category', newValue);
    },
    [onFilters]
  );

  const handleFilterFromDate = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFilters('fromDate', event.target.value);
    },
    [onFilters]
  );

  const handleFilterToDate = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFilters('toDate', event.target.value);
    },
    [onFilters]
  );

  const handleFilterPerformedBy = useCallback(
    (newValue: IUserManagementEmployee[]) => {
      onFilters('performedById', newValue);
    },
    [onFilters]
  );

  const handleFilterTargetEmployee = useCallback(
    (newValue: IUserManagementEmployee[]) => {
      onFilters('targetEmployeeId', newValue);
    },
    [onFilters]
  );

  const typeOptions: { value: IAssetRecordType; label: string }[] = [
    { value: 'ASSIGN', label: t('record.types.ASSIGN') },
    { value: 'UNASSIGN', label: t('record.types.UNASSIGN') },
    { value: 'STATE_CHANGE', label: t('record.types.STATE_CHANGE') },
    { value: 'CREATE', label: t('record.types.CREATE') },
    { value: 'UPDATE', label: t('record.types.UPDATE') },
  ];

  return (
    <Stack spacing={2} sx={{ p: 2.5, pr: { xs: 2.5, md: 1 } }}>
      {/* Primera fila: Búsqueda general y filtros principales */}
      <Stack direction={{ xs: 'column', md: 'row' }} alignItems="center" spacing={2}>
        <TextField
          fullWidth
          value={filters.name}
          onChange={handleFilterName}
          placeholder={t('record.table.search')}
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
          options={assetOptions}
          getOptionLabel={(option) => `${option.name} (${option.internalId})`}
          value={filters.assetId}
          onChange={(event, newValue) => handleFilterAsset(newValue)}
          onInputChange={(event, value) => {
            if (event) {
              onSearchAssets(value);
            }
          }}
          renderInput={(params) => (
            <TextField {...params} placeholder={t('record.table.filterByAsset')} />
          )}
        />

        <Autocomplete
          multiple
          fullWidth
          options={typeOptions}
          getOptionLabel={(option) => option.label}
          value={typeOptions.filter((opt) => filters.type.includes(opt.value))}
          onChange={(event, newValue) => handleFilterType(newValue.map((v) => v.value))}
          renderInput={(params) => (
            <TextField {...params} placeholder={t('record.table.filterByType')} />
          )}
        />
      </Stack>

      {/* Segunda fila: Filtros adicionales */}
      <Stack direction={{ xs: 'column', md: 'row' }} alignItems="center" spacing={2}>
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
            <TextField {...params} placeholder={t('record.table.filterByCategory')} />
          )}
        />

        <TextField
          fullWidth
          type="date"
          value={filters.fromDate}
          onChange={handleFilterFromDate}
          label={t('record.table.filterByFromDate')}
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          fullWidth
          type="date"
          value={filters.toDate}
          onChange={handleFilterToDate}
          label={t('record.table.filterByToDate')}
          InputLabelProps={{ shrink: true }}
        />
      </Stack>

      {/* Tercera fila: Filtros de empleados */}
      <Stack direction={{ xs: 'column', md: 'row' }} alignItems="center" spacing={2}>
        <Autocomplete
          multiple
          fullWidth
          options={employeeOptions}
          getOptionLabel={(option) =>
            `${option.firstName} ${option.firstLastName}`.trim() || option.email
          }
          value={filters.performedById}
          onChange={(event, newValue) => handleFilterPerformedBy(newValue)}
          onInputChange={(event, value) => {
            if (event) {
              onSearchEmployees(value);
            }
          }}
          renderInput={(params) => (
            <TextField {...params} placeholder={t('record.table.filterByPerformedBy')} />
          )}
        />

        <Autocomplete
          multiple
          fullWidth
          options={employeeOptions}
          getOptionLabel={(option) =>
            `${option.firstName} ${option.firstLastName}`.trim() || option.email
          }
          value={filters.targetEmployeeId}
          onChange={(event, newValue) => handleFilterTargetEmployee(newValue)}
          onInputChange={(event, value) => {
            if (event) {
              onSearchEmployees(value);
            }
          }}
          renderInput={(params) => (
            <TextField {...params} placeholder={t('record.table.filterByTargetEmployee')} />
          )}
        />
      </Stack>
    </Stack>
  );
}
