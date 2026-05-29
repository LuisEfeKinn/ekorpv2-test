'use client';

import type { IConfigureEvaluationTableFilters } from 'src/types/performance';

import { useCallback } from 'react';

import Tooltip from '@mui/material/Tooltip';
import Chip, { chipClasses } from '@mui/material/Chip';

import { useTranslate } from 'src/locales';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

const TRUNCATED_CHIP_SX = {
  maxWidth: 220,
  '& .MuiChip-label': {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
};

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
    filters.setState({ departmentIds: '', departmentNames: '' });
    onResetPage();
  }, [filters, onResetPage]);

  const handleRemovePositions = useCallback(() => {
    filters.setState({ positionIds: '', positionNames: '' });
    onResetPage();
  }, [filters, onResetPage]);

  const handleRemoveEmployees = useCallback(() => {
    filters.setState({ employeeIds: '', employeeNames: '' });
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
      departmentNames: '',
      positionNames: '',
      employeeNames: '',
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
        <Tooltip title={filters.state.departmentNames || ''} placement="top">
          <Chip
            {...chipProps}
            label={
              filters.state.departmentNames ||
              `${filters.state.departmentIds.split(',').filter(Boolean).length} departamentos`
            }
            onDelete={handleRemoveDepartments}
            sx={TRUNCATED_CHIP_SX}
          />
        </Tooltip>
      </FiltersBlock>

      <FiltersBlock
        label={`${t('configure-evaluations.table.filters.position')}:`}
        isShow={!!filters.state.positionIds}
      >
        <Tooltip title={filters.state.positionNames || ''} placement="top">
          <Chip
            {...chipProps}
            label={
              filters.state.positionNames ||
              `${filters.state.positionIds.split(',').filter(Boolean).length} posiciones`
            }
            onDelete={handleRemovePositions}
            sx={TRUNCATED_CHIP_SX}
          />
        </Tooltip>
      </FiltersBlock>

      <FiltersBlock
        label={`${t('configure-evaluations.table.filters.employee')}:`}
        isShow={!!filters.state.employeeIds}
      >
        <Tooltip title={filters.state.employeeNames || ''} placement="top">
          <Chip
            {...chipProps}
            label={
              filters.state.employeeNames ||
              `${filters.state.employeeIds.split(',').filter(Boolean).length} empleados`
            }
            onDelete={handleRemoveEmployees}
            sx={TRUNCATED_CHIP_SX}
          />
        </Tooltip>
      </FiltersBlock>
    </FiltersResult>
  );
}