'use client';

import type { IEvaluationListTableFilters } from 'src/types/performance';

import { useCallback } from 'react';

import Chip, { chipClasses } from '@mui/material/Chip';

import { useTranslate } from 'src/locales';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

type Props = {
  filters: {
    state: IEvaluationListTableFilters;
    setState: (updates: Partial<IEvaluationListTableFilters>) => void;
  };
  totalResults: number;
  onResetPage: () => void;
  sx?: object;
};

export function EvaluationsListTableFiltersResult({
  filters,
  totalResults,
  onResetPage,
  sx,
}: Props) {
  const { t } = useTranslate('performance');

  const handleRemoveKeyword = useCallback(() => {
    filters.setState({ name: '' });
    onResetPage();
  }, [filters, onResetPage]);

  const handleRemoveVigency = useCallback(() => {
    filters.setState({ vigencyId: '' });
    onResetPage();
  }, [filters, onResetPage]);

  const handleRemoveOrganizationalUnits = useCallback(() => {
    filters.setState({ organizationalUnitIds: [] });
    onResetPage();
  }, [filters, onResetPage]);

  const handleRemoveOrderDirection = useCallback(() => {
    filters.setState({ orderDirection: '' });
    onResetPage();
  }, [filters, onResetPage]);

  const handleReset = useCallback(() => {
    filters.setState({
      name: '',
      vigencyId: '',
      organizationalUnitIds: [],
      orderDirection: '',
    });
    onResetPage();
  }, [filters, onResetPage]);

  return (
    <FiltersResult totalResults={totalResults} onReset={handleReset} sx={sx}>
      <FiltersBlock
        label={`${t('evaluations-list.table.toolbar.search')}:`}
        isShow={!!filters.state.name}
      >
        <Chip {...chipProps} label={filters.state.name} onDelete={handleRemoveKeyword} />
      </FiltersBlock>

      <FiltersBlock
        label={`${t('evaluations-list.table.filters.vigency')}:`}
        isShow={!!filters.state.vigencyId}
      >
        <Chip {...chipProps} label={filters.state.vigencyId} onDelete={handleRemoveVigency} />
      </FiltersBlock>

      <FiltersBlock
        label={`${t('evaluations-list.table.filters.organizationalUnit')}:`}
        isShow={(filters.state.organizationalUnitIds?.length ?? 0) > 0}
      >
        <Chip
          {...chipProps}
          label={`${filters.state.organizationalUnitIds?.length ?? 0} unidades`}
          onDelete={handleRemoveOrganizationalUnits}
        />
      </FiltersBlock>

      <FiltersBlock
        label={`${t('evaluations-list.table.toolbar.orderDirection')}:`}
        isShow={!!filters.state.orderDirection}
      >
        <Chip
          {...chipProps}
          label={
            filters.state.orderDirection === 'ASC'
              ? t('evaluations-list.table.filters.orderAsc')
              : t('evaluations-list.table.filters.orderDesc')
          }
          onDelete={handleRemoveOrderDirection}
          sx={{ [`&.${chipClasses.root}`]: { textTransform: 'capitalize' } }}
        />
      </FiltersBlock>
    </FiltersResult>
  );
}
