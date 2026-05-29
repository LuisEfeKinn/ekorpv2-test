'use client';

import type { IAiProviderSettingTableFilters } from 'src/types/ai-provider-settings';

import { useCallback } from 'react';

import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

type Props = {
  filters: IAiProviderSettingTableFilters;
  totalResults: number;
  onResetPage: () => void;
  onFilters: (name: string, value: string) => void;
  sx?: any;
};

export function AiProviderSettingsTableFiltersResult({
  filters,
  totalResults,
  onResetPage,
  onFilters,
  sx,
}: Props) {
  const { t } = useTranslate('ai');

  const handleRemoveKeyword = useCallback(() => {
    onResetPage();
    onFilters('name', '');
  }, [onFilters, onResetPage]);

  const handleRemoveOrder = useCallback(() => {
    onResetPage();
    onFilters('order', 'ASC');
  }, [onFilters, onResetPage]);

  const handleReset = useCallback(() => {
    onResetPage();
    onFilters('name', '');
    onFilters('order', 'ASC');
  }, [onFilters, onResetPage]);

  return (
    <FiltersResult totalResults={totalResults} onReset={handleReset} sx={sx}>
      <FiltersBlock label={t('settings.table.filters.keyword')} isShow={!!filters.name}>
        <Chip {...chipProps} label={filters.name} onDelete={handleRemoveKeyword} />
      </FiltersBlock>

      <FiltersBlock label={t('settings.table.filters.order')} isShow={filters.order !== 'ASC'}>
        <Chip
          {...chipProps}
          label={
            filters.order === 'DESC'
              ? t('settings.table.order.desc')
              : t('settings.table.order.asc')
          }
          onDelete={handleRemoveOrder}
        />
      </FiltersBlock>

      <Button
        color="error"
        onClick={handleReset}
        startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
      >
        {t('settings.actions.clear')}
      </Button>
    </FiltersResult>
  );
}
