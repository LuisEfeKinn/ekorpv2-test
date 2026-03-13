import type { IVigencyTableFilters } from 'src/types/organization';

import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
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
  filters: IVigencyTableFilters;
  onFilters: (name: string, value: string) => void;
  onResetFilters?: () => void;
};

export function VigenciesTableToolbar({
  filters,
  onFilters,
  onResetFilters,
}: Props) {
  const { t } = useTranslate('organization');

  const hasActiveFilters = !!filters.isActive;

  const handleFilterName = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFilters('name', event.target.value);
    },
    [onFilters]
  );

  const handleFilterStatus = useCallback(
    (event: any) => {
      onFilters('isActive', event.target.value);
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
          md: hasActiveFilters ? '1fr 200px auto' : '1fr 200px',
        }}
      >
        <TextField
          fullWidth
          value={filters.name}
          onChange={handleFilterName}
          placeholder={t('vigencies.table.search')}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />

        <FormControl fullWidth>
          <InputLabel>{t('vigencies.table.filters.status')}</InputLabel>
          <Select
            value={filters.isActive || ''}
            onChange={handleFilterStatus}
            label={t('vigencies.table.filters.status')}
          >
            <MenuItem value="">{t('vigencies.table.filters.all')}</MenuItem>
            <MenuItem value="true">{t('vigencies.table.filters.active')}</MenuItem>
            <MenuItem value="false">{t('vigencies.table.filters.inactive')}</MenuItem>
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
            {t('vigencies.table.toolbar.resetFilters')}
          </Button>
        )}
      </Box>
    </Box>
  );
}