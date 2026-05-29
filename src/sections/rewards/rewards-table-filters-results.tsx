import type { IRewardTableFilters } from 'src/types/rewards';

import { useState, useEffect, useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { useTranslate } from 'src/locales';
import { GetRewardCategoryPaginationService } from 'src/services/rewards/rewardCategory.service';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

type Props = {
  filters: IRewardTableFilters;
  onFilters: (name: string, value: string) => void;
  onReset?: () => void;
  totalResults: number;
  sx?: object;
};

export function RewardTableFiltersResult({ filters, onFilters, onReset, totalResults, sx }: Props) {
  const { t } = useTranslate('rewards');

  const [categoryNames, setCategoryNames] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const loadCategoryNames = async () => {
      try {
        if (filters.categoryRewardId) {
          const response = await GetRewardCategoryPaginationService({
            page: 1,
            perPage: 100,
            search: '',
          });
          const categories = response?.data?.data || [];
          const namesMap: { [key: string]: string } = {};
          categories.forEach((cat: any) => {
            namesMap[cat.id] = cat.name;
          });
          setCategoryNames(namesMap);
        }
      } catch (error) {
        console.error('Error loading category names:', error);
      }
    };

    loadCategoryNames();
  }, [filters.categoryRewardId]);
  
  const handleRemoveKeyword = useCallback(() => {
    onFilters('name', '');
  }, [onFilters]);

  const handleRemoveCategory = useCallback(
    (categoryId: string) => {
      const currentIds = filters.categoryRewardId?.split(',').filter(Boolean) || [];
      const newIds = currentIds.filter((id) => id !== categoryId);
      onFilters('categoryRewardId', newIds.join(','));
    },
    [filters.categoryRewardId, onFilters]
  );

  const selectedCategoryIds = filters.categoryRewardId?.split(',').filter(Boolean) || [];

  return (
    <FiltersResult totalResults={totalResults} onReset={onReset} sx={sx}>
      <FiltersBlock label={`${t('rewards.table.filters.keyword')}:`} isShow={!!filters.name}>
        <Chip {...chipProps} label={filters.name} onDelete={handleRemoveKeyword} />
      </FiltersBlock>

      <FiltersBlock
        label={`${t('rewards.table.filters.categoryRewardId')}:`}
        isShow={selectedCategoryIds.length > 0}
      >
        {selectedCategoryIds.map((categoryId) => (
          <Chip
            key={categoryId}
            {...chipProps}
            label={categoryNames[categoryId] || categoryId}
            onDelete={() => handleRemoveCategory(categoryId)}
          />
        ))}
      </FiltersBlock>
    </FiltersResult>
  );
}