'use client';

import type { IQuestionTableFilters } from 'src/types/performance';

import { useCallback } from 'react';

import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  filters: {
    state: IQuestionTableFilters;
    setState: (updates: Partial<IQuestionTableFilters>) => void;
  };
  onResetPage: () => void;
};

export function ConfigureQuestionsTableToolbar({ filters, onResetPage }: Props) {
  const { t } = useTranslate('performance');

  const handleFilterSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      filters.setState({ search: event.target.value });
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
          value={filters.state.search}
          onChange={handleFilterSearch}
          placeholder={t('questions.table.toolbar.search')}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />
      </Stack>
    </Stack>
  );
}
