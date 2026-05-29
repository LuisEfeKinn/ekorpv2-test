import type { ICategoryTableFilters } from 'src/types/settings';

import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  filters: ICategoryTableFilters;
  onFilters: (name: string, value: string | boolean) => void;
};

export function CategoriesTableToolbar({ filters, onFilters }: Props) {
  const { t } = useTranslate('settings');

  const handleFilterSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFilters('search', event.target.value);
    },
    [onFilters]
  );

  const handleFilterInactive = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFilters('includeInactive', event.target.checked);
    },
    [onFilters]
  );

  return (
    <Stack
      spacing={2}
      alignItems={{ xs: 'flex-end', md: 'center' }}
      direction={{ xs: 'column', md: 'row' }}
      sx={{ p: 2.5 }}
    >
      <Stack direction="row" alignItems="center" spacing={2} flexGrow={1} sx={{ width: 1 }}>
        <TextField
          fullWidth
          value={filters.search}
          onChange={handleFilterSearch}
          placeholder={t('categories.table.toolbar.search')}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch checked={filters.includeInactive} onChange={handleFilterInactive} />
            }
            label={
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('categories.table.toolbar.includeInactive')}
              </Typography>
            }
          />
        </Box>
      </Stack>
    </Stack>
  );
}
