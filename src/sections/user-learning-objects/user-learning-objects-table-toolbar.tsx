import type { ILearningObjectTableFilters } from 'src/types/learning';

import { useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

interface ILearningPath {
  id: string;
  name: string;
}

type Props = {
  filters: ILearningObjectTableFilters;
  onFilters: (name: string, value: string | null) => void;
  learningPaths?: ILearningPath[];
  onSearchLearningPaths?: (search: string) => void;
  orderOptions?: Array<{ value: string; label: string }>;
};

export function LearningObjectTableToolbar({ 
  filters, 
  onFilters, 
  learningPaths = [], 
  onSearchLearningPaths,
  orderOptions = []
}: Props) {
  const { t } = useTranslate('learning');
  
  const handleFilterName = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFilters('name', event.target.value);
    },
    [onFilters]
  );

  const handleFilterOrder = useCallback(
    (event: any) => {
      onFilters('order', event.target.value);
    },
    [onFilters]
  );

  const handleFilterLearningPath = useCallback(
    (_event: any, value: ILearningPath | null) => {
      onFilters('learningPathId', value?.id || null);
    },
    [onFilters]
  );

  return (
    <Stack
      spacing={2}
      alignItems={{ xs: 'flex-end', md: 'center' }}
      direction={{ xs: 'column', md: 'row' }}
      sx={{ p: 2.5 }}
    >
      <Stack direction="row" alignItems="center" spacing={2} flexGrow={1} sx={{ width: 1 }}>
        <TextField
          fullWidth
          value={filters.name}
          onChange={handleFilterName}
          placeholder={t('learning-objects.table.toolbar.search')}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />

        <Autocomplete
          fullWidth
          options={learningPaths}
          getOptionLabel={(option) => option.name}
          value={learningPaths.find((lp) => lp.id === filters.learningPathId) || null}
          onChange={handleFilterLearningPath}
          filterOptions={(options, state) => {
            // Filtrar localmente las opciones según lo que el usuario escribe
            const inputValue = state.inputValue.toLowerCase();
            if (!inputValue) return options;
            return options.filter((option) =>
              option.name.toLowerCase().includes(inputValue)
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={t('learning-objects.table.toolbar.learningPath')}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="solar:book-bold" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
          )}
          sx={{ minWidth: 250 }}
        />

        <Select
          value={filters.order || 'enrolledAt:desc'}
          onChange={handleFilterOrder}
          displayEmpty
          sx={{ minWidth: 220 }}
        >
          {orderOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </Stack>
    </Stack>
  );
}