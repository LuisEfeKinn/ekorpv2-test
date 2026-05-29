import { useCallback } from 'react';

import Chip, { chipClasses } from '@mui/material/Chip';

import { useTranslate } from 'src/locales';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

type Props = {
  filters: any;
  onFilters: (name: string, value: string) => void;
  typeLabel?: string | null;
  onClearType?: () => void;
  onReset?: () => void;
  totalResults: number;
  sx?: object;
};

export function RiskFiltersResult({ filters, onFilters, typeLabel, onClearType, onReset, totalResults, sx }: Props) {
  const { t } = useTranslate('architecture');
  const { t: tCommon } = useTranslate('common');
  
  const handleRemoveKeyword = useCallback(() => {
    onFilters('name', '');
  }, [onFilters]);

  const handleRemoveStatus = useCallback(() => {
    onFilters('status', 'all');
  }, [onFilters]);

  return (
    <FiltersResult totalResults={totalResults} onReset={onReset} sx={sx}>
      <FiltersBlock label={t('risk.table.table.filters.status')} isShow={filters.status !== 'all'}>
        <Chip
          {...chipProps}
          label={filters.status}
          onDelete={handleRemoveStatus}
          sx={{ [`&.${chipClasses.root}`]: { textTransform: 'capitalize' } }}
        />
      </FiltersBlock>

      <FiltersBlock label={`${t('risk.table.table.filters.keyword')}:`} isShow={!!filters.name}>
        <Chip {...chipProps} label={filters.name} onDelete={handleRemoveKeyword} />
      </FiltersBlock>

      <FiltersBlock label={`${tCommon('filters.type')}:`} isShow={Boolean(typeLabel)}>
        <Chip {...chipProps} label={typeLabel ?? ''} onDelete={onClearType} />
      </FiltersBlock>
    </FiltersResult>
  );
}
