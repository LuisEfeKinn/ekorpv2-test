'use client';

import type { IConfigureEvaluationTableFilters } from 'src/types/performance';

import { useState, useEffect, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';

import { useTranslate } from 'src/locales';
import { GetPositionPaginationService } from 'src/services/organization/position.service';
import { GetPerformanceRelatedDataService } from 'src/services/performance/related-data.service';
import { GetUserManagmentPaginationService } from 'src/services/employees/user-managment.service';
import { GetOrganizationalUnitPaginationService } from 'src/services/organization/organizationalUnit.service';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  filters: {
    state: IConfigureEvaluationTableFilters;
    setState: (updates: Partial<IConfigureEvaluationTableFilters>) => void;
  };
  onResetPage: () => void;
};

type TypeOption = { id: string; name: string };
type StatusOption = { id: string; name: string };
type DepartmentOption = { id: string; name: string };
type PositionOption = { id: string; name: string };
type EmployeeOption = { id: string; firstName: string; firstLastName: string };

export function ConfigureEvaluationsTableToolbar({ filters, onResetPage }: Props) {
  const { t } = useTranslate('performance');

  // Helper functions for translations
  const translateType = useCallback(
    (typeId: string) => t(`configure-evaluations.types.${typeId}`),
    [t]
  );

  const translateStatus = useCallback(
    (statusId: string) => t(`configure-evaluations.statuses.${statusId}`),
    [t]
  );
  
  // Estados para las opciones de cada autocomplete
  const [typeOptions, setTypeOptions] = useState<TypeOption[]>([]);
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<DepartmentOption[]>([]);
  const [positionOptions, setPositionOptions] = useState<PositionOption[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<EmployeeOption[]>([]);

  // Estados para loading de cada autocomplete
  const [departmentLoading, setDepartmentLoading] = useState(false);
  const [positionLoading, setPositionLoading] = useState(false);
  const [employeeLoading, setEmployeeLoading] = useState(false);

  // Cargar tipos y estados desde GetPerformanceRelatedDataService
  useEffect(() => {
    const loadRelatedData = async () => {
      try {
        const response = await GetPerformanceRelatedDataService({});
        if (response.data?.statusCode === 200 && response.data?.data) {
          setTypeOptions(
            response.data.data.evaluationTypes?.map((type: any) => ({ 
              id: type.value, 
              name: type.value 
            })) || []
          );
          setStatusOptions(
            response.data.data.evaluationStatuses?.map((status: any) => ({ 
              id: status.value, 
              name: status.value 
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

  // Función para cargar departamentos
  const loadDepartments = useCallback(async (searchTerm: string) => {
    setDepartmentLoading(true);
    try {
      const response = await GetOrganizationalUnitPaginationService({
        page: 1,
        perPage: 20,
        search: searchTerm || undefined,
      });
      setDepartmentOptions(
        response.data?.map((dept: any) => ({ id: dept.id, name: dept.name })) || []
      );
    } catch (error) {
      console.error('Error loading departments:', error);
      setDepartmentOptions([]);
    } finally {
      setDepartmentLoading(false);
    }
  }, []);

  // Función para cargar posiciones
  const loadPositions = useCallback(async (searchTerm: string) => {
    setPositionLoading(true);
    try {
      const response = await GetPositionPaginationService({
        page: 1,
        perPage: 20,
        search: searchTerm || undefined,
      });
      setPositionOptions(
        response.data?.data?.map((pos: any) => ({ id: pos.id, name: pos.name })) || []
      );
    } catch (error) {
      console.error('Error loading positions:', error);
      setPositionOptions([]);
    } finally {
      setPositionLoading(false);
    }
  }, []);

  // Función para cargar empleados
  const loadEmployees = useCallback(async (searchTerm: string) => {
    setEmployeeLoading(true);
    try {
      const response = await GetUserManagmentPaginationService({
        page: 1,
        perPage: 20,
        search: searchTerm || undefined,
      });
      setEmployeeOptions(
        response.data?.data?.map((emp: any) => ({
          id: emp.id,
          firstName: emp.firstName || '',
          firstLastName: emp.firstLastName || '',
        })) || []
      );
    } catch (error) {
      console.error('Error loading employees:', error);
      setEmployeeOptions([]);
    } finally {
      setEmployeeLoading(false);
    }
  }, []);

  return (
    <Stack spacing={2} sx={{ p: 2.5 }}>
      {/* Campo de búsqueda principal */}
      <TextField
        fullWidth
        value={filters.state.name}
        onChange={handleFilterName}
        placeholder={t('configure-evaluations.table.toolbar.search')}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
            </InputAdornment>
          ),
        }}
      />

      {/* Grid responsive para los autocompletes de filtros */}
      <Stack
        spacing={2}
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
        {/* Autocomplete para Tipo */}
        <Autocomplete
          fullWidth
          options={typeOptions}
          getOptionLabel={(option) => translateType(option.id)}
          value={typeOptions.find((opt) => opt.id === filters.state.type) || null}
          onChange={(event, newValue) => {
            filters.setState({ type: newValue?.id || '' });
            onResetPage();
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={t('configure-evaluations.table.toolbar.filterByType')}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon={"solar:document-text-bold" as any} sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
          )}
        />

        {/* Autocomplete para Estado */}
        <Autocomplete
          fullWidth
          options={statusOptions}
          getOptionLabel={(option) => translateStatus(option.id)}
          value={statusOptions.find((opt) => opt.id === filters.state.status) || null}
          onChange={(event, newValue) => {
            filters.setState({ status: newValue?.id || '' });
            onResetPage();
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={t('configure-evaluations.table.toolbar.filterByStatus')}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon={"solar:tag-bold" as any} sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
          )}
        />

        {/* Autocomplete múltiple para Departamentos */}
        <Autocomplete
          multiple
          fullWidth
          options={departmentOptions}
          loading={departmentLoading}
          getOptionLabel={(option) => option.name}
          value={departmentOptions.filter((opt) =>
            filters.state.departmentIds.split(',').filter(Boolean).includes(opt.id)
          )}
          onChange={(event, newValue) => {
            filters.setState({ departmentIds: newValue.map((v) => v.id).join(',') });
            onResetPage();
          }}
          onOpen={() => {
            if (departmentOptions.length === 0) {
              loadDepartments('');
            }
          }}
          onInputChange={(event, newInputValue) => {
            loadDepartments(newInputValue);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={t('configure-evaluations.table.toolbar.filterByDepartment')}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon={"solar:buildings-2-bold" as any} sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
          )}
        />

        {/* Autocomplete múltiple para Posiciones */}
        <Autocomplete
          multiple
          fullWidth
          options={positionOptions}
          loading={positionLoading}
          getOptionLabel={(option) => option.name}
          value={positionOptions.filter((opt) =>
            filters.state.positionIds.split(',').filter(Boolean).includes(opt.id)
          )}
          onChange={(event, newValue) => {
            filters.setState({ positionIds: newValue.map((v) => v.id).join(',') });
            onResetPage();
          }}
          onOpen={() => {
            if (positionOptions.length === 0) {
              loadPositions('');
            }
          }}
          onInputChange={(event, newInputValue) => {
            loadPositions(newInputValue);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={t('configure-evaluations.table.toolbar.filterByPosition')}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="solar:user-id-bold" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
          )}
        />

        {/* Autocomplete múltiple para Empleados */}
        <Autocomplete
          multiple
          fullWidth
          options={employeeOptions}
          loading={employeeLoading}
          getOptionLabel={(option) => `${option.firstName} ${option.firstLastName}`}
          value={employeeOptions.filter((opt) =>
            filters.state.employeeIds.split(',').filter(Boolean).includes(opt.id)
          )}
          onChange={(event, newValue) => {
            filters.setState({ employeeIds: newValue.map((v) => v.id).join(',') });
            onResetPage();
          }}
          onOpen={() => {
            if (employeeOptions.length === 0) {
              loadEmployees('');
            }
          }}
          onInputChange={(event, newInputValue) => {
            loadEmployees(newInputValue);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={t('configure-evaluations.table.toolbar.filterByEmployee')}
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
      </Stack>
    </Stack>
  );
}