'use client';

import type { ICampaignParticipantTableFilters } from 'src/types/performance';

import { useCallback } from 'react';

import Chip, { chipClasses } from '@mui/material/Chip';

import { useTranslate } from 'src/locales';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

type Props = {
  filters: {
    state: ICampaignParticipantTableFilters;
    setState: (updates: Partial<ICampaignParticipantTableFilters>) => void;
  };
  totalResults: number;
  onResetPage: () => void;
  sx?: object;
};

export function ParticipantsTableFiltersResult({
  filters,
  totalResults,
  onResetPage,
  sx,
}: Props) {
  const { t } = useTranslate('performance');

  // Helper function for translations
  const translateStatus = useCallback(
    (statusId: string) => t(`campaign-participants.statuses.${statusId}`),
    [t]
  );

  const handleRemoveSearch = useCallback(() => {
    filters.setState({ search: '' });
    onResetPage();
  }, [filters, onResetPage]);

  const handleRemoveStatus = useCallback(() => {
    filters.setState({ status: '' });
    onResetPage();
  }, [filters, onResetPage]);

  const handleReset = useCallback(() => {
    filters.setState({
      search: '',
      status: '',
    });
    onResetPage();
  }, [filters, onResetPage]);

  return (
    <FiltersResult totalResults={totalResults} onReset={handleReset} sx={sx}>
      <FiltersBlock
        label={`${t('campaign-participants.table.filters.search')}:`}
        isShow={!!filters.state.search}
      >
        <Chip {...chipProps} label={filters.state.search} onDelete={handleRemoveSearch} />
      </FiltersBlock>

      <FiltersBlock
        label={`${t('campaign-participants.table.filters.status')}:`}
        isShow={!!filters.state.status}
      >
        <Chip
          {...chipProps}
          label={translateStatus(filters.state.status)}
          onDelete={handleRemoveStatus}
          sx={{ [`&.${chipClasses.root}`]: { textTransform: 'capitalize' } }}
        />
      </FiltersBlock>
    </FiltersResult>
  );
}