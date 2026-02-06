'use client';

import type { IEvaluationListTableFilters } from 'src/types/performance';

import { useState, useEffect, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';

import { useTranslate } from 'src/locales';
import { GetVigenciesPaginationService } from 'src/services/organization/vigencies.service';
import {
  GetOrganizationalUnitPaginationService,
  normalizeOrganizationalUnitListResponse,
} from 'src/services/organization/organizationalUnit.service';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  filters: {
    state: IEvaluationListTableFilters;
    setState: (updates: Partial<IEvaluationListTableFilters>) => void;
  };
  onResetPage: () => void;
};

type VigencyOption = { id: string; name: string };
type OrganizationalUnitOption = { id: string; name: string };

export function EvaluationsListTableToolbar({ filters, onResetPage }: Props) {
  const { t } = useTranslate('performance');

  // Estados para las opciones de cada autocomplete
  const [vigencyOptions, setVigencyOptions] = useState<VigencyOption[]>([]);
  const [organizationalUnitOptions, setOrganizationalUnitOptions] = useState<
    OrganizationalUnitOption[]
  >([]);

  // Estados para loading de cada autocomplete
  const [vigencyLoading, setVigencyLoading] = useState(false);
  const [organizationalUnitLoading, setOrganizationalUnitLoading] = useState(false);

  const handleFilterName = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      filters.setState({ name: event.target.value });
      onResetPage();
    },
    [filters, onResetPage]
  );

  // Función para cargar vigencias
  const loadVigencies = useCallback(async (searchTerm: string) => {
    setVigencyLoading(true);
    try {
      const response = await GetVigenciesPaginationService({
        page: 1,
        perPage: 20,
        search: searchTerm || undefined,
      });
      setVigencyOptions(
        response.data?.data?.data?.map((vigency: any) => ({
          id: vigency.id,
          name: vigency.name,
        })) || []
      );
    } catch (error) {
      console.error('Error loading vigencies:', error);
      setVigencyOptions([]);
    } finally {
      setVigencyLoading(false);
    }
  }, []);

  // Función para cargar unidades organizacionales
  const loadOrganizationalUnits = useCallback(async (searchTerm: string) => {
    setOrganizationalUnitLoading(true);
    try {
      const response = await GetOrganizationalUnitPaginationService({
        page: 1,
        perPage: 20,
        search: searchTerm || undefined,
      });
      const normalizedData = normalizeOrganizationalUnitListResponse(response.data);
      setOrganizationalUnitOptions(
        normalizedData?.map((unit: any) => ({
          id: unit.id,
          name: unit.name,
        })) || []
      );
    } catch (error) {
      console.error('Error loading organizational units:', error);
      setOrganizationalUnitOptions([]);
    } finally {
      setOrganizationalUnitLoading(false);
    }
  }, []);

  // Cargar datos iniciales al montar el componente
  useEffect(() => {
    loadVigencies('');
    loadOrganizationalUnits('');
  }, [loadVigencies, loadOrganizationalUnits]);

  return (
    <Stack spacing={2} sx={{ p: 2.5 }}>
      {/* Campo de búsqueda principal */}
      <TextField
        fullWidth
        value={filters.state.name}
        onChange={handleFilterName}
        placeholder={t('evaluations-list.table.toolbar.search')}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
            </InputAdornment>
          ),
        }}
      />

      {/* Grid responsive para los filtros */}
      <Stack
        spacing={2}
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          },
          gap: 2,
        }}
      >
        {/* Autocomplete para Vigencia */}
        <Autocomplete
          fullWidth
          options={vigencyOptions}
          loading={vigencyLoading}
          getOptionLabel={(option) => option.name}
          value={vigencyOptions.find((opt) => opt.id === filters.state.vigencyId) || null}
          onChange={(event, newValue) => {
            filters.setState({ vigencyId: newValue?.id || '' });
            onResetPage();
          }}
          onInputChange={(event, newInputValue) => {
            loadVigencies(newInputValue);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('evaluations-list.table.toolbar.filterByVigency')}
              placeholder={t('evaluations-list.table.filters.vigency')}
            />
          )}
        />

        {/* Autocomplete para Unidad Organizacional */}
        <Autocomplete
          fullWidth
          multiple
          options={organizationalUnitOptions}
          loading={organizationalUnitLoading}
          getOptionLabel={(option) => option.name}
          value={organizationalUnitOptions.filter((opt) =>
            filters.state.organizationalUnitIds.includes(opt.id)
          )}
          onChange={(event, newValue) => {
            filters.setState({
              organizationalUnitIds: newValue.map((item) => item.id),
            });
            onResetPage();
          }}
          onInputChange={(event, newInputValue) => {
            loadOrganizationalUnits(newInputValue);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('evaluations-list.table.toolbar.filterByOrganizationalUnit')}
              placeholder={t('evaluations-list.table.filters.organizationalUnit')}
            />
          )}
        />

        {/* Select para Orden */}
        <FormControl fullWidth>
          <Select
            value={filters.state.orderDirection}
            onChange={(event) => {
              filters.setState({ orderDirection: event.target.value as 'ASC' | 'DESC' | '' });
              onResetPage();
            }}
            displayEmpty
            renderValue={(selected) => {
              if (!selected) {
                return t('evaluations-list.table.toolbar.orderDirection');
              }
              return selected === 'ASC'
                ? t('evaluations-list.table.filters.orderAsc')
                : t('evaluations-list.table.filters.orderDesc');
            }}
          >
            <MenuItem value="">
              <em>{t('evaluations-list.table.toolbar.orderDirection')}</em>
            </MenuItem>
            <MenuItem value="ASC">{t('evaluations-list.table.filters.orderAsc')}</MenuItem>
            <MenuItem value="DESC">{t('evaluations-list.table.filters.orderDesc')}</MenuItem>
          </Select>
        </FormControl>
      </Stack>
    </Stack>
  );
}
