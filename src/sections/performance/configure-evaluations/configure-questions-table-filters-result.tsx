'use client';

import type { IQuestionTableFilters } from 'src/types/performance';

import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { useTranslate } from 'src/locales';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

type Props = {
  filters: {
    state: IQuestionTableFilters;
    setState: (updates: Partial<IQuestionTableFilters>) => void;
  };
  totalResults: number;
  onResetPage: () => void;
  sx?: object;
};

export function ConfigureQuestionsTableFiltersResult({
  filters,
  totalResults,
  onResetPage,
  sx,
}: Props) {
  const { t } = useTranslate('performance');

  const handleRemoveKeyword = useCallback(() => {
    filters.setState({ search: '' });
    onResetPage();
  }, [filters, onResetPage]);

  const handleReset = useCallback(() => {
    filters.setState({
      search: '',
    });
    onResetPage();
  }, [filters, onResetPage]);

  return (
    <FiltersResult totalResults={totalResults} onReset={handleReset} sx={sx}>
      <FiltersBlock
        label={`${t('questions.table.filters.keyword')}:`}
        isShow={!!filters.state.search}
      >
        <Chip {...chipProps} label={filters.state.search} onDelete={handleRemoveKeyword} />
      </FiltersBlock>
    </FiltersResult>
  );
}
