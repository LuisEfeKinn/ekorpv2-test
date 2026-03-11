import type { IUserTableFilters } from 'src/types/users';

import { useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  filters: IUserTableFilters;
  onFilters: (name: string, value: any) => void;
  roleOptions: Array<{ id: string; name: string }>;
};

export function UsersTableToolbar({ filters, onFilters, roleOptions }: Props) {
  const { t } = useTranslate('security');

  const handleFilterName = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFilters('name', event.target.value);
    },
    [onFilters]
  );

  const handleFilterRole = useCallback(
    (event: any) => {
      const value = typeof event.target.value === 'string'
        ? event.target.value.split(',')
        : event.target.value;
      onFilters('role', value);
    },
    [onFilters]
  );

  return (
    <Stack
      spacing={2}
      alignItems={{ xs: 'flex-end', md: 'center' }}
      direction={{ xs: 'column', md: 'row' }}
      sx={{ p: 2.5, pr: { xs: 2.5, md: 1 } }}
    >
      <FormControl sx={{ minWidth: 200 }}>
        <InputLabel id="filter-role-label">{t('users.table.columns.roles')}</InputLabel>
        <Select
          labelId="filter-role-label"
          multiple
          value={filters.role}
          onChange={handleFilterRole}
          label={t('users.table.columns.roles')}
          renderValue={(selected) =>
            roleOptions
              .filter((option) => selected.includes(option.id))
              .map((option) => option.name)
              .join(', ')
          }
        >
          {roleOptions.map((option) => (
            <MenuItem key={option.id} value={option.id}>
              <Checkbox checked={filters.role.includes(option.id)} />
              {option.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        fullWidth
        value={filters.name}
        onChange={handleFilterName}
        placeholder={t('users.table.filters.search')}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          },
        }}
      />
    </Stack>
  );
}