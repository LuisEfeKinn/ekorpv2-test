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
  DeleteApplicationTableService
} from 'src/services/architecture/applications/applicationTable.service';
import {
  GetApplicationFlowService,
  GetApplicationFlowByIdService
} from 'src/services/architecture/applications/applicationMap.service';

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

import { ApplicationTableRow } from '../application-table-row';
import { ApplicationTableToolbar } from '../application-table-toolbar';
import { ApplicationDiagramFlowEditModal } from '../application-diagram-flow-edit';
import { ApplicationTableFiltersResult } from '../application-table-filters-result';
import { ApplicationDiagramFlowCreateModal } from '../application-diagram-flow-create';

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export function ApplicationTableView() {
  const { t } = useTranslate('architecture');
  const table = useTable();
  const confirmDialog = useBoolean();
  const modalDialog = useBoolean();
  const addChildModal = useBoolean();

  const [tableData, setTableData] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedDataId, setSelectedDataId] = useState<string | undefined>(undefined);
  const [parentNodeId, setParentNodeId] = useState<number>(0);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [loadingChildren, setLoadingChildren] = useState<Set<number>>(new Set());

  const STATUS_OPTIONS = useMemo(() => [
    { value: 'all', label: t('application.table.table.filters.all') },
  ], [t]);

  const TABLE_HEAD: TableHeadCellProps[] = useMemo(() => [
    { id: '', width: 50 }, // Columna de expansión
    { id: '', width: 88 }, // Columna de acciones
    { id: 'name', label: t('application.table.table.columns.name') },
    { id: 'description', label: t('application.table.table.columns.description') },
    { id: 'type', label: t('application.table.table.columns.type'), align: 'center' },
    { id: 'localExternal', label: t('application.table.table.columns.localExternal'), align: 'center' },
    { id: 'nomenclature', label: t('application.table.table.columns.nomenclature'), align: 'center' },
    { id: 'code', label: t('application.table.table.columns.code'), align: 'center' },
    { id: 'expirationDate', label: t('application.table.table.columns.expirationDate'), align: 'center' },
    { id: 'renewalDate', label: t('application.table.table.columns.renewalDate'), align: 'center' },
    { id: 'requiresSla', label: t('application.table.table.columns.requiresSla'), align: 'center' },
    { id: 'hasSla', label: t('application.table.table.columns.hasSla'), align: 'center' },
  ], [t]);

  const filters = useSetState<any>({
    name: '',
    description: '',
    abbreviation: '',
    status: 'all'
  });
  const { state: currentFilters, setState: updateFilters } = filters;


  // Función para aplanar la estructura jerárquica manteniendo nivel y padre
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

      // Si está expandido, agregar sus hijos
      if (expandedRows.has(item.id) && item.children && item.children.length > 0) {
        const childrenFlattened = flattenDataWithHierarchy(item.children, level + 1, item.id);
        flattened.push(...childrenFlattened);
      }
    });

    return flattened;
  }, [expandedRows]);

  // Función para cargar datos usando GetApplicationFlowService
  const loadData = useCallback(async () => {
    try {
      const response = await GetApplicationFlowService();
      const data = response.data || [];

      // Aplanar la estructura jerárquica
      const flattenedData = flattenDataWithHierarchy(data);

      setTableData(flattenedData);
      setTotalItems(flattenedData.length);
    } catch (error) {
      console.error('Error loading data flow:', error);
      toast.error(t('application.table.messages.error.loading'));
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

  const canReset = !!currentFilters.name || currentFilters.status !== 'all';
  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        const response = await DeleteApplicationTableService(id);

        if (response.data.statusCode === 200) {
          toast.success(t('application.table.messages.success.deleted'));
          loadData(); // Recargar datos
        }
      } catch (error) {
        console.error('Error deleting data table:', error);
        toast.error(t('application.table.messages.error.deleting'));
      }
    },
    [loadData, t]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      // Eliminar múltiples elementos
      const deletePromises = table.selected.map(id => DeleteApplicationTableService(id));
      await Promise.all(deletePromises);

      toast.success(t('application.table.messages.success.deletedMultiple'));
      table.setSelected([]);
      loadData(); // Recargar datos
    } catch (error) {
      console.error('Error deleting data tables:', error);
      toast.error(t('application.table.messages.error.deletingMultiple'));
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

  const handleOpenModal = useCallback((dataId?: string) => {
    setSelectedDataId(dataId);
    modalDialog.onTrue();
  }, [modalDialog]);

  const handleCloseModal = useCallback(() => {
    setSelectedDataId(undefined);
    modalDialog.onFalse();
  }, [modalDialog]);

  const handleSaveModal = useCallback(() => {
    loadData(); // Recargar la tabla después de guardar
  }, [loadData]);

  const handleOpenAddChildModal = useCallback((parentId?: any) => {
    setParentNodeId(parentId || null);
    addChildModal.onTrue();
  }, [addChildModal]);

  const handleCloseAddChildModal = useCallback(() => {
    setParentNodeId(0);
    addChildModal.onFalse();
  }, [addChildModal]);

  const handleSaveAddChildModal = useCallback(() => {
    loadData(); // Recargar la tabla después de guardar
  }, [loadData]);

  // Función para manejar expansión/contracción de filas
  const handleToggleExpand = useCallback(async (rowId: number, hasLoadedChildren: boolean) => {
    const isCurrentlyExpanded = expandedRows.has(rowId);

    if (isCurrentlyExpanded) {
      // Contraer
      setExpandedRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(rowId);
        return newSet;
      });
    } else {
      // Expandir
      if (!hasLoadedChildren) {
        // Cargar children dinámicamente
        setLoadingChildren(prev => new Set(prev).add(rowId));
        try {
          const response = await GetApplicationFlowByIdService(rowId);
          if (response?.data) {
            // Actualizar los datos con los children cargados
            // Esto requiere actualizar la estructura de datos original
            // Por simplicidad, vamos a recargar todo
            setExpandedRows(prev => new Set(prev).add(rowId));
            await loadData();
          }
        } catch (error) {
          console.error('Error loading children:', error);
          toast.error(t('application.table.messages.error.loading'));
        } finally {
          setLoadingChildren(prev => {
            const newSet = new Set(prev);
            newSet.delete(rowId);
            return newSet;
          });
        }
      } else {
        setExpandedRows(prev => new Set(prev).add(rowId));
      }
    }
  }, [expandedRows, loadData, t]);

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title={t('application.table.dialogs.delete.title')}
      content={
        <>
          {t('application.table.dialogs.delete.contentMultiple', { count: table.selected.length })}
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
          heading={t('application.table.title')}
          links={[
            { name: t('application.table.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('application.diagram.title'), href: paths.dashboard.architecture.applicationsDiagram },
            { name: t('application.table.title') },
          ]}
          action={
            <Button
              onClick={() => handleOpenAddChildModal()}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              {t('application.table.actions.add')}
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

          <ApplicationTableToolbar
            filters={currentFilters}
            onFilters={(name, value) => {
              table.onResetPage();
              updateFilters({ [name]: value });
            }}
          />

          {canReset && (
            <ApplicationTableFiltersResult
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
                      <ApplicationTableRow
                        key={row.id}
                        row={row}
                        mapHref={paths.dashboard.architecture.applicationsTableMap(row.id)}
                        selected={table.selected.includes(row.id)}
                        onSelectRow={() => table.onSelectRow(row.id)}
                        onDeleteRow={() => handleDeleteRow(row.id)}
                        onEditRow={() => handleOpenModal(row.id)}
                        onToggleExpand={handleToggleExpand}
                        openAddChildModal={handleOpenAddChildModal}
                        isLoadingChildren={loadingChildren.has(row.id)}
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

      <ApplicationDiagramFlowEditModal
        open={modalDialog.value}
        onClose={handleCloseModal}
        dataId={selectedDataId}
        onSave={handleSaveModal}
      />

      <ApplicationDiagramFlowCreateModal
        open={addChildModal.value}
        onClose={handleCloseAddChildModal}
        parentNodeId={parentNodeId}
        onSave={handleSaveAddChildModal}
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

  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter(
      (item) => item?.name?.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        item?.label?.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }

  if (status !== 'all') {
    // TODO: Implement status filtering when the data model includes a status field
  }

  return inputData;
}
