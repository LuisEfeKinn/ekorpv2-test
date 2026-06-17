import type { IRegionOption, ICountryOption } from 'src/types/locations';
import type { ISkillOption, IUserManagementTableFilters } from 'src/types/employees';
import type { IPositionOption, IOrganizationalUnitOption } from 'src/types/organization';

import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useTranslate } from 'src/locales';
import { GetJobsKmService } from 'src/services/organization/job-km.service';
import { GetSkillsPaginationService } from 'src/services/employees/skills.service';
import { GetRegionsService, GetCountriesService } from 'src/services/locations/locations.service';
import {
  GetOrganizationUnitPaginationService,
} from 'src/services/organization/organizationalUnit.service';

import { Iconify } from 'src/components/iconify';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  filters: IUserManagementTableFilters;
  onFilters: (name: string, value: string) => void;
  allColumns: Array<{ id: string; label: string }>;
  fixedColumnIds: Set<string>;
  visibleColumns: string[];
  onChangeColumns: (columnId: string) => void;
};

export function UserManagmentTableToolbar({
  filters,
  onFilters,
  allColumns,
  fixedColumnIds,
  visibleColumns,
  onChangeColumns,
}: Props) {
  const { t: tUsers } = useTranslate('employees');
  const popover = usePopover();
  const fixedColumnSet = useMemo(() => fixedColumnIds, [fixedColumnIds]);
  const selectedColumnsCount = fixedColumnSet.size + visibleColumns.length;
  
  // Estados para las opciones de cada autocomplete
  const [positionOptions, setPositionOptions] = useState<IPositionOption[]>([]);
  const [skillOptions, setSkillOptions] = useState<ISkillOption[]>([]);
  const [organizationalUnitOptions, setOrganizationalUnitOptions] = useState<IOrganizationalUnitOption[]>([]);
  const [countryOptions, setCountryOptions] = useState<ICountryOption[]>([]);
  const [regionOptions, setRegionOptions] = useState<IRegionOption[]>([]);

  // Estados para loading de cada autocomplete
  const [positionLoading, setPositionLoading] = useState(false);
  const [skillLoading, setSkillLoading] = useState(false);
  const [organizationalUnitLoading, setOrganizationalUnitLoading] = useState(false);
  const [countryLoading, setCountryLoading] = useState(false);
  const [regionLoading, setRegionLoading] = useState(false);

  const handleFilterName = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFilters('name', event.target.value);
    },
    [onFilters]
  );

  // Función para cargar posiciones
  const loadPositions = useCallback(async (searchTerm: string) => {
    setPositionLoading(true);
    try {
      const response = await GetJobsKmService({
        page: 1,
        perPage: 20,
        search: searchTerm || undefined,
      });
      setPositionOptions(
        (response.data.data || []).map((position) => ({
          id: String(position.id),
          name: position.name,
          objectives: position.objectives ?? undefined,
          expectedResults: position.expectedResults ?? undefined,
          requirements: position.requirements ?? undefined,
          otherFunctions: position.otherFunctions ?? undefined,
        }))
      );
    } catch (error) {
      console.error('Error loading positions:', error);
      setPositionOptions([]);
    } finally {
      setPositionLoading(false);
    }
  }, []);

  // Función para cargar skills
  const loadSkills = useCallback(async (searchTerm: string) => {
    setSkillLoading(true);
    try {
      const response = await GetSkillsPaginationService({
        page: 1,
        perPage: 20,
        search: searchTerm || undefined,
      });
      setSkillOptions(response.data.data.data || []);
    } catch (error) {
      console.error('Error loading skills:', error);
      setSkillOptions([]);
    } finally {
      setSkillLoading(false);
    }
  }, []);

  // Función para cargar unidades organizacionales
  const loadOrganizationalUnits = useCallback(async (searchTerm: string) => {
    setOrganizationalUnitLoading(true);
    try {
      const response = await GetOrganizationUnitPaginationService({
        page: 1,
        perPage: 20,
        search: searchTerm || undefined,
      });
      const list = response.data.data || [];
      setOrganizationalUnitOptions(
        list.map((u) => ({
          id: String(u.id),
          name: u.name,
          code: u.code,
          description: u.description,
          color: u.color,
        }))
      );
    } catch (error) {
      console.error('Error loading organizational units:', error);
      setOrganizationalUnitOptions([]);
    } finally {
      setOrganizationalUnitLoading(false);
    }
  }, []);

  // Función para cargar países
  const loadCountries = useCallback(async (searchTerm: string) => {
    setCountryLoading(true);
    try {
      const response = await GetCountriesService({
        search: searchTerm || undefined,
      });
      setCountryOptions(response.data.data || []);
    } catch (error) {
      console.error('Error loading countries:', error);
      setCountryOptions([]);
    } finally {
      setCountryLoading(false);
    }
  }, []);

  // Función para cargar regiones (requiere countryId; si no hay país, limpia las opciones)
  const loadRegions = useCallback(async (searchTerm: string, countryId?: string) => {
    if (!countryId) {
      setRegionOptions([]);
      setRegionLoading(false);
      return;
    }
    setRegionLoading(true);
    try {
      const response = await GetRegionsService({
        countryId,
        search: searchTerm || undefined,
      });
      setRegionOptions(response.data.data || []);
    } catch (error) {
      console.error('Error loading regions:', error);
      setRegionOptions([]);
    } finally {
      setRegionLoading(false);
    }
  }, []);

  // Cargar/limpiar regiones cuando cambia el país seleccionado
  useEffect(() => {
    if (filters.countryId) {
      loadRegions('', filters.countryId);
    } else {
      setRegionOptions([]);
    }
  }, [filters.countryId, loadRegions]);

  return (
    <>
      <Stack spacing={2} sx={{ p: 2.5 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
          <TextField
            fullWidth
            value={filters.name}
            onChange={handleFilterName}
            placeholder={tUsers('user-management.table.toolbar.search')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />

          <Button
            color="inherit"
            variant="outlined"
            startIcon={<Iconify icon="solar:settings-bold" />}
            onClick={popover.onOpen}
            sx={{ textTransform: 'capitalize', whiteSpace: 'nowrap' }}
          >
            {tUsers('user-management.table.actions.columns')}
          </Button>
        </Stack>

        <Stack
          spacing={2}
          direction={{ xs: 'column', sm: 'row' }}
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(5, 1fr)',
            },
            gap: 2,
          }}
        >
        {/* Autocomplete para Posición */}
        <Autocomplete
          fullWidth
          options={positionOptions}
          loading={positionLoading}
          getOptionLabel={(option) => option.name}
          value={positionOptions.find((opt) => opt.id === filters.positionId) || null}
          onChange={(_event, newValue) => {
            onFilters('positionId', newValue?.id || '');
          }}
          onOpen={() => {
            if (positionOptions.length === 0) {
              loadPositions('');
            }
          }}
          onInputChange={(_event, newInputValue) => {
            loadPositions(newInputValue);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={tUsers('user-management.table.filters.position')}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="solar:users-group-rounded-bold" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
          )}
        />

        {/* Autocomplete para Skill */}
        <Autocomplete
          fullWidth
          options={skillOptions}
          loading={skillLoading}
          getOptionLabel={(option) => option.name}
          value={skillOptions.find((opt) => opt.id === filters.competencyId) || null}
          onChange={(_event, newValue) => {
            onFilters('competencyId', newValue?.id || '');
          }}
          onOpen={() => {
            if (skillOptions.length === 0) {
              loadSkills('');
            }
          }}
          onInputChange={(_event, newInputValue) => {
            loadSkills(newInputValue);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={tUsers('user-management.table.filters.skill')}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="solar:star-bold" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
          )}
        />

        {/* Autocomplete para Unidad Organizacional */}
        <Autocomplete
          fullWidth
          options={organizationalUnitOptions}
          loading={organizationalUnitLoading}
          getOptionLabel={(option) => option.name}
          value={organizationalUnitOptions.find((opt) => opt.id === filters.organizationalUnitId) || null}
          onChange={(_event, newValue) => {
            onFilters('organizationalUnitId', newValue?.id || '');
          }}
          onOpen={() => {
            if (organizationalUnitOptions.length === 0) {
              loadOrganizationalUnits('');
            }
          }}
          onInputChange={(_event, newInputValue) => {
            loadOrganizationalUnits(newInputValue);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={tUsers('user-management.table.filters.organizationalUnit')}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon={"solar:shield-bold" as any} sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
          )}
        />

        {/* Autocomplete para País */}
        <Autocomplete
          fullWidth
          options={countryOptions}
          loading={countryLoading}
          getOptionLabel={(option) => option.name}
          value={countryOptions.find((opt) => opt.id === filters.countryId) || null}
          onChange={(_event, newValue) => {
            const newCountryId = newValue?.id || '';
            onFilters('countryId', newCountryId);
            // Si cambió el país y hay una región seleccionada, resetearla
            // (las regiones dependen del país)
            if (newCountryId !== filters.countryId && filters.regionId) {
              onFilters('regionId', '');
            }
          }}
          onOpen={() => {
            if (countryOptions.length === 0) {
              loadCountries('');
            }
          }}
          onInputChange={(_event, newInputValue) => {
            loadCountries(newInputValue);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={tUsers('user-management.table.filters.country')}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="solar:flag-bold" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
          )}
        />

        {/* Autocomplete para Región (depende del país seleccionado) */}
        <Autocomplete
          fullWidth
          disabled={!filters.countryId}
          options={regionOptions}
          loading={regionLoading}
          getOptionLabel={(option) => option.name}
          value={regionOptions.find((opt) => opt.id === filters.regionId) || null}
          onChange={(_event, newValue) => {
            onFilters('regionId', newValue?.id || '');
          }}
          onOpen={() => {
            if (regionOptions.length === 0 && filters.countryId) {
              loadRegions('', filters.countryId);
            }
          }}
          onInputChange={(_event, newInputValue) => {
            loadRegions(newInputValue, filters.countryId);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={
                filters.countryId
                  ? tUsers('user-management.table.filters.region')
                  : tUsers('user-management.table.filters.regionSelectCountryFirst')
              }
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon={"solar:compass-bold" as any} sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
          )}
        />
        </Stack>
      </Stack>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{
          arrow: { placement: 'top-right' },
          paper: {
            sx: {
              width: { xs: 'calc(100vw - 32px)', sm: 420 },
              maxWidth: 'calc(100vw - 32px)',
              maxHeight: { xs: '70vh', sm: 520 },
              overflow: 'hidden',
            },
          },
        }}
      >
        <Box sx={{ p: 1 }}>
          <Box
            sx={{
              px: 1.5,
              py: 1.25,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Box sx={{ typography: 'subtitle2' }}>
              {tUsers('user-management.table.actions.columns')}
            </Box>
            <Box sx={{ typography: 'caption', color: 'text.secondary', whiteSpace: 'nowrap' }}>
              {selectedColumnsCount}/{allColumns.length}
            </Box>
          </Box>

          <Box
            sx={{
              px: 1,
              pb: 1,
              maxHeight: { xs: 'calc(70vh - 56px)', sm: 452 },
              overflowY: 'auto',
            }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                gap: 0.5,
                alignItems: 'start',
              }}
            >
            {allColumns.map((column) => (
              <FormControlLabel
                key={column.id}
                control={
                  <Checkbox
                    size="small"
                    checked={fixedColumnSet.has(column.id) || visibleColumns.includes(column.id)}
                    disabled={fixedColumnSet.has(column.id)}
                    onChange={() => {
                      if (!fixedColumnSet.has(column.id)) onChangeColumns(column.id);
                    }}
                  />
                }
                label={column.label}
                sx={{
                  m: 0,
                  minHeight: 36,
                  alignItems: 'flex-start',
                  borderRadius: 1,
                  px: 0.5,
                  py: 0.25,
                  ...(fixedColumnSet.has(column.id) && {
                    bgcolor: 'background.neutral',
                  }),
                  '& .MuiFormControlLabel-label': {
                    typography: 'body2',
                    lineHeight: 1.35,
                    pt: '2px',
                    overflowWrap: 'anywhere',
                  },
                }}
              />
            ))}
            </Box>
          </Box>
        </Box>
      </CustomPopover>
    </>
  );
}
