import type { IUserTableFilters } from 'src/types/users';

import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { useTranslate } from 'src/locales';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

type Props = {
  filters: IUserTableFilters;
  onFilters: (name: string, value: string) => void;
  onReset?: () => void;
  totalResults: number;
  sx?: object;
};

export function UsersTableFiltersResult({ filters, onFilters, onReset, totalResults, sx }: Props) {
  const { t } = useTranslate('security');
  
  const handleRemoveKeyword = useCallback(() => {
    onFilters('name', '');
  }, [onFilters]);

  const handleRemoveStatus = useCallback(() => {
    onFilters('status', 'all');
  }, [onFilters]);

  return (
    <FiltersResult totalResults={totalResults} onReset={onReset} sx={sx}>
      <FiltersBlock label={`${t('users.table.filters.status')}:`} isShow={filters.status !== 'all'}>
        <Chip
          {...chipProps}
          label={t(`users.table.filters.${filters.status}`)}
          onDelete={handleRemoveStatus}
          sx={{ textTransform: 'capitalize' }}
        />
      </FiltersBlock>

      <FiltersBlock label={`${t('users.table.filters.keyword')}:`} isShow={!!filters.name}>
        <Chip {...chipProps} label={filters.name} onDelete={handleRemoveKeyword} />
      </FiltersBlock>
    </FiltersResult>
  );
}