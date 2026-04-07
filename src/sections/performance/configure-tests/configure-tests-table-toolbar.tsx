'use client';

import type { IConfigureTestTableFilters } from 'src/types/performance';

import { useState, useEffect, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';

import { useTranslate } from 'src/locales';
import { GetPerformanceRelatedDataService } from 'src/services/performance/related-data.service';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  filters: {
    state: IConfigureTestTableFilters;
    setState: (updates: Partial<IConfigureTestTableFilters>) => void;
  };
  onResetPage: () => void;
};

type TypeOption = { id: string; name: string };

export function ConfigureTestsTableToolbar({ filters, onResetPage }: Props) {
  const { t } = useTranslate('performance');

  // Helper function for translations
  const translateType = useCallback(
    (typeId: string) => t(`configure-evaluations.types.${typeId}`),
    [t]
  );

  const [typeOptions, setTypeOptions] = useState<TypeOption[]>([]);

  // Cargar tipos desde GetPerformanceRelatedDataService
  useEffect(() => {
    const loadRelatedData = async () => {
      try {
        const response = await GetPerformanceRelatedDataService({});
        if (response.data?.statusCode === 200 && response.data?.data) {
          setTypeOptions(
            response.data.data.evaluationTypes?.map((type: any) => ({
              id: type.value,
              name: type.value,
            })) || []
          );
        }
      } catch (error) {
        console.error('Error loading related data:', error);
      }
    };
    loadRelatedData();
  }, []);

  const handleFilterName = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      filters.setState({ name: event.target.value });
      onResetPage();
    },
    [filters, onResetPage]
  );

  const handleFilterType = useCallback(
    (event: React.SyntheticEvent, newValue: TypeOption | null) => {
      filters.setState({ type: newValue?.id || '' });
      onResetPage();
    },
    [filters, onResetPage]
  );

  return (
    <Stack
      spacing={2}
      alignItems={{ xs: 'flex-end', md: 'center' }}
      direction={{ xs: 'column', md: 'row' }}
      sx={{ p: 2.5, pr: { xs: 2.5, md: 1 } }}
    >
      <Stack direction="row" alignItems="center" spacing={2} flexGrow={1} sx={{ width: 1 }}>
        <TextField
          fullWidth
          value={filters.state.name}
          onChange={handleFilterName}
          placeholder={t('configure-tests.table.toolbar.search')}
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
          options={typeOptions}
          getOptionLabel={(option) => translateType(option.name)}
          value={typeOptions.find((opt) => opt.id === filters.state.type) || null}
          onChange={handleFilterType}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={t('configure-tests.table.toolbar.filterByType')}
            />
          )}
        />

        <FormControl sx={{ minWidth: 160 }}>
          <Select
            value={filters.state.isActive === '' ? '' : String(filters.state.isActive)}
            onChange={(e) => {
              const val = e.target.value;
              filters.setState({ isActive: val === '' ? '' : val === 'true' });
              onResetPage();
            }}
            displayEmpty
            renderValue={(selected) => {
              if (selected === '') return t('configure-tests.table.filters.statusAll');
              return selected === 'true'
                ? t('configure-tests.table.filters.statusActive')
                : t('configure-tests.table.filters.statusInactive');
            }}
          >
            <MenuItem value=""><em>{t('configure-tests.table.filters.statusAll')}</em></MenuItem>
            <MenuItem value="true">{t('configure-tests.table.filters.statusActive')}</MenuItem>
            <MenuItem value="false">{t('configure-tests.table.filters.statusInactive')}</MenuItem>
          </Select>
        </FormControl>
      </Stack>
    </Stack>
  );
}
