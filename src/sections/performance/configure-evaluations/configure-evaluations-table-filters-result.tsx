'use client';

import type { IConfigureEvaluationTableFilters } from 'src/types/performance';

import { useCallback } from 'react';

import Chip, { chipClasses } from '@mui/material/Chip';

import { useTranslate } from 'src/locales';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

type Props = {
  filters: {
    state: IConfigureEvaluationTableFilters;
    setState: (updates: Partial<IConfigureEvaluationTableFilters>) => void;
  };
  totalResults: number;
  onResetPage: () => void;
  sx?: object;
};

export function ConfigureEvaluationsTableFiltersResult({
  filters,
  totalResults,
  onResetPage,
  sx,
}: Props) {
  const { t } = useTranslate('performance');

  // Helper functions for translations
  const translateType = useCallback(
    (typeId: string) => t(`configure-evaluations.types.${typeId}`),
    [t]
  );

  const translateStatus = useCallback(
    (statusId: string) => t(`configure-evaluations.statuses.${statusId}`),
    [t]
  );

  const handleRemoveKeyword = useCallback(() => {
    filters.setState({ name: '' });
    onResetPage();
  }, [filters, onResetPage]);

  const handleRemoveType = useCallback(() => {
    filters.setState({ type: '' });
    onResetPage();
  }, [filters, onResetPage]);

  const handleRemoveStatus = useCallback(() => {
    filters.setState({ status: '' });
    onResetPage();
  }, [filters, onResetPage]);

  const handleRemoveDepartments = useCallback(() => {
    filters.setState({ departmentIds: '' });
    onResetPage();
  }, [filters, onResetPage]);

  const handleRemovePositions = useCallback(() => {
    filters.setState({ positionIds: '' });
    onResetPage();
  }, [filters, onResetPage]);

  const handleRemoveEmployees = useCallback(() => {
    filters.setState({ employeeIds: '' });
    onResetPage();
  }, [filters, onResetPage]);

  const handleReset = useCallback(() => {
    filters.setState({
      name: '',
      type: '',
      status: '',
      departmentIds: '',
      positionIds: '',
      employeeIds: '',
    });
    onResetPage();
  }, [filters, onResetPage]);

  return (
    <FiltersResult totalResults={totalResults} onReset={handleReset} sx={sx}>
      <FiltersBlock
        label={`${t('configure-evaluations.table.filters.keyword')}:`}
        isShow={!!filters.state.name}
      >
        <Chip {...chipProps} label={filters.state.name} onDelete={handleRemoveKeyword} />
      </FiltersBlock>

      <FiltersBlock
        label={`${t('configure-evaluations.table.filters.type')}:`}
        isShow={!!filters.state.type}
      >
        <Chip {...chipProps} label={translateType(filters.state.type)} onDelete={handleRemoveType} />
      </FiltersBlock>

      <FiltersBlock
        label={`${t('configure-evaluations.table.filters.status')}:`}
        isShow={!!filters.state.status}
      >
        <Chip
          {...chipProps}
          label={translateStatus(filters.state.status)}
          onDelete={handleRemoveStatus}
          sx={{ [`&.${chipClasses.root}`]: { textTransform: 'capitalize' } }}
        />
      </FiltersBlock>

      <FiltersBlock
        label={`${t('configure-evaluations.table.filters.department')}:`}
        isShow={!!filters.state.departmentIds}
      >
        <Chip
          {...chipProps}
          label={`${filters.state.departmentIds.split(',').filter(Boolean).length} departamentos`}
          onDelete={handleRemoveDepartments}
        />
      </FiltersBlock>

      <FiltersBlock
        label={`${t('configure-evaluations.table.filters.position')}:`}
        isShow={!!filters.state.positionIds}
      >
        <Chip
          {...chipProps}
          label={`${filters.state.positionIds.split(',').filter(Boolean).length} posiciones`}
          onDelete={handleRemovePositions}
        />
      </FiltersBlock>

      <FiltersBlock
        label={`${t('configure-evaluations.table.filters.employee')}:`}
        isShow={!!filters.state.employeeIds}
      >
        <Chip
          {...chipProps}
          label={`${filters.state.employeeIds.split(',').filter(Boolean).length} empleados`}
          onDelete={handleRemoveEmployees}
        />
      </FiltersBlock>
    </FiltersResult>
  );
}