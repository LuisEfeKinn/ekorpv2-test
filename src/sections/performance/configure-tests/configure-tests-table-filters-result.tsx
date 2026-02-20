'use client';

import type { IConfigureTestTableFilters } from 'src/types/performance';

import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { useTranslate } from 'src/locales';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

type Props = {
  filters: {
    state: IConfigureTestTableFilters;
    setState: (updates: Partial<IConfigureTestTableFilters>) => void;
  };
  totalResults: number;
  onResetPage: () => void;
  sx?: object;
};

export function ConfigureTestsTableFiltersResult({
  filters,
  totalResults,
  onResetPage,
  sx,
}: Props) {
  const { t } = useTranslate('performance');

  const translateType = useCallback(
    (typeId: string) => t(`configure-evaluations.types.${typeId}`),
    [t]
  );

  const handleRemoveKeyword = useCallback(() => {
    filters.setState({ name: '' });
    onResetPage();
  }, [filters, onResetPage]);

  const handleRemoveType = useCallback(() => {
    filters.setState({ type: '' });
    onResetPage();
  }, [filters, onResetPage]);

  return (
    <FiltersResult totalResults={totalResults} onReset={() => filters.setState({ name: '', type: '' })} sx={sx}>
      <FiltersBlock label={t('configure-tests.table.filters.keyword')} isShow={!!filters.state.name}>
        <Chip {...chipProps} label={filters.state.name} onDelete={handleRemoveKeyword} />
      </FiltersBlock>

      <FiltersBlock label={t('configure-tests.table.filters.type')} isShow={!!filters.state.type}>
        <Chip
          {...chipProps}
          label={translateType(filters.state.type)}
          onDelete={handleRemoveType}
        />
      </FiltersBlock>
    </FiltersResult>
  );
}
