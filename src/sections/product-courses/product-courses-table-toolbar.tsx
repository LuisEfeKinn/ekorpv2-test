import type { IProductCourseTableFilters } from 'src/types/learning';

import { useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  filters: IProductCourseTableFilters;
  onFilters: (name: string, value: string | boolean) => void;
};

export function ProductCoursesTableToolbar({ filters, onFilters }: Props) {
  const { t } = useTranslate('learning');

  const handleFilterSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFilters('search', event.target.value);
    },
    [onFilters]
  );

  const handleFilterIncludeInactive = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFilters('includeInactive', event.target.checked);
    },
    [onFilters]
  );

  const handleFilterOrder = useCallback(
    (event: any) => {
      onFilters('order', event.target.value as string);
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
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems="center"
        spacing={2}
        flexGrow={1}
        sx={{ width: 1 }}
      >
        <TextField
          fullWidth
          value={filters.search}
          onChange={handleFilterSearch}
          placeholder={t('product-courses.table.toolbar.search')}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />

        <FormControl sx={{ minWidth: { md: 200 } }} fullWidth>
          <InputLabel id="order-select-label">{t('product-courses.table.toolbar.order')}</InputLabel>
          <Select
            labelId="order-select-label"
            value={filters.order}
            onChange={handleFilterOrder}
            label={t('product-courses.table.toolbar.order')}
            startAdornment={
              <InputAdornment position="start">
                <Iconify icon="solar:list-bold" sx={{ color: 'text.disabled', ml: 1 }} />
              </InputAdornment>
            }
          >
            <MenuItem value="course.displayName:asc">
              {t('product-courses.table.order.nameAsc')}
            </MenuItem>
            <MenuItem value="course.displayName:desc">
              {t('product-courses.table.order.nameDesc')}
            </MenuItem>
          </Select>
        </FormControl>

        <FormControlLabel
          control={
            <Checkbox
              checked={filters.includeInactive}
              onChange={handleFilterIncludeInactive}
            />
          }
          label={t('product-courses.table.toolbar.includeInactive')}
          sx={{ minWidth: { md: 200 } }}
        />
      </Stack>
    </Stack>
  );
}