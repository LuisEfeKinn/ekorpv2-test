import type { IClientTableFilters } from 'src/types/project-management';

import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { useTranslate } from 'src/locales';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

type Props = {
  filters: IClientTableFilters;
  onFilters: (name: string, value: string) => void;
  onReset?: () => void;
  totalResults: number;
  sx?: object;
};

export function ClientsTableFiltersResult({ filters, onFilters, onReset, totalResults, sx }: Props) {
  const { t } = useTranslate('project-management');

  const activeLabel: Record<string, string> = {
    true: t('clients.table.filters.active'),
    false: t('clients.table.filters.inactive'),
  };

  const handleRemoveSearch = useCallback(() => {
    onFilters('search', '');
  }, [onFilters]);

  const handleRemoveIsActive = useCallback(() => {
    onFilters('isActive', 'all');
  }, [onFilters]);

  return (
    <FiltersResult totalResults={totalResults} onReset={onReset} sx={sx}>
      <FiltersBlock label={t('clients.table.filters.searchLabel')} isShow={!!filters.search}>
        <Chip {...chipProps} label={filters.search} onDelete={handleRemoveSearch} />
      </FiltersBlock>

      <FiltersBlock label={t('clients.table.filters.statusLabel')} isShow={filters.isActive !== 'all'}>
        <Chip
          {...chipProps}
          label={activeLabel[filters.isActive] ?? filters.isActive}
          onDelete={handleRemoveIsActive}
        />
      </FiltersBlock>
    </FiltersResult>
  );
}
