'use client';

import type { TableHeadCellProps } from 'src/components/table';
import type { IProcessTable, IProcessTableFilters } from 'src/types/architecture/process';

import { varAlpha } from 'minimal-shared/utils';
import { useBoolean, useSetState } from 'minimal-shared/hooks';
import React, { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  GetProcessFlowService,
  DeleteProcessTableService,
} from 'src/services/architecture/process/processTable.service';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import { ProcessTableRow } from '../processes-table-row';
import { ProcessTableToolbar } from '../processes-table-toolbar';
import { ProcessFiltersResult } from '../processes-table-filters-result';

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export function ProcessTableView() {
  const { t } = useTranslate('architecture');
  const table = useTable();
  const confirmDialog = useBoolean();

  const [tableData, setTableData] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const STATUS_OPTIONS = useMemo(() => [
    { value: 'all', label: t('process.table.table.filters.all') },
  ], [t]);

  const TABLE_HEAD: TableHeadCellProps[] = useMemo(() => [
    { id: '', width: 50 },
    { id: '', width: 88 },
    { id: 'nomenclature', label: t('process.table.table.columns.nomenclature') },
    { id: 'name', label: t('process.table.table.columns.name') },
    { id: 'description', label: t('process.table.table.columns.description') },
    { id: 'requiresOLA', label: t('process.table.table.columns.requiresOLA'), align: 'center' },
    { id: 'periodicity', label: t('process.table.table.columns.periodicity'), align: 'center' }
  ], [t]);

  const filters = useSetState<IProcessTableFilters>({
    name: '',
    nomenclature: '',
    status: 'all'
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  // Aplanar jerarquía para mostrar niveles y expansión
  const flattenDataWithHierarchy = useCallback((data: any[], level = 0, parentId?: number): any[] => {
    const flattened: any[] = [];

    data.forEach((item) => {
      const flatItem = {
        ...item.data,
        id: item.id,
        label: item.label,
        level,
        parentId,
        hasChildren: item.children && item.children.length > 0,
        isExpanded: expandedRows.has(item.id),
        children: item.children || []
      };

      flattened.push(flatItem);

      if (expandedRows.has(item.id) && item.children && item.children.length > 0) {
        const childrenFlattened = flattenDataWithHierarchy(item.children, level + 1, item.id);
        flattened.push(...childrenFlattened);
      }
    });

    return flattened;
  }, [expandedRows]);

  // Función para cargar datos
  const loadData = useCallback(async () => {
    try {
      const response = await GetProcessFlowService();
      const data = response?.data || [];
      const flattened = flattenDataWithHierarchy(data);
      setTableData(flattened);
      setTotalItems(flattened.length);
    } catch (error) {
      console.error('Error loading process:', error);
      toast.error(t('process.table.messages.error.loading'));
      setTableData([]);
      setTotalItems(0);
    }
  }, [flattenDataWithHierarchy, t]);

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

  const canReset = !!currentFilters.name || !!currentFilters.nomenclature || currentFilters.status !== 'all';
  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        await DeleteProcessTableService(id);
        toast.success(t('process.table.messages.success.deleted'));
        loadData(); // Recargar datos
      } catch (error) {
        console.error('Error deleting process:', error);
        toast.error(t('process.table.messages.error.deleting'));
      }
    },
    [loadData, t]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      // Eliminar múltiples elementos
      const deletePromises = table.selected.map(id => DeleteProcessTableService(id));
      await Promise.all(deletePromises);

      toast.success(t('process.table.messages.success.deletedMultiple'));
      table.setSelected([]);
      loadData(); // Recargar datos
    } catch (error) {
      console.error('Error deleting process types:', error);
      toast.error(t('process.table.messages.error.deletingMultiple'));
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
    updateFilters({ name: '', nomenclature: '', status: 'all' });
  }, [updateFilters, table]);

  // Manejar expandir/contraer
  const handleToggleExpand = useCallback(async (rowId: number, hasLoadedChildren: boolean) => {
    const isExpanded = expandedRows.has(rowId);
    if (isExpanded) {
      setExpandedRows(prev => {
        const next = new Set(prev);
        next.delete(rowId);
        return next;
      });
    } else {
      setExpandedRows(prev => new Set(prev).add(rowId));
    }
  }, [expandedRows]);

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title={t('process.table.dialogs.delete.title')}
      content={
        <>
          {t('process.table.dialogs.delete.contentMultiple', { count: table.selected.length })}
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
          heading={t('process.table.title')}
          links={[
            { name: t('process.table.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('process.table.title') },
          ]}
          action={
            <Stack direction="row" spacing={1}>
              <Button
                component={RouterLink}
                href={paths.dashboard.architecture.processesFlow}
                variant="outlined"
                startIcon={<Iconify icon="solar:map-point-bold" />}
              >
                {t('process.map.title')}
              </Button>
              <Button
                component={RouterLink}
                href={paths.dashboard.architecture.processesRasciMatrix}
                variant="outlined"
                startIcon={<Iconify icon="solar:list-bold" />}
              >
                {t('rasciMatrix.title')}
              </Button>
              <Button
                component={RouterLink}
                href={paths.dashboard.architecture.processesTableCreate}
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
              >
                {t('process.table.actions.add')}
              </Button>
            </Stack>
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

          <ProcessTableToolbar
            filters={currentFilters}
            onFilters={(name, value) => {
              table.onResetPage();
              updateFilters({ [name]: value });
            }}
          />

          {canReset && (
            <ProcessFiltersResult
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
                //     dataFiltered.map((row) => String(row.id))
                //   )
                // }
                />

                <TableBody>
                  {dataFiltered
                    .slice(
                      table.page * table.rowsPerPage,
                      table.page * table.rowsPerPage + table.rowsPerPage
                    )
                    .map((row) => (
                      <ProcessTableRow
                        key={row.id}
                        row={row}
                        selected={table.selected.includes(String(row.id))}
                        onSelectRow={() => table.onSelectRow(String(row.id))}
                        onDeleteRow={() => handleDeleteRow(String(row.id))}
                        editHref={`${paths.dashboard.architecture.processesTableEdit(String(row.id))}`}
                        onToggleExpand={handleToggleExpand}
                      />
                    ))}

                  <TableEmptyRows
                    height={table.dense ? 56 : 76}
                    emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
                  />

                  <TableNoData notFound={notFound} />
                </TableBody>
              </Table>
            </Scrollbar>
          </Box>

          <TablePaginationCustom
            page={table.page}
            dense={table.dense}
            count={totalItems}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onChangeDense={table.onChangeDense}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </Card>
      </DashboardContent>

      {renderConfirmDialog()}
    </>
  );
}

// ----------------------------------------------------------------------

type ApplyFilterProps = {
  inputData: IProcessTable[];
  filters: IProcessTableFilters;
  comparator: (a: any, b: any) => number;
};

function applyFilter({ inputData, comparator, filters }: ApplyFilterProps) {
  // Asegurar que inputData es un array válido
  if (!Array.isArray(inputData)) {
    console.warn('applyFilter: inputData is not an array, returning empty array');
    return [];
  }

  const { name, nomenclature, status } = filters;

  // We do not sort here to preserve the hierarchy order

  if (name) {
    inputData = inputData.filter(
      (item) => item?.name?.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }

  if (nomenclature) {
    inputData = inputData.filter(
      (item) => item?.nomenclature?.toLowerCase().indexOf(nomenclature.toLowerCase()) !== -1
    );
  }

  if (status !== 'all') {
    // TODO: Implement status filtering when the data model includes a status field
  }

  return inputData;
}
