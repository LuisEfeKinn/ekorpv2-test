'use client';

import type { Theme, SxProps } from '@mui/material/styles';
import type {
  ICategory,
  IAssetsItem,
  IUserManagementEmployee,
  IAssetRecordTableFilters,
  IAssetRecordTableFilterValue,
} from 'src/types/assets';

import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  filters: IAssetRecordTableFilters;
  onFilters: (name: string, value: IAssetRecordTableFilterValue) => void;
  onResetFilters: VoidFunction;
  results: number;
  sx?: SxProps<Theme>;
};

export function AssetRecordTableFiltersResult({
  filters,
  onFilters,
  onResetFilters,
  results,
  sx,
}: Props) {
  const { t } = useTranslate('assets');

  const handleRemoveAsset = useCallback(
    (assetToRemove: IAssetsItem) => {
      const newValue = filters.assetId.filter((item) => item.id !== assetToRemove.id);
      onFilters('assetId', newValue);
    },
    [filters.assetId, onFilters]
  );

  const handleRemoveType = useCallback(
    (inputValue: string) => {
      const newValue = filters.type.filter((item) => item !== inputValue);
      onFilters('type', newValue);
    },
    [filters.type, onFilters]
  );

  const handleRemoveCategory = useCallback(
    (categoryToRemove: ICategory) => {
      const newValue = filters.category.filter((item) => item.id !== categoryToRemove.id);
      onFilters('category', newValue);
    },
    [filters.category, onFilters]
  );

  const handleRemoveFromDate = useCallback(() => {
    onFilters('fromDate', '');
  }, [onFilters]);

  const handleRemoveToDate = useCallback(() => {
    onFilters('toDate', '');
  }, [onFilters]);

  const handleRemovePerformedBy = useCallback(
    (employeeToRemove: IUserManagementEmployee) => {
      const newValue = filters.performedById.filter((item) => item.id !== employeeToRemove.id);
      onFilters('performedById', newValue);
    },
    [filters.performedById, onFilters]
  );

  const handleRemoveTargetEmployee = useCallback(
    (employeeToRemove: IUserManagementEmployee) => {
      const newValue = filters.targetEmployeeId.filter((item) => item.id !== employeeToRemove.id);
      onFilters('targetEmployeeId', newValue);
    },
    [filters.targetEmployeeId, onFilters]
  );

  return (
    <Stack spacing={1.5} sx={{ ...sx }}>
      <Box sx={{ typography: 'body2' }}>
        <strong>{results}</strong>
        <Box component="span" sx={{ color: 'text.secondary', ml: 0.25 }}>
          {t('record.table.noRecords')}
        </Box>
      </Box>

      <Stack flexGrow={1} spacing={1} direction="row" flexWrap="wrap" alignItems="center">
        {!!filters.assetId.length && (
          <>
            {filters.assetId.map((item) => (
              <Chip
                key={item.id}
                label={item.name}
                size="small"
                onDelete={() => handleRemoveAsset(item)}
              />
            ))}
          </>
        )}

        {!!filters.type.length && (
          <>
            {filters.type.map((item) => (
              <Chip
                key={item}
                label={t(`record.types.${item}`)}
                size="small"
                onDelete={() => handleRemoveType(item)}
              />
            ))}
          </>
        )}

        {!!filters.category.length && (
          <>
            {filters.category.map((item) => (
              <Chip
                key={item.id}
                label={item.name}
                size="small"
                onDelete={() => handleRemoveCategory(item)}
              />
            ))}
          </>
        )}

        {filters.fromDate && (
          <Chip
            label={`${t('record.table.filterByFromDate')}: ${filters.fromDate}`}
            size="small"
            onDelete={handleRemoveFromDate}
          />
        )}

        {filters.toDate && (
          <Chip
            label={`${t('record.table.filterByToDate')}: ${filters.toDate}`}
            size="small"
            onDelete={handleRemoveToDate}
          />
        )}

        {!!filters.performedById.length && (
          <>
            {filters.performedById.map((item) => (
              <Chip
                key={item.id}
                label={`${item.firstName} ${item.firstLastName}`.trim() || item.email}
                size="small"
                onDelete={() => handleRemovePerformedBy(item)}
              />
            ))}
          </>
        )}

        {!!filters.targetEmployeeId.length && (
          <>
            {filters.targetEmployeeId.map((item) => (
              <Chip
                key={item.id}
                label={`${item.firstName} ${item.firstLastName}`.trim() || item.email}
                size="small"
                onDelete={() => handleRemoveTargetEmployee(item)}
              />
            ))}
          </>
        )}

        <Button
          color="error"
          onClick={onResetFilters}
          startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
        >
          {t('categories.table.toolbar.resetFilters')}
        </Button>
      </Stack>
    </Stack>
  );
}
