'use client';

import type { TableHeadCellProps } from 'src/components/table';

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
  GetToolsFlowService,
  DeleteToolsTableService,
} from 'src/services/architecture/tools/toolsTable.service';

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

import { ToolsTableRow } from '../tools-table-row';
import { ToolsTableDrawer } from '../tools-table-drawer';
import { ToolsTableToolbar } from '../tools-table-toolbar';
import { ToolsFiltersResult } from '../tools-table-filters-result';

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export function ToolsTableView() {
  const { t } = useTranslate('architecture');
  const table = useTable();
  const confirmDialog = useBoolean();
  const modalDialog = useBoolean();

  const [tableData, setTableData] = useState<any[]>([]);
  const [originalData, setOriginalData] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedToolId, setSelectedToolId] = useState<string | undefined>(undefined);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const STATUS_OPTIONS = useMemo(() => [
    { value: 'all', label: t('tools.table.table.filters.all') },
  ], [t]);

  const TABLE_HEAD: TableHeadCellProps[] = useMemo(() => [
    { id: '', width: 50 },
    { id: '', width: 88 },
    { id: 'code', label: t('tools.table.table.columns.code') },
    { id: 'name', label: t('tools.table.table.columns.name') },
  ], [t]);

  const filters = useSetState<any>({
    name: '',
    description: '',
    abbreviation: '',
    status: 'all'
  });
  const { state: currentFilters, setState: updateFilters } = filters;


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
        children: item.children || [],
      };

      flattened.push(flatItem);

      if (expandedRows.has(item.id) && item.children && item.children.length > 0) {
        const childrenFlattened = flattenDataWithHierarchy(item.children, level + 1, item.id);
        flattened.push(...childrenFlattened);
      }
    });

    return flattened;
  }, [expandedRows]);


  const loadData = useCallback(async () => {
    try {
      const response = await GetToolsFlowService();
      const data = response.data || [];

      setOriginalData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading tools:', error);
      toast.error(t('tools.table.messages.error.loading'));
      setOriginalData([]);
    }
  }, [t]);

  // Cargar datos cuando cambian los parámetros
  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const flattenedData = flattenDataWithHierarchy(originalData);
    setTableData(flattenedData);
    setTotalItems(flattenedData.length);
  }, [originalData, flattenDataWithHierarchy]);

  // Aplicar filtros
  const dataFiltered = applyFilter({
    inputData: Array.isArray(tableData) ? tableData : [],
    comparator: getComparator(table.order, table.orderBy),
    filters: currentFilters,
  });

  const canReset = !!currentFilters.name || currentFilters.status !== 'all';
  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        await DeleteToolsTableService(id);
        toast.success(t('tools.table.messages.success.deleted'));
        loadData(); // Recargar datos
      } catch (error) {
        console.error('Error deleting tools:', error);
        toast.error(t('tools.table.messages.error.deleting'));
      }
    },
    [loadData, t]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      // Eliminar múltiples elementos
      const deletePromises = table.selected.map(id => DeleteToolsTableService(id));
      await Promise.all(deletePromises);

      toast.success(t('tools.table.messages.success.deletedMultiple'));
      table.setSelected([]);
      loadData(); // Recargar datos
    } catch (error) {
      console.error('Error deleting tools tables:', error);
      toast.error(t('tools.table.messages.error.deletingMultiple'));
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

  const handleOpenModal = useCallback((toolId?: string) => {
    setSelectedToolId(toolId);
    modalDialog.onTrue();
  }, [modalDialog]);

  const handleCloseModal = useCallback(() => {
    setSelectedToolId(undefined);
    modalDialog.onFalse();
  }, [modalDialog]);

  const handleSaveModal = useCallback(() => {
    loadData(); // Recargar la tabla después de guardar
  }, [loadData]);

  const handleToggleExpand = useCallback((rowId: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  }, []);

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title={t('tools.table.dialogs.delete.title')}
      content={
        <>
          {t('tools.table.dialogs.delete.contentMultiple', { count: table.selected.length })}
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
          heading={t('tools.table.title')}
          links={[
            { name: t('tools.table.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('tools.table.title') },
          ]}
          action={
            <Button
              onClick={() => handleOpenModal(undefined)}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              {t('tools.table.actions.add')}
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

          <ToolsTableToolbar
            filters={currentFilters}
            onFilters={(name, value) => {
              table.onResetPage();
              updateFilters({ [name]: value });
            }}
          />

          {canReset && (
            <ToolsFiltersResult
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
                  dataFiltered.map((row) => row.id)
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
                  {dataFiltered
                    .slice(
                      table.page * table.rowsPerPage,
                      table.page * table.rowsPerPage + table.rowsPerPage
                    )
                    .map((row) => (
                      <ToolsTableRow
                        key={row.id}
                        row={row}
                        selected={table.selected.includes(row.id)}
                        onSelectRow={() => table.onSelectRow(row.id)}
                        onDeleteRow={() => handleDeleteRow(row.id)}
                        onEditRow={() => handleOpenModal(row.id)}
                        onToggleExpand={() => handleToggleExpand(row.id)}
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

      <ToolsTableDrawer
        open={modalDialog.value}
        onClose={handleCloseModal}
        toolId={selectedToolId}
        onSave={handleSaveModal}
      />
    </>
  );
}

// ----------------------------------------------------------------------

type ApplyFilterProps = {
  inputData: any[];
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
  // Preservar el orden jerárquico tal como viene del aplanado

  if (name) {
    inputData = inputData.filter(
      (item) => 
        item?.name?.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        item?.code?.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }

  if (status !== 'all') {
    // TODO: Implement status filtering when the data model includes a status field
  }

  return inputData;
}
