import type { ILearningObjectTableFilters } from 'src/types/learning';

import { useMemo, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  filters: ILearningObjectTableFilters;
  onFilters: (name: string, value: string) => void;
  onResetFilters?: () => void;
};

export function LearningObjectTableToolbar({ filters, onFilters, onResetFilters }: Props) {
  const { t } = useTranslate('learning');
  
  const ORDER_OPTIONS = useMemo(() => [
    { value: 'learningObject.name:asc', label: t('learning-objects.table.order.nameAsc') },
    { value: 'learningObject.name:desc', label: t('learning-objects.table.order.nameDesc') },
    { value: 'learningObject.order:asc', label: t('learning-objects.table.order.orderAsc') },
    { value: 'learningObject.order:desc', label: t('learning-objects.table.order.orderDesc') },
    { value: 'learningObject.createdAt:asc', label: t('learning-objects.table.order.createdAtAsc') },
    { value: 'learningObject.createdAt:desc', label: t('learning-objects.table.order.createdAtDesc') },
  ], [t]);

  // Verificar si hay filtros activos (diferentes a los valores por defecto)
  const hasActiveFilters = filters.order !== 'learningObject.name:asc';

  const handleFilterName = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFilters('name', event.target.value);
    },
    [onFilters]
  );

  const handleFilterOrder = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFilters('order', event.target.value);
    },
    [onFilters]
  );

  return (
    <Stack spacing={2} sx={{ p: 2.5 }}>
      {/* Grid responsive para búsqueda, ordenamiento y botón de reset */}
      <Stack
        spacing={2}
        direction={{ xs: 'column', sm: 'row' }}
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr', // Móvil: 1 columna
            sm: hasActiveFilters ? '1fr 300px auto' : '1fr 300px', // Con filtros activos: agregar columna para botón
          },
          gap: 2,
          alignItems: 'center',
        }}
      >
        {/* Campo de búsqueda */}
        <TextField
          fullWidth
          value={filters.name}
          onChange={handleFilterName}
          placeholder={t('learning-objects.table.toolbar.search')}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />

        {/* Selector de ordenamiento */}
        <TextField
          select
          fullWidth
          value={filters.order || 'learningObject.name:asc'}
          onChange={handleFilterOrder}
          label={t('learning-objects.table.toolbar.sortBy')}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon={"solar:sort-vertical-bold" as any} sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            bgcolor: hasActiveFilters ? 'action.selected' : 'transparent',
            transition: 'background-color 0.3s',
          }}
        >
          {ORDER_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        {/* Botón de reset - solo visible cuando hay filtros activos */}
        {hasActiveFilters && onResetFilters && (
          <Button
            color="error"
            variant="outlined"
            onClick={onResetFilters}
            startIcon={<Iconify icon="solar:restart-bold" />}
            sx={{
              whiteSpace: 'nowrap',
              minWidth: 'fit-content',
            }}
          >
            {t('learning-objects.actions.clear')}
          </Button>
        )}
      </Stack>
    </Stack>
  );
}