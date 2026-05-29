'use client';

import type { IAiProviderSettingTableFilters } from 'src/types/ai-provider-settings';

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
  filters: IAiProviderSettingTableFilters;
  onResetPage: () => void;
  onFilters: (name: string, value: string) => void;
};

export function AiProviderSettingsTableToolbar({
  filters,
  onResetPage,
  onFilters,
}: Props) {
  const { t } = useTranslate('ai');

  const handleFilterName = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onResetPage();
      onFilters('name', event.target.value);
    },
    [onFilters, onResetPage]
  );

  const handleFilterOrder = useCallback(
    (event: any) => {
      onResetPage();
      onFilters('order', event.target.value);
    },
    [onFilters, onResetPage]
  );

  return (
    <Stack
      spacing={2}
      alignItems={{ xs: 'flex-end', md: 'center' }}
      direction={{ xs: 'column', md: 'row' }}
      sx={{ p: 2.5 }}
    >
      <TextField
        fullWidth
        value={filters.name}
        onChange={handleFilterName}
        placeholder={t('settings.table.toolbar.search')}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
            </InputAdornment>
          ),
        }}
      />

      <FormControl sx={{ minWidth: { xs: '100%', md: 240 } }}>
        <InputLabel>{t('settings.table.toolbar.sortBy')}</InputLabel>
        <Select
          value={filters.order}
          onChange={handleFilterOrder}
          label={t('settings.table.toolbar.sortBy')}
        >
          <MenuItem value="ASC">{t('settings.table.order.asc')}</MenuItem>
          <MenuItem value="DESC">{t('settings.table.order.desc')}</MenuItem>
        </Select>
      </FormControl>
    </Stack>
  );
}
