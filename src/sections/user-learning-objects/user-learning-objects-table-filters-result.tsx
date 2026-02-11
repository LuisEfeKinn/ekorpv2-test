import type { ILearningObjectTableFilters } from 'src/types/learning';

import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { useTranslate } from 'src/locales';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

interface ILearningPath {
  id: string;
  name: string;
}

type Props = {
  filters: ILearningObjectTableFilters;
  onFilters: (name: string, value: string | null) => void;
  onReset?: () => void;
  totalResults: number;
  sx?: object;
  learningPaths?: ILearningPath[];
};

export function LearningObjectTableFiltersResult({ 
  filters, 
  onFilters, 
  onReset, 
  totalResults, 
  sx,
  learningPaths = []
}: Props) {
  const { t } = useTranslate('learning');
  
  const handleRemoveKeyword = useCallback(() => {
    onFilters('name', '');
  }, [onFilters]);

  const handleRemoveLearningPath = useCallback(() => {
    onFilters('learningPathId', null);
  }, [onFilters]);

  const selectedLearningPath = learningPaths.find(lp => lp.id === filters.learningPathId);

  return (
    <FiltersResult totalResults={totalResults} onReset={onReset} sx={sx}>
      <FiltersBlock label={`${t('learning-objects.table.filters.keyword')}:`} isShow={!!filters.name}>
        <Chip {...chipProps} label={filters.name} onDelete={handleRemoveKeyword} />
      </FiltersBlock>

      <FiltersBlock 
        label={`${t('learning-objects.table.filters.learningPath') || 'Ruta de aprendizaje'}:`} 
        isShow={!!selectedLearningPath}
      >
        <Chip 
          {...chipProps} 
          label={selectedLearningPath?.name} 
          onDelete={handleRemoveLearningPath} 
        />
      </FiltersBlock>
    </FiltersResult>
  );
}