import type { ChangeEvent } from 'react';

import { useCallback } from 'react';

import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  filters: {
    name: string;
    status: string;
  };
  onFilters: (name: 'name', value: string) => void;
  canReset: boolean;
  onResetFilters: () => void;
};

export function OrganizationalStructureTableToolbar({
  filters,
  onFilters,
  canReset,
  onResetFilters,
}: Props) {
  const handleFilterName = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onFilters('name', event.target.value);
    },
    [onFilters]
  );

  return (
    <Stack spacing={2} direction={{ xs: 'column', md: 'row' }} sx={{ p: 2.5 }}>
      <TextField
        fullWidth
        value={filters.name}
        onChange={handleFilterName}
        placeholder="Buscar..."
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="eva:search-fill" />
            </InputAdornment>
          ),
          endAdornment: canReset ? (
            <InputAdornment position="end">
              <IconButton onClick={onResetFilters}>
                <Iconify icon="solar:close-circle-bold" />
              </IconButton>
            </InputAdornment>
          ) : undefined,
        }}
      />
    </Stack>
  );
}
