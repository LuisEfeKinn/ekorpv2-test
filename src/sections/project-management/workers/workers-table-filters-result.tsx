import type { IWorkerTableFilters } from 'src/types/project-management';

import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { useTranslate } from 'src/locales';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

type Props = {
  filters: IWorkerTableFilters;
  onFilters: (name: string, value: string) => void;
  onReset?: () => void;
  totalResults: number;
  workerStatusName?: string;
  experienceLevelName?: string;
  employmentTypeName?: string;
  sx?: object;
};

export function WorkersTableFiltersResult({
  filters,
  onFilters,
  onReset,
  totalResults,
  workerStatusName,
  experienceLevelName,
  employmentTypeName,
  sx,
}: Props) {
  const { t } = useTranslate('project-management');

  const handleRemoveSearch = useCallback(() => onFilters('search', ''), [onFilters]);
  const handleRemoveWorkerStatus = useCallback(() => onFilters('workerStatusId', ''), [onFilters]);
  const handleRemoveExperienceLevel = useCallback(() => onFilters('experienceLevelId', ''), [onFilters]);
  const handleRemoveEmploymentType = useCallback(() => onFilters('employmentTypeId', ''), [onFilters]);

  return (
    <FiltersResult totalResults={totalResults} onReset={onReset} sx={sx}>
      <FiltersBlock label={t('workers.table.filters.searchLabel')} isShow={!!filters.search}>
        <Chip {...chipProps} label={filters.search} onDelete={handleRemoveSearch} />
      </FiltersBlock>

      <FiltersBlock label={t('workers.table.filters.workerStatusLabel')} isShow={!!filters.workerStatusId}>
        <Chip {...chipProps} label={workerStatusName ?? filters.workerStatusId} onDelete={handleRemoveWorkerStatus} />
      </FiltersBlock>

      <FiltersBlock label={t('workers.table.filters.experienceLevelLabel')} isShow={!!filters.experienceLevelId}>
        <Chip {...chipProps} label={experienceLevelName ?? filters.experienceLevelId} onDelete={handleRemoveExperienceLevel} />
      </FiltersBlock>

      <FiltersBlock label={t('workers.table.filters.employmentTypeLabel')} isShow={!!filters.employmentTypeId}>
        <Chip {...chipProps} label={employmentTypeName ?? filters.employmentTypeId} onDelete={handleRemoveEmploymentType} />
      </FiltersBlock>
    </FiltersResult>
  );
}
