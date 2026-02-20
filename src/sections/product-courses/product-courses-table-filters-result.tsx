import type { IProductCourseTableFilters } from 'src/types/learning';

import { useCallback } from 'react';

import Chip, { chipClasses } from '@mui/material/Chip';

import { useTranslate } from 'src/locales';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

type Props = {
  filters: IProductCourseTableFilters;
  onFilters: (name: string, value: string | boolean | null | undefined) => void;
  onReset?: () => void;
  totalResults: number;
  sx?: object;
};

export function ProductCoursesTableFiltersResult({ filters, onFilters, onReset, totalResults, sx }: Props) {
  const { t } = useTranslate('learning');

  const handleRemoveKeyword = useCallback(() => {
    onFilters('search', '');
  }, [onFilters]);

  const handleRemoveIncludeInactive = useCallback(() => {
    onFilters('includeInactive', false);
  }, [onFilters]);

  const handleRemoveOrder = useCallback(() => {
    onFilters('order', 'course.displayName:asc');
  }, [onFilters]);

  const handleRemoveInstance = useCallback(() => {
    onFilters('instanceId', null);
    onFilters('instanceName', undefined);
  }, [onFilters]);

  const getOrderLabel = (order: string) => {
    if (order === 'course.displayName:asc') {
      return t('product-courses.table.order.nameAsc');
    }
    if (order === 'course.displayName:desc') {
      return t('product-courses.table.order.nameDesc');
    }
    return order;
  };

  return (
    <FiltersResult totalResults={totalResults} onReset={onReset} sx={sx}>
      <FiltersBlock label={`${t('product-courses.table.filters.keyword')}:`} isShow={!!filters.search}>
        <Chip {...chipProps} label={filters.search} onDelete={handleRemoveKeyword} />
      </FiltersBlock>

      <FiltersBlock 
        label={`${t('product-courses.table.filters.order')}:`} 
        isShow={filters.order !== 'course.displayName:asc'}
      >
        <Chip 
          {...chipProps} 
          label={getOrderLabel(filters.order)} 
          onDelete={handleRemoveOrder}
          sx={{ [`&.${chipClasses.root}`]: { textTransform: 'capitalize' } }}
        />
      </FiltersBlock>

      <FiltersBlock 
        label={`${t('product-courses.table.filters.includeInactive')}:`} 
        isShow={filters.includeInactive}
      >
        <Chip 
          {...chipProps} 
          label={t('product-courses.table.filters.includeInactiveLabel')} 
          onDelete={handleRemoveIncludeInactive}
        />
      </FiltersBlock>

      <FiltersBlock 
        label={`${t('product-courses.table.filters.instance')}:`} 
        isShow={!!filters.instanceId}
      >
        <Chip 
          {...chipProps} 
          label={filters.instanceName || filters.instanceId || ''} 
          onDelete={handleRemoveInstance}
        />
      </FiltersBlock>
    </FiltersResult>
  );
}