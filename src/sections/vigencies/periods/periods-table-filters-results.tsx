import type { IPeriodTableFilters } from 'src/types/organization';

import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { useTranslate } from 'src/locales';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

type Props = {
  filters: IPeriodTableFilters;
  onFilters: (name: string, value: string) => void;
  onReset?: () => void;
  totalResults: number;
  sx?: object;
};

export function PeriodsTableFiltersResult({ filters, onFilters, onReset, totalResults, sx }: Props) {
  const { t } = useTranslate('organization');
  
  const handleRemoveKeyword = useCallback(() => {
    onFilters('name', '');
  }, [onFilters]);

  return (
    <FiltersResult totalResults={totalResults} onReset={onReset} sx={sx}>
      <FiltersBlock label={`${t('periods.table.filters.keyword')}:`} isShow={!!filters.name}>
        <Chip {...chipProps} label={filters.name} onDelete={handleRemoveKeyword} />
      </FiltersBlock>
    </FiltersResult>
  );
}
