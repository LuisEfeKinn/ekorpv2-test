'use client';

import type { IParticipantWithEvaluatorsTableFilters } from 'src/types/performance';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import { GetOrganizationalUnitPaginationService } from 'src/services/organization/organizationalUnit.service';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type OrganizationalUnitOption = {
  id: string;
  name: string;
};

type Props = {
  filters: {
    state: IParticipantWithEvaluatorsTableFilters;
    setState: (updates: Partial<IParticipantWithEvaluatorsTableFilters>) => void;
  };
  onResetPage: () => void;
};

export function ParticipantsWithEvaluatorsTableToolbar({ filters, onResetPage }: Props) {
  const { t } = useTranslate('performance');

  // Estado para las opciones de unidades organizacionales
  const [unitOptions, setUnitOptions] = useState<OrganizationalUnitOption[]>([]);
  const [unitLoading, setUnitLoading] = useState(false);
  const [unitSearch, setUnitSearch] = useState('');

  // Función para aplanar la estructura de árbol de unidades organizacionales
  const flattenUnits = useCallback((units: any[]): OrganizationalUnitOption[] => {
    const result: OrganizationalUnitOption[] = [];
    
    const processUnit = (unit: any) => {
      result.push({
        id: unit.id,
        name: unit.name,
      });
      if (unit.children && unit.children.length > 0) {
        unit.children.forEach(processUnit);
      }
    };

    units.forEach(processUnit);
    return result;
  }, []);

  // Cargar unidades organizacionales
  const fetchOrganizationalUnits = useCallback(async (search: string) => {
    setUnitLoading(true);
    try {
      const params = {
        page: 1,
        perPage: 20,
        search: search || undefined,
      };
      const response = await GetOrganizationalUnitPaginationService(params);
      const units = response.data || [];
      setUnitOptions(flattenUnits(units));
    } catch (error) {
      console.error('Error loading organizational units:', error);
      setUnitOptions([]);
    } finally {
      setUnitLoading(false);
    }
  }, [flattenUnits]);

  // Cargar unidades iniciales
  useEffect(() => {
    fetchOrganizationalUnits('');
  }, [fetchOrganizationalUnits]);

  // Debounce para búsqueda de unidades
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrganizationalUnits(unitSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [unitSearch, fetchOrganizationalUnits]);

  const handleFilterSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      filters.setState({ search: event.target.value });
      onResetPage();
    },
    [filters, onResetPage]
  );

  return (
    <Stack spacing={2} sx={{ p: 2.5 }}>
      {/* Campo de búsqueda */}
      <TextField
        fullWidth
        value={filters.state.search}
        onChange={handleFilterSearch}
        placeholder={t('participants-with-evaluators.table.toolbar.search')}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
            </InputAdornment>
          ),
        }}
      />

      {/* Autocomplete para Unidad Organizacional */}
      <Autocomplete
        fullWidth
        options={unitOptions}
        getOptionLabel={(option) => option.name}
        value={unitOptions.find((opt) => opt.id === filters.state.organizationalUnitId) || null}
        onChange={(event, newValue) => {
          filters.setState({ organizationalUnitId: newValue?.id || '' });
          onResetPage();
        }}
        onInputChange={(_, newInputValue) => setUnitSearch(newInputValue)}
        loading={unitLoading}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        renderOption={(props, option) => (
          <Box component="li" {...props} key={option.id}>
            <Typography variant="body2">{option.name}</Typography>
          </Box>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={t('participants-with-evaluators.table.toolbar.filterByOrganizationalUnit')}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <>
                  <InputAdornment position="start">
                    <Iconify icon={"mdi:office-building" as any} sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                  {params.InputProps.startAdornment}
                </>
              ),
              endAdornment: (
                <>
                  {unitLoading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />
    </Stack>
  );
}
