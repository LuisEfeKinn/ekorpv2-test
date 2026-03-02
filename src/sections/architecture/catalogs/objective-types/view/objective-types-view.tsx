'use client';

import type { TableHeadCellProps } from 'src/components/table';
import type { ObjectiveType } from 'src/types/architecture/catalogs/objective-types';

import { varAlpha } from 'minimal-shared/utils';
import { useBoolean, useSetState } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  DeleteObjectiveTypeService,
  GetObjectiveTypesPaginationService
} from 'src/services/architecture/catalogs/objectiveTypes.service';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  TableNoData,
  getComparator,
  TableHeadCustom,
  TableSelectedAction,
} from 'src/components/table';

import { ObjectiveTypesTableRow } from '../objective-types-table-row';
import { ObjectiveTypesTableDrawer } from '../objective-types-table-drawer';
import { ObjectiveTypesTableToolbar } from '../objective-types-table-toolbar';
import { ObjectiveTypesTableFiltersResult } from '../objective-types-table-filters-result';

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export function ObjectiveTypesView() {
  const { t } = useTranslate('catalogs');
  const table = useTable();
  const confirmDialog = useBoolean();
  const modalDialog = useBoolean();

  const [tableData, setTableData] = useState<ObjectiveType[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedDataId, setSelectedDataId] = useState<string | number | undefined>(undefined);

  const STATUS_OPTIONS = useMemo(() => [
    { value: 'all', label: t('objective-types.filters.all') },
  ], [t]);

  const TABLE_HEAD: TableHeadCellProps[] = useMemo(() => [
    { id: '', width: 88 },
    { id: 'typeName', label: t('objective-types.columns.typeName') },
    { id: 'typeCode', label: t('objective-types.columns.typeCode') },
  ], [t]);

  const filters = useSetState<any>({
    name: '',
    status: 'all',
  });
  const { state: currentFilters, setState: updateFilters } = filters;


  // Función para cargar datos
  const loadData = useCallback(async () => {
    try {
      // Fetch all data directly with multiple parameter variations to ensure backend receives it
      const params = {
        page: 1,
        perPage: 10000,
        pageSize: 10000,
        limit: 10000,
        size: 10000,
        search: currentFilters.name,
        _t: new Date().getTime(),
      };

      const response = await GetObjectiveTypesPaginationService(params);
      
      // Handle the API response structure: [ [items...], totalCount ]
      let data: ObjectiveType[] = [];
      
      const responseData = response.data;

      if (Array.isArray(responseData)) {
        if (responseData.length >= 2 && Array.isArray(responseData[0])) {
          // Structure: [ [items...], totalCount ]
          data = responseData[0];
        } else if (responseData.length === 1 && Array.isArray(responseData[0])) {
           // Structure: [ [items...] ]
           data = responseData[0];
        } else {
           // Direct array of items
           data = responseData;
        }
      } else if (responseData?.data) {
        // Fallback to old format { data: [...], totalItems: ... }
        data = responseData.data || [];
      }

      // Ensure data is an array and create a new reference
      const newData = Array.isArray(data) ? [...data] : [];
      setTableData(newData);
      // For client-side pagination, totalItems is the length of the data array
      setTotalItems(newData.length);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error(t('objective-types.messages.error.loading'));
      setTableData([]);
      setTotalItems(0);
    }
  }, [currentFilters.name, t]);


  // Cargar datos cuando cambian los parámetros
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Aplicar filtros
  const dataFiltered = applyFilter({
    inputData: Array.isArray(tableData) ? tableData : [],
    comparator: getComparator(table.order, table.orderBy),
    filters: currentFilters,
  });

  const canReset = !!currentFilters.name || (currentFilters.status !== 'all' && currentFilters.status !== undefined);
  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRow = useCallback(
    async (id: string | number) => {
      try {
        await DeleteObjectiveTypeService(id);

        toast.success(t('objective-types.messages.success.deleted'));
        loadData(); // Recargar datos
      } catch (error) {
        console.error('Error deleting data:', error);
        toast.error(t('objective-types.messages.error.deleting'));
      }
    },
    [loadData, t]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      // Eliminar múltiples elementos
      const deletePromises = table.selected.map(id => DeleteObjectiveTypeService(id));
      await Promise.all(deletePromises);

      toast.success(t('objective-types.messages.success.deletedMultiple'));
      table.setSelected([]);
      loadData(); // Recargar datos
    } catch (error) {
      console.error('Error deleting data:', error);
      toast.error(t('objective-types.messages.error.deletingMultiple'));
    }
  }, [table, loadData, t]);

  const handleFilterStatus = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      updateFilters({ status: newValue });
    },
    [updateFilters, table]
  );

  const handleResetFilters = useCallback(() => {
    table.onResetPage();
    updateFilters({ name: '', status: 'all' });
  }, [updateFilters, table]);

  const handleOpenDrawer = useCallback((dataId?: string | number) => {
    setSelectedDataId(dataId);
    modalDialog.onTrue();
  }, [modalDialog]);

  const handleCloseDrawer = useCallback(() => {
    setSelectedDataId(undefined);
    modalDialog.onFalse();
  }, [modalDialog]);

  const handleSaveModal = useCallback(() => {
    // Small delay to ensure backend consistency
    setTimeout(() => {
      loadData();
    }, 500);
  }, [loadData]);

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title={t('objective-types.dialogs.delete.title')}
      content={
        <>
          {t('objective-types.dialogs.delete.contentMultiple', { count: table.selected.length })}
        </>
      }
      action={
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            handleDeleteRows();
            confirmDialog.onFalse();
          }}
        >
          Delete
        </Button>
      }
    />
  );

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('objective-types.title')}
          links={[
            { name: t('objective-types.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('objective-types.breadcrumbs.catalogs'), href: paths.dashboard.architecture.catalogs.root },
            { name: t('objective-types.title') },
          ]}
          action={
            <Button
              onClick={() => handleOpenDrawer()}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              {t('objective-types.actions.add')}
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          <Tabs
            value={currentFilters.status}
            onChange={handleFilterStatus}
            sx={[
              (theme) => ({
                px: { md: 2.5 },
                boxShadow: `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
              }),
            ]}
          >
            {STATUS_OPTIONS.map((tab) => (
              <Tab
                key={tab.value}
                iconPosition="end"
                value={tab.value}
                label={tab.label}
                icon={
                  <Label
                    variant={
                      ((tab.value === 'all' || tab.value === currentFilters.status) && 'filled') ||
                      'soft'
                    }
                    color="default"
                  >
                    {totalItems}
                  </Label>
                }
              />
            ))}
          </Tabs>

          <ObjectiveTypesTableToolbar
            filters={currentFilters}
            onFilters={(name, value) => {
              table.onResetPage();
              updateFilters({ [name]: value });
            }}
          />

          {canReset && (
            <ObjectiveTypesTableFiltersResult
              filters={currentFilters}
              totalResults={totalItems}
              onFilters={(name, value) => {
                updateFilters({ [name]: value });
              }}
              onReset={handleResetFilters}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          <Box sx={{ position: 'relative' }}>
            <TableSelectedAction
              dense={table.dense}
              numSelected={table.selected.length}
              rowCount={dataFiltered.length}
              onSelectAllRows={(checked) =>
                table.onSelectAllRows(
                  checked,
                  dataFiltered.map((row) => String(row.id))
                )
              }
              action={
                <IconButton color="primary" onClick={confirmDialog.onTrue}>
                  <Iconify icon="solar:trash-bin-trash-bold" />
                </IconButton>
              }
            />

            <Scrollbar>
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                <TableHeadCustom
                  order={table.order}
                  orderBy={table.orderBy}
                  headCells={TABLE_HEAD}
                  rowCount={dataFiltered.length}
                  numSelected={table.selected.length}
                  onSort={table.onSort}
                // onSelectAllRows={(checked) =>
                //   table.onSelectAllRows(
                //     checked,
                //     dataFiltered.map((row) => row.id)
                //   )
                // }
                />

                <TableBody>
                  {dataFiltered.map((row, index) => (
                      <ObjectiveTypesTableRow
                        key={row.id || index}
                        row={row}
                        mapHref={paths.dashboard.architecture.dataTableMap(String(row.id))}
                        selected={table.selected.includes(String(row.id))}
                        onSelectRow={() => table.onSelectRow(String(row.id))}
                        onDeleteRow={() => handleDeleteRow(String(row.id))}
                        onEditRow={() => handleOpenDrawer(String(row.id))}
                      />
                    ))}

                  <TableNoData notFound={notFound} />
                </TableBody>
              </Table>
            </Scrollbar>
          </Box>
        </Card>
      </DashboardContent>

      {renderConfirmDialog()}

      <ObjectiveTypesTableDrawer
        open={modalDialog.value}
        onClose={handleCloseDrawer}
        dataId={selectedDataId}
        onSave={handleSaveModal}
      />
    </>
  );
}

// ----------------------------------------------------------------------

type ApplyFilterProps = {
  inputData: ObjectiveType[];
  filters: any;
  comparator: (a: any, b: any) => number;
};

function applyFilter({ inputData, comparator, filters }: ApplyFilterProps) {
  // Asegurar que inputData es un array válido
  if (!Array.isArray(inputData)) {
    console.warn('applyFilter: inputData is not an array, returning empty array');
    return [];
  }

  const { name, status } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter(
      (item) => item?.typeName?.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }

  if (status !== 'all') {
    // TODO: Implement status filtering when the data model includes a status field
  }

  return inputData;


  
}
