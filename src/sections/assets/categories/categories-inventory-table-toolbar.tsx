import type { ICategoriesInventoryTableFilters } from 'src/types/assets';

import { useCallback } from 'react';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  filters: ICategoriesInventoryTableFilters;
  onFilters: (name: string, value: string) => void;
  onResetFilters?: () => void;
};

export function CategoriesInventoryTableToolbar({
  filters,
  onFilters,
}: Props) {
  const { t } = useTranslate('assets');

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
          md: hasActiveFilters ? '1fr 300px auto' : '1fr 300px',
        }}
      >
        <TextField
          fullWidth
          value={filters.name}
          onChange={handleFilterName}
          placeholder={t('categories.table.search')}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>
    </Box>
  );
}