import type { ICategoryTableFilters } from 'src/types/settings';

import { useCallback } from 'react';

import Chip, { chipClasses } from '@mui/material/Chip';

import { useTranslate } from 'src/locales';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

type Props = {
  filters: ICategoryTableFilters;
  onFilters: (name: string, value: string | boolean) => void;
  onReset?: () => void;
  totalResults: number;
  sx?: object;
};

export function CategoriesTableFiltersResult({
  filters,
  onFilters,
  onReset,
  totalResults,
  sx,
}: Props) {
  const { t } = useTranslate('settings');

  const handleRemoveKeyword = useCallback(() => {
    onFilters('search', '');
  }, [onFilters]);

  const handleRemoveInactive = useCallback(() => {
    onFilters('includeInactive', false);
  }, [onFilters]);

  return (
    <FiltersResult totalResults={totalResults} onReset={onReset} sx={sx}>
      <FiltersBlock
        label={`${t('categories.table.filters.keyword')}:`}
        isShow={!!filters.search}
      >
        <Chip {...chipProps} label={filters.search} onDelete={handleRemoveKeyword} />
      </FiltersBlock>

      <FiltersBlock
        label={`${t('categories.table.filters.includeInactive')}:`}
        isShow={filters.includeInactive}
      >
        <Chip
          {...chipProps}
          label={t('categories.table.filters.showingInactive')}
          onDelete={handleRemoveInactive}
          sx={{ [`&.${chipClasses.root}`]: { textTransform: 'capitalize' } }}
        />
      </FiltersBlock>
    </FiltersResult>
  );
}
