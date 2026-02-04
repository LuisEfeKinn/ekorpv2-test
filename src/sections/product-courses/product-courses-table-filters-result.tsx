import type { IProductCourseTableFilters } from 'src/types/learning';

import { useState, useEffect, useCallback } from 'react';

import Chip, { chipClasses } from '@mui/material/Chip';

import { useTranslate } from 'src/locales';
import {
  GetLearningObjectsSelectLevelsService,
  GetLearningObjectsSelectCategoriesService,
} from 'src/services/learning/learningObjects.service';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

type Props = {
  filters: IProductCourseTableFilters;
  onFilters: (name: string, value: string) => void;
  onReset?: () => void;
  totalResults: number;
  sx?: object;
};

export function ProductCoursesTableFiltersResult({ filters, onFilters, onReset, totalResults, sx }: Props) {
  const { t } = useTranslate('learning');
  
  const [categoryName, setCategoryName] = useState<string>('');
  const [levelName, setLevelName] = useState<string>('');

  // Obtener el nombre de la categoría seleccionada
  useEffect(() => {
    if (filters.categoryId) {
      GetLearningObjectsSelectCategoriesService({ page: 1, perPage: 20 })
        .then((response) => {
          const category = response.data?.data?.find((cat: any) => cat.id === filters.categoryId);
          setCategoryName(category?.name || filters.categoryId);
        })
        .catch(() => setCategoryName(filters.categoryId));
    } else {
      setCategoryName('');
    }
  }, [filters.categoryId]);

  // Obtener el nombre del nivel seleccionado
  useEffect(() => {
    if (filters.difficultyLevelId) {
      GetLearningObjectsSelectLevelsService({ page: 1, perPage: 20 })
        .then((response) => {
          const level = response.data?.data?.find((lvl: any) => lvl.id === filters.difficultyLevelId);
          setLevelName(level?.name || filters.difficultyLevelId);
        })
        .catch(() => setLevelName(filters.difficultyLevelId));
    } else {
      setLevelName('');
    }
  }, [filters.difficultyLevelId]);

  const handleRemoveKeyword = useCallback(() => {
    onFilters('name', '');
  }, [onFilters]);

  const handleRemoveStatus = useCallback(() => {
    onFilters('status', 'all');
  }, [onFilters]);

  const handleRemoveCategory = useCallback(() => {
    onFilters('categoryId', '');
  }, [onFilters]);

  const handleRemoveLevel = useCallback(() => {
    onFilters('difficultyLevelId', '');
  }, [onFilters]);

  return (
    <FiltersResult totalResults={totalResults} onReset={onReset} sx={sx}>
      <FiltersBlock label={`${t('product-courses.table.filters.status')}:`} isShow={filters.status !== 'all'}>
        <Chip
          {...chipProps}
          label={filters.status}
          onDelete={handleRemoveStatus}
          sx={{ [`&.${chipClasses.root}`]: { textTransform: 'capitalize' } }}
        />
      </FiltersBlock>

      <FiltersBlock label={`${t('product-courses.table.filters.keyword')}:`} isShow={!!filters.name}>
        <Chip {...chipProps} label={filters.name} onDelete={handleRemoveKeyword} />
      </FiltersBlock>

      <FiltersBlock label={`${t('product-courses.table.toolbar.category', 'Categoría')}:`} isShow={!!filters.categoryId}>
        <Chip {...chipProps} label={categoryName} onDelete={handleRemoveCategory} />
      </FiltersBlock>

      <FiltersBlock label={`${t('product-courses.table.toolbar.difficulty', 'Nivel')}:`} isShow={!!filters.difficultyLevelId}>
        <Chip {...chipProps} label={levelName} onDelete={handleRemoveLevel} />
      </FiltersBlock>
    </FiltersResult>
  );
}