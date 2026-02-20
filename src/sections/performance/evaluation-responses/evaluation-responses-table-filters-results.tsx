import type { IEvaluationResponseTableFilters } from 'src/types/performance';

import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { useTranslate } from 'src/locales';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

type Props = {
  filters: IEvaluationResponseTableFilters;
  onFilters: (name: string, value: string) => void;
  onReset?: () => void;
  totalResults: number;
  sx?: object;
};

export function EvaluationResponsesTableFiltersResult({ filters, onFilters, onReset, totalResults, sx }: Props) {
  const { t } = useTranslate('performance');

  const handleRemoveKeyword = useCallback(() => {
    onFilters('search', '');
  }, [onFilters]);

  const handleRemoveStatus = useCallback(() => {
    onFilters('status', '');
  }, [onFilters]);

  const statusLabels: { [key: string]: string } = {
    PENDING: t('evaluation-responses.statuses.PENDING'),
    COMPLETED: t('evaluation-responses.statuses.COMPLETED'),
  };

  return (
    <FiltersResult totalResults={totalResults} onReset={onReset} sx={sx}>
      <FiltersBlock label={`${t('evaluation-responses.table.filters.keyword')}:`} isShow={!!filters.search}>
        <Chip {...chipProps} label={filters.search} onDelete={handleRemoveKeyword} />
      </FiltersBlock>

      <FiltersBlock
        label={`${t('evaluation-responses.table.filters.status')}:`}
        isShow={!!filters.status}
      >
        <Chip
          {...chipProps}
          label={statusLabels[filters.status] || filters.status}
          onDelete={handleRemoveStatus}
        />
      </FiltersBlock>
    </FiltersResult>
  );
}