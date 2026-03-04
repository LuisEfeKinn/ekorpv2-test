import type { Theme, SxProps } from '@mui/material/styles';
import type { UseSetStateReturn } from 'minimal-shared/hooks';
import type { ILearningPathTableFilters } from 'src/types/learning';

import { useState, useEffect, useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { useTranslate } from 'src/locales';
import { GetPositionPaginationService } from 'src/services/learning/position.service';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

type Props = {
  totalResults: number;
  sx?: SxProps<Theme>;
  onResetPage: () => void;
  filters: UseSetStateReturn<ILearningPathTableFilters>;
};

export function LearningPathTableFiltersResult({
  filters,
  totalResults,
  onResetPage,
  sx,
}: Props) {
  const { t } = useTranslate('learning');
  const { state: currentFilters, setState: updateFilters, resetState: resetFilters } = filters;

  const [positionName, setPositionName] = useState<string>('');

  useEffect(() => {
    const loadFilterNames = async () => {
      try {
        if (currentFilters.positionId) {
          const positionResponse = await GetPositionPaginationService({
            page: 1,
            perPage: 20,
            search: '',
          });
          const positions = positionResponse?.data?.data || [];
          const position = positions.find((p: any) => p.id === currentFilters.positionId);
          setPositionName(position?.name || '');
        }
      } catch (error) {
        console.error('Error loading filter names:', error);
      }
    };

    loadFilterNames();
  }, [currentFilters.positionId]);

  const handleRemoveKeyword = useCallback(() => {
    onResetPage();
    updateFilters({ name: '' });
  }, [onResetPage, updateFilters]);

  const handleRemovePosition = useCallback(() => {
    onResetPage();
    updateFilters({ positionId: '' });
  }, [onResetPage, updateFilters]);

  const handleReset = useCallback(() => {
    onResetPage();
    resetFilters();
  }, [onResetPage, resetFilters]);

  return (
    <FiltersResult totalResults={totalResults} onReset={handleReset} sx={sx}>
      <FiltersBlock label={t('learning-paths.table.filters.keyword')} isShow={!!currentFilters.name}>
        <Chip {...chipProps} label={currentFilters.name} onDelete={handleRemoveKeyword} />
      </FiltersBlock>

      <FiltersBlock label={t('learning-paths.table.filters.positionId')} isShow={!!currentFilters.positionId}>
        <Chip {...chipProps} label={positionName} onDelete={handleRemovePosition} />
      </FiltersBlock>
    </FiltersResult>
  );
}
