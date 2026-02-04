import type { IEvaluationResponseTableFilters } from 'src/types/performance';

import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  filters: IEvaluationResponseTableFilters;
  onFilters: (name: string, value: string) => void;
  onResetFilters?: () => void;
};

export function EvaluationResponsesTableToolbar({
  filters,
  onFilters,
  onResetFilters,
}: Props) {
  const { t } = useTranslate('performance');

  const hasActiveFilters = !!filters.status;

  const handleFilterSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFilters('search', event.target.value);
    },
    [onFilters]
  );

  const handleFilterStatus = useCallback(
    (event: any) => {
      onFilters('status', event.target.value);
    },
    [onFilters]
  );

  return (
    <Box sx={{ p: 2.5 }}>
      <Box
        display="grid"
        gap={2}
        gridTemplateColumns={{
          xs: '1fr',
          sm: hasActiveFilters ? '1fr auto' : '1fr',
          md: hasActiveFilters ? '1fr 300px auto' : '1fr 300px',
        }}
      >
        <TextField
          fullWidth
          value={filters.search}
          onChange={handleFilterSearch}
          placeholder={t('evaluation-responses.table.toolbar.search')}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />

        <FormControl fullWidth>
          <InputLabel>{t('evaluation-responses.table.filters.status')}</InputLabel>
          <Select
            value={filters.status}
            label={t('evaluation-responses.table.filters.status')}
            onChange={handleFilterStatus}
          >
            <MenuItem value="">
              {t('evaluation-responses.table.filters.all')}
            </MenuItem>
            <MenuItem value="PENDING">
              {t('evaluation-responses.statuses.PENDING')}
            </MenuItem>
            <MenuItem value="COMPLETED">
              {t('evaluation-responses.statuses.COMPLETED')}
            </MenuItem>
          </Select>
        </FormControl>

        {hasActiveFilters && onResetFilters && (
          <Button
            color="error"
            variant="outlined"
            onClick={onResetFilters}
            startIcon={<Iconify icon="solar:restart-bold" />}
            sx={{ whiteSpace: 'nowrap' }}
          >
            {t('evaluation-responses.table.toolbar.resetFilters')}
          </Button>
        )}
      </Box>
    </Box>
  );
}