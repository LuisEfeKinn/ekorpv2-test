import type { ICourseTableFilters } from 'src/types/settings';

import { useCallback } from 'react';

import Chip, { chipClasses } from '@mui/material/Chip';

import { useTranslate } from 'src/locales';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

type Props = {
  filters: ICourseTableFilters;
  onFilters: (name: string, value: string | boolean) => void;
  onReset?: () => void;
  totalResults: number;
  sx?: object;
};

export function CoursesTableFiltersResult({
  filters,
  onFilters,
  onReset,
  totalResults,
  sx,
}: Props) {
  const { t } = useTranslate('settings');

  const handleRemoveKeyword = useCallback(() => {
    onFilters('search', '');
  }, [onFilters]);

  const handleRemoveInactive = useCallback(() => {
    onFilters('includeInactive', false);
  }, [onFilters]);

  const handleRemoveIntegration = useCallback(() => {
    onFilters('integrationId', '');
  }, [onFilters]);

  return (
    <FiltersResult totalResults={totalResults} onReset={onReset} sx={sx}>
      <FiltersBlock
        label={`${t('courses.table.filters.keyword')}:`}
        isShow={!!filters.search}
      >
        <Chip {...chipProps} label={filters.search} onDelete={handleRemoveKeyword} />
      </FiltersBlock>

      <FiltersBlock
        label={`${t('courses.table.filters.integration')}:`}
        isShow={!!filters.integrationId}
      >
        <Chip {...chipProps} label={t('courses.table.filters.selected')} onDelete={handleRemoveIntegration} />
      </FiltersBlock>

      <FiltersBlock
        label={`${t('courses.table.filters.includeInactive')}:`}
        isShow={filters.includeInactive}
      >
        <Chip
          {...chipProps}
          label={t('courses.table.filters.showingInactive')}
          onDelete={handleRemoveInactive}
          sx={{ [`&.${chipClasses.root}`]: { textTransform: 'capitalize' } }}
        />
      </FiltersBlock>
    </FiltersResult>
  );
}
