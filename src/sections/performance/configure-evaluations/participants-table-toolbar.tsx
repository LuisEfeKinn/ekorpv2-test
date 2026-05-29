'use client';

import type { ICampaignParticipantTableFilters } from 'src/types/performance';

import { useState, useEffect, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';

import { useTranslate } from 'src/locales';
import { GetPerformanceRelatedDataService } from 'src/services/performance/related-data.service';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  filters: {
    state: ICampaignParticipantTableFilters;
    setState: (updates: Partial<ICampaignParticipantTableFilters>) => void;
  };
  onResetPage: () => void;
};

type StatusOption = { id: string; name: string };

export function ParticipantsTableToolbar({ filters, onResetPage }: Props) {
  const { t } = useTranslate('performance');

  // Helper function for translations
  const translateStatus = useCallback(
    (statusId: string) => t(`campaign-participants.statuses.${statusId}`),
    [t]
  );

  // Estado para las opciones de status
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);

  // Cargar estados desde GetPerformanceRelatedDataService
  useEffect(() => {
    const loadRelatedData = async () => {
      try {
        const response = await GetPerformanceRelatedDataService({});
        if (response.data?.statusCode === 200 && response.data?.data) {
          setStatusOptions(
            response.data.data.participantStatuses?.map((status: any) => ({
              id: status.value,
              name: status.value,
            })) || []
          );
        }
      } catch (error) {
        console.error('Error loading related data:', error);
      }
    };
    loadRelatedData();
  }, []);

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
        placeholder={t('campaign-participants.table.toolbar.search')}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
            </InputAdornment>
          ),
        }}
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
            placeholder={t('campaign-participants.table.toolbar.filterByStatus')}
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
    </Stack>
  );
}