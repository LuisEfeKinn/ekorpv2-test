import type { IClientTableFilters } from 'src/types/project-management';

import { useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  filters: IClientTableFilters;
  onFilters: (name: string, value: string) => void;
};

export function ClientsTableToolbar({ filters, onFilters }: Props) {
  const { t } = useTranslate('project-management');

  const handleSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFilters('search', event.target.value);
    },
    [onFilters]
  );

  const handleIsActive = useCallback(
    (event: React.ChangeEvent<{ value: unknown }>) => {
      onFilters('isActive', event.target.value as string);
    },
    [onFilters]
  );

  return (
    <Stack
      spacing={2}
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ sm: 'center' }}
      sx={{ p: 2.5 }}
    >
      <TextField
        fullWidth
        value={filters.search}
        onChange={handleSearch}
        placeholder={t('clients.table.toolbar.search')}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
            </InputAdornment>
          ),
        }}
      />

      <FormControl sx={{ minWidth: 160 }}>
        <InputLabel>{t('clients.table.toolbar.statusLabel')}</InputLabel>
        <Select
          value={filters.isActive}
          label={t('clients.table.toolbar.statusLabel')}
          onChange={handleIsActive as any}
        >
          <MenuItem value="all">{t('clients.table.filters.all')}</MenuItem>
          <MenuItem value="true">{t('clients.table.filters.active')}</MenuItem>
          <MenuItem value="false">{t('clients.table.filters.inactive')}</MenuItem>
        </Select>
      </FormControl>
    </Stack>
  );
}
