import type { ICatalogOption, IProjectTableFilters } from 'src/types/project-management';

import { useRef, useState, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';

import { useTranslate } from 'src/locales';
import { GetClientsPaginationService } from 'src/services/project-management/client.service';
import {
  GetProjectStatusesService,
  GetProjectImportanceLevelsService,
} from 'src/services/project-management/filters.service';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  filters: IProjectTableFilters;
  onFilters: (name: string, value: string) => void;
  onReset: () => void;
  canReset: boolean;
};

export function ProjectsToolbar({ filters, onFilters }: Props) {
  const { t } = useTranslate('project-management');

  const [clientOptions, setClientOptions] = useState<ICatalogOption[]>([]);
  const [statusOptions, setStatusOptions] = useState<ICatalogOption[]>([]);
  const [importanceOptions, setImportanceOptions] = useState<ICatalogOption[]>([]);

  const [clientLoading, setClientLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [importanceLoading, setImportanceLoading] = useState(false);

  const clientSearchTimer = useRef<ReturnType<typeof setTimeout>>();

  const loadClients = useCallback(async (search?: string) => {
    setClientLoading(true);
    try {
      const response = await GetClientsPaginationService({ page: 1, perPage: 15, search });
      setClientOptions(response.data?.data ?? response.data ?? []);
    } finally {
      setClientLoading(false);
    }
  }, []);

  const loadStatuses = useCallback(async () => {
    setStatusLoading(true);
    try {
      const response = await GetProjectStatusesService();
      setStatusOptions(response.data ?? []);
    } finally {
      setStatusLoading(false);
    }
  }, []);

  const loadImportance = useCallback(async () => {
    setImportanceLoading(true);
    try {
      const response = await GetProjectImportanceLevelsService();
      setImportanceOptions(response.data ?? []);
    } finally {
      setImportanceLoading(false);
    }
  }, []);

  return (
    <Stack direction="row" flexWrap="wrap" gap={2} alignItems="center" sx={{ flex: 1 }}>
      <TextField
        sx={{ flex: '1 1 200px' }}
        value={filters.search}
        onChange={(e) => onFilters('search', e.target.value)}
        placeholder={t('projects.table.toolbar.search')}
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
        options={clientOptions}
        loading={clientLoading}
        getOptionLabel={(o) => o.name}
        getOptionKey={(o) => o.id}
        value={clientOptions.find((o) => o.id === filters.clientId) ?? null}
        onChange={(_e, val) => onFilters('clientId', val?.id ?? '')}
        onOpen={() => { if (!clientOptions.length) loadClients(); }}
        onInputChange={(_e, value) => {
          clearTimeout(clientSearchTimer.current);
          clientSearchTimer.current = setTimeout(() => loadClients(value || undefined), 300);
        }}
        renderInput={(params) => (
          <TextField {...params} placeholder={t('projects.table.toolbar.client')} />
        )}
      />

      <Autocomplete
        sx={{ flex: '1 1 140px' }}
        options={statusOptions}
        loading={statusLoading}
        getOptionLabel={(o) => o.name}
        getOptionKey={(o) => o.id}
        value={statusOptions.find((o) => o.id === filters.statusId) ?? null}
        onChange={(_e, val) => onFilters('statusId', val?.id ?? '')}
        onOpen={() => { if (!statusOptions.length) loadStatuses(); }}
        renderInput={(params) => (
          <TextField {...params} placeholder={t('projects.table.toolbar.status')} />
        )}
      />

      <Autocomplete
        sx={{ flex: '1 1 150px' }}
        options={importanceOptions}
        loading={importanceLoading}
        getOptionLabel={(o) => o.name}
        getOptionKey={(o) => o.id}
        value={importanceOptions.find((o) => o.id === filters.importanceLevelId) ?? null}
        onChange={(_e, val) => onFilters('importanceLevelId', val?.id ?? '')}
        onOpen={() => { if (!importanceOptions.length) loadImportance(); }}
        renderInput={(params) => (
          <TextField {...params} placeholder={t('projects.table.toolbar.importanceLevel')} />
        )}
      />
    </Stack>
  );
}
