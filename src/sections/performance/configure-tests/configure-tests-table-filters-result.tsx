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

  const handleRemoveIsActive = useCallback(() => {
    filters.setState({ isActive: '' });
    onResetPage();
  }, [filters, onResetPage]);

  const isActiveLabel = filters.state.isActive === true
    ? t('configure-tests.table.filters.statusActive')
    : t('configure-tests.table.filters.statusInactive');

  return (
    <FiltersResult totalResults={totalResults} onReset={() => { filters.setState({ name: '', type: '', isActive: '' }); onResetPage(); }} sx={sx}>
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

      <FiltersBlock label={t('configure-tests.table.filters.status')} isShow={filters.state.isActive !== ''}>
        <Chip {...chipProps} label={isActiveLabel} onDelete={handleRemoveIsActive} />
      </FiltersBlock>
    </FiltersResult>
  );
}
