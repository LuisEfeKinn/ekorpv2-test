import type { IRewardTableFilters } from 'src/types/rewards';

import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import { GetRewardCategoryPaginationService } from 'src/services/rewards/rewardCategory.service';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  filters: IRewardTableFilters;
  onFilters: (name: string, value: string) => void;
  onResetFilters?: () => void;
};

export function RewardsTableToolbar({
  filters,
  onFilters,
  onResetFilters,
}: Props) {
  const { t } = useTranslate('rewards');

  const [categoryOptions, setCategoryOptions] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const hasActiveFilters = !!filters.categoryRewardId;

  const handleFilterName = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFilters('name', event.target.value);
    },
    [onFilters]
  );

  const loadCategories = useCallback(async (searchTerm: string = '') => {
    try {
      setLoadingCategories(true);
      const response = await GetRewardCategoryPaginationService({
        page: 1,
        perPage: 20,
        search: searchTerm,
      });
      const categories = response?.data?.data || [];
      setCategoryOptions(categories);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategoryOptions([]);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const handleCategoryChange = useCallback(
    (_event: any, newValue: any[]) => {
      const categoryIds = newValue.map((cat) => cat.id).join(',');
      onFilters('categoryRewardId', categoryIds);
    },
    [onFilters]
  );

  const handleCategoryInputChange = useCallback(
    (_event: any, newInputValue: string) => {
      loadCategories(newInputValue);
    },
    [loadCategories]
  );

  const selectedCategories = useMemo(() => {
    if (!filters.categoryRewardId) return [];
    const ids = filters.categoryRewardId.split(',').filter(Boolean);
    return categoryOptions.filter((cat) => ids.includes(cat.id));
  }, [filters.categoryRewardId, categoryOptions]);

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
          placeholder={t('rewards.table.search')}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />

        <Autocomplete
          multiple
          fullWidth
          options={categoryOptions}
          loading={loadingCategories}
          getOptionLabel={(option) => option.name || ''}
          value={selectedCategories}
          onChange={handleCategoryChange}
          onInputChange={handleCategoryInputChange}
          onOpen={() => loadCategories()}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('rewards.table.filters.categoryRewardId')}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loadingCategories ? <CircularProgress color="inherit" size={20} /> : null}
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
            {t('rewards.table.toolbar.resetFilters')}
          </Button>
        )}
      </Box>
    </Box>
  );
}