import type { ICatalogOption , IWorkerTableFilters } from 'src/types/project-management';

import { useRef, useState, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';

import { useTranslate } from 'src/locales';
import {
  GetWorkerStatusesService,
  GetExperienceLevelsService,
  GetEmploymentTypesForFilterService,
} from 'src/services/project-management/filters.service';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  filters: IWorkerTableFilters;
  onFilters: (name: string, value: string, option?: ICatalogOption) => void;
};

export function WorkersTableToolbar({ filters, onFilters }: Props) {
  const { t } = useTranslate('project-management');

  const [workerStatusOptions, setWorkerStatusOptions] = useState<ICatalogOption[]>([]);
  const [experienceLevelOptions, setExperienceLevelOptions] = useState<ICatalogOption[]>([]);
  const [employmentTypeOptions, setEmploymentTypeOptions] = useState<ICatalogOption[]>([]);

  const [workerStatusLoading, setWorkerStatusLoading] = useState(false);
  const [experienceLevelLoading, setExperienceLevelLoading] = useState(false);
  const [employmentTypeLoading, setEmploymentTypeLoading] = useState(false);

  const empTypeSearchTimer = useRef<ReturnType<typeof setTimeout>>();

  const loadWorkerStatuses = useCallback(async () => {
    setWorkerStatusLoading(true);
    try {
      const response = await GetWorkerStatusesService();
      setWorkerStatusOptions(response.data ?? []);
    } finally {
      setWorkerStatusLoading(false);
    }
  }, []);

  const loadExperienceLevels = useCallback(async () => {
    setExperienceLevelLoading(true);
    try {
      const response = await GetExperienceLevelsService();
      setExperienceLevelOptions(response.data ?? []);
    } finally {
      setExperienceLevelLoading(false);
    }
  }, []);

  const loadEmploymentTypes = useCallback(async (search?: string) => {
    setEmploymentTypeLoading(true);
    try {
      const response = await GetEmploymentTypesForFilterService({ page: 1, perPage: 15, search });
      setEmploymentTypeOptions(response.data?.data ?? response.data ?? []);
    } finally {
      setEmploymentTypeLoading(false);
    }
  }, []);

  return (
    <Stack direction="row" flexWrap="wrap" gap={2} alignItems="center" sx={{ p: 2.5 }}>
      <TextField
        sx={{ flex: '1 1 200px' }}
        value={filters.search}
        onChange={(e) => onFilters('search', e.target.value)}
        placeholder={t('workers.table.toolbar.search')}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
            </InputAdornment>
          ),
        }}
      />

      <Autocomplete
        sx={{ flex: '1 1 160px' }}
        options={workerStatusOptions}
        loading={workerStatusLoading}
        getOptionLabel={(o) => o.name}
        getOptionKey={(o) => o.id}
        value={workerStatusOptions.find((o) => o.id === filters.workerStatusId) ?? null}
        onChange={(_e, val) => onFilters('workerStatusId', val?.id ?? '', val ?? undefined)}
        onOpen={() => { if (!workerStatusOptions.length) loadWorkerStatuses(); }}
        renderInput={(params) => (
          <TextField {...params} placeholder={t('workers.table.toolbar.workerStatus')} />
        )}
      />

      <Autocomplete
        sx={{ flex: '1 1 160px' }}
        options={experienceLevelOptions}
        loading={experienceLevelLoading}
        getOptionLabel={(o) => o.name}
        getOptionKey={(o) => o.id}
        value={experienceLevelOptions.find((o) => o.id === filters.experienceLevelId) ?? null}
        onChange={(_e, val) => onFilters('experienceLevelId', val?.id ?? '', val ?? undefined)}
        onOpen={() => { if (!experienceLevelOptions.length) loadExperienceLevels(); }}
        renderInput={(params) => (
          <TextField {...params} placeholder={t('workers.table.toolbar.experienceLevel')} />
        )}
      />

      <Autocomplete
        sx={{ flex: '1 1 160px' }}
        options={employmentTypeOptions}
        loading={employmentTypeLoading}
        getOptionLabel={(o) => o.name}
        getOptionKey={(o) => o.id}
        value={employmentTypeOptions.find((o) => o.id === filters.employmentTypeId) ?? null}
        onChange={(_e, val) => onFilters('employmentTypeId', val?.id ?? '', val ?? undefined)}
        onOpen={() => { if (!employmentTypeOptions.length) loadEmploymentTypes(); }}
        onInputChange={(_e, value) => {
          clearTimeout(empTypeSearchTimer.current);
          empTypeSearchTimer.current = setTimeout(() => loadEmploymentTypes(value || undefined), 300);
        }}
        renderInput={(params) => (
          <TextField {...params} placeholder={t('workers.table.toolbar.employmentType')} />
        )}
      />
    </Stack>
  );
}
