import type { UseSetStateReturn } from 'minimal-shared/hooks';
import type { ILearningPathTableFilters } from 'src/types/learning';

import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import { GetPositionPaginationService } from 'src/services/learning/position.service';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  filters: UseSetStateReturn<ILearningPathTableFilters>;
  onResetPage: () => void;
  onResetFilters?: () => void;
};

export function LearningPathTableToolbar({ filters, onResetPage, onResetFilters }: Props) {
  const { t } = useTranslate('learning');
  const { state: currentFilters, setState: updateFilters } = filters;

  const [positionOptions, setPositionOptions] = useState<any[]>([]);
  const [loadingPosition, setLoadingPosition] = useState(false);

  const ORDER_OPTIONS = useMemo(
    () => [
      { value: 'learningPath.name:asc', label: t('learning-paths.table.order.nameAsc') },
      { value: 'learningPath.name:desc', label: t('learning-paths.table.order.nameDesc') },
      { value: 'position.name:asc', label: t('learning-paths.table.order.positionAsc') },
      { value: 'position.name:desc', label: t('learning-paths.table.order.positionDesc') },
      { value: 'learningPath.createdAt:asc', label: t('learning-paths.table.order.createdAtAsc') },
      { value: 'learningPath.createdAt:desc', label: t('learning-paths.table.order.createdAtDesc') },
    ],
    [t]
  );

  const hasActiveFilters =
    currentFilters.order !== 'learningPath.name:asc' || !!currentFilters.positionId;

  const handleFilterName = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onResetPage();
      updateFilters({ name: event.target.value });
    },
    [onResetPage, updateFilters]
  );

  const handleFilterOrder = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onResetPage();
      updateFilters({ order: event.target.value });
    },
    [onResetPage, updateFilters]
  );

  const loadPositions = useCallback(async (searchTerm: string = '') => {
    try {
      setLoadingPosition(true);
      const response = await GetPositionPaginationService({
        page: 1,
        perPage: 20,
        search: searchTerm,
      });
      const positions = response?.data?.data || [];
      setPositionOptions(positions);
    } catch (error) {
      console.error('Error loading positions:', error);
      setPositionOptions([]);
    } finally {
      setLoadingPosition(false);
    }
  }, []);

  const handlePositionChange = useCallback(
    (_event: any, newValue: any) => {
      onResetPage();
      updateFilters({ positionId: newValue?.id || '' });
    },
    [onResetPage, updateFilters]
  );

  const handlePositionInputChange = useCallback(
    (_event: any, newInputValue: string) => {
      loadPositions(newInputValue);
    },
    [loadPositions]
  );

  return (
    <Stack
      spacing={2}
      alignItems={{ xs: 'flex-end', md: 'center' }}
      direction={{ xs: 'column', md: 'row' }}
      sx={{ p: 2.5 }}
    >
      <Box
        display="grid"
        gap={2}
        gridTemplateColumns={{
          xs: '1fr',
          sm: hasActiveFilters ? '1fr 1fr auto' : '1fr 1fr',
          md: hasActiveFilters ? '1fr 300px 300px auto' : '1fr 300px 300px',
        }}
        sx={{ width: 1 }}
      >
        <TextField
          fullWidth
          value={currentFilters.name}
          onChange={handleFilterName}
          placeholder={t('learning-paths.table.filters.search')}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          fullWidth
          select
          value={currentFilters.order || 'learningPath.name:asc'}
          onChange={handleFilterOrder}
          label={t('learning-paths.table.toolbar.sortBy')}
          sx={{
            bgcolor: hasActiveFilters && currentFilters.order !== 'learningPath.name:asc' ? 'action.selected' : 'transparent',
          }}
        >
          {ORDER_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        <Autocomplete
          fullWidth
          options={positionOptions}
          loading={loadingPosition}
          getOptionLabel={(option) => option.name || ''}
          value={positionOptions.find((p) => p.id === currentFilters.positionId) || null}
          onChange={handlePositionChange}
          onInputChange={handlePositionInputChange}
          onOpen={() => loadPositions()}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('learning-paths.table.filters.positionId')}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loadingPosition ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />

        {hasActiveFilters && onResetFilters && (
          <Button
            color="error"
            variant="outlined"
            onClick={onResetFilters}
            startIcon={<Iconify icon="solar:restart-bold" />}
            sx={{ whiteSpace: 'nowrap' }}
          >
            {t('learning-paths.table.toolbar.resetFilters')}
          </Button>
        )}
      </Box>
    </Stack>
  );
}
