import type { IPeriodTableFilters } from 'src/types/organization';

import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  filters: IPeriodTableFilters;
  onFilters: (name: string, value: string) => void;
  onResetFilters?: () => void;
};

export function PeriodsTableToolbar({
  filters,
  onFilters,
  onResetFilters,
}: Props) {
  const { t } = useTranslate('organization');

  const hasActiveFilters = !!filters.name;

  const handleFilterName = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFilters('name', event.target.value);
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
        }}
      >
        <TextField
          fullWidth
          value={filters.name}
          onChange={handleFilterName}
          placeholder={t('periods.table.search')}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />

        {hasActiveFilters && onResetFilters && (
          <Button
            color="error"
            variant="outlined"
            onClick={onResetFilters}
            startIcon={<Iconify icon="solar:restart-bold" />}
            sx={{ whiteSpace: 'nowrap' }}
          >
            {t('periods.table.toolbar.resetFilters')}
          </Button>
        )}
      </Box>
    </Box>
  );
}
