import type { SxProps } from '@mui/material/styles';
import type { IState, ICategory, IEmployee, IAssetsTableFilters } from 'src/types/assets';

import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { useTranslate } from 'src/locales';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

type Props = {
  totalResults: number;
  onReset: () => void;
  filters: IAssetsTableFilters;
  onFilters: (name: string, value: string | ICategory[] | IState[] | IEmployee[] | boolean | undefined) => void;
  sx?: SxProps;
};

export function InventoryTableFiltersResult({
  filters,
  onFilters,
  onReset,
  totalResults,
  sx,
}: Props) {
  const { t } = useTranslate('assets');

  const handleRemoveCategory = useCallback(
    (categoryToRemove: ICategory) => {
      const newValue = filters.category.filter((item) => item.id !== categoryToRemove.id);
      onFilters('category', newValue);
    },
    [filters.category, onFilters]
  );

  const handleRemoveState = useCallback(
    (stateToRemove: IState) => {
      const newValue = filters.state.filter((item) => item.id !== stateToRemove.id);
      onFilters('state', newValue);
    },
    [filters.state, onFilters]
  );

  const handleRemoveEmployee = useCallback(
    (employeeToRemove: IEmployee) => {
      const newValue = filters.employee.filter((item) => item.id !== employeeToRemove.id);
      onFilters('employee', newValue);
    },
    [filters.employee, onFilters]
  );

  const handleRemoveSerial = useCallback(() => {
    onFilters('serial', '');
  }, [onFilters]);

  const handleRemoveInternalId = useCallback(() => {
    onFilters('internalId', '');
  }, [onFilters]);

  const handleRemoveHasActiveAssignment = useCallback(() => {
    onFilters('hasActiveAssignment', undefined);
  }, [onFilters]);

  // Función para formatear el nombre del empleado
  const getEmployeeDisplayName = (employee: IEmployee) => {
    const firstName = employee.firstName || '';
    const firstLastName = employee.firstLastName || '';
    return [firstName, firstLastName].filter(Boolean).join(' ').trim() || 'Sin nombre';
  };

  return (
    <FiltersResult totalResults={totalResults} onReset={onReset} sx={sx}>
      <FiltersBlock label={t('inventory.table.filters.category')} isShow={!!filters.category.length}>
        {filters.category.map((item) => (
          <Chip
            {...chipProps}
            key={item.id}
            label={item.name}
            onDelete={() => handleRemoveCategory(item)}
          />
        ))}
      </FiltersBlock>

      <FiltersBlock label={t('inventory.table.filters.state')} isShow={!!filters.state.length}>
        {filters.state.map((item) => (
          <Chip
            {...chipProps}
            key={item.id}
            label={item.name}
            onDelete={() => handleRemoveState(item)}
          />
        ))}
      </FiltersBlock>

      <FiltersBlock label={t('inventory.table.filters.employee')} isShow={!!filters.employee.length}>
        {filters.employee.map((item) => (
          <Chip
            {...chipProps}
            key={item.id}
            label={getEmployeeDisplayName(item)}
            onDelete={() => handleRemoveEmployee(item)}
          />
        ))}
      </FiltersBlock>

      <FiltersBlock label={t('inventory.table.filters.serial')} isShow={!!filters.serial}>
        <Chip {...chipProps} label={filters.serial} onDelete={handleRemoveSerial} />
      </FiltersBlock>

      <FiltersBlock label={t('inventory.table.filters.internalId')} isShow={!!filters.internalId}>
        <Chip {...chipProps} label={filters.internalId} onDelete={handleRemoveInternalId} />
      </FiltersBlock>

      <FiltersBlock label={t('inventory.table.filters.hasActiveAssignment')} isShow={filters.hasActiveAssignment !== undefined}>
        <Chip {...chipProps} label={t('inventory.table.withActiveAssignment')} onDelete={handleRemoveHasActiveAssignment} />
      </FiltersBlock>
    </FiltersResult>
  );
}