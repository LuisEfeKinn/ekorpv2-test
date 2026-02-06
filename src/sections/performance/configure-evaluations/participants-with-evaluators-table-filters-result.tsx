'use client';

import type { IParticipantWithEvaluatorsTableFilters } from 'src/types/performance';

import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { useTranslate } from 'src/locales';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

type Props = {
  filters: {
    state: IParticipantWithEvaluatorsTableFilters;
    setState: (updates: Partial<IParticipantWithEvaluatorsTableFilters>) => void;
  };
  totalResults: number;
  onResetPage: () => void;
  organizationalUnitName?: string;
  sx?: object;
};

export function ParticipantsWithEvaluatorsTableFiltersResult({
  filters,
  totalResults,
  onResetPage,
  organizationalUnitName,
  sx,
}: Props) {
  const { t } = useTranslate('performance');

  const handleRemoveSearch = useCallback(() => {
    filters.setState({ search: '' });
    onResetPage();
  }, [filters, onResetPage]);

  const handleRemoveOrganizationalUnit = useCallback(() => {
    filters.setState({ organizationalUnitId: '' });
    onResetPage();
  }, [filters, onResetPage]);

  const handleReset = useCallback(() => {
    filters.setState({
      search: '',
      organizationalUnitId: '',
    });
    onResetPage();
  }, [filters, onResetPage]);

  return (
    <FiltersResult totalResults={totalResults} onReset={handleReset} sx={sx}>
      <FiltersBlock
        label={`${t('participants-with-evaluators.table.filters.search')}:`}
        isShow={!!filters.state.search}
      >
        <Chip {...chipProps} label={filters.state.search} onDelete={handleRemoveSearch} />
      </FiltersBlock>

      <FiltersBlock
        label={`${t('participants-with-evaluators.table.filters.organizationalUnit')}:`}
        isShow={!!filters.state.organizationalUnitId}
      >
        <Chip
          {...chipProps}
          label={organizationalUnitName || filters.state.organizationalUnitId}
          onDelete={handleRemoveOrganizationalUnit}
        />
      </FiltersBlock>
    </FiltersResult>
  );
}
