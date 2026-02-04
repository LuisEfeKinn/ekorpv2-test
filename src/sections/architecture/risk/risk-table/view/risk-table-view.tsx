'use client';

import type { TableHeadCellProps } from 'src/components/table';

import { varAlpha } from 'minimal-shared/utils';
import { useBoolean, useSetState } from 'minimal-shared/hooks';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  GetRiskFlowService,
} from 'src/services/architecture/risk/riskFlow.service';
import {
  UploadRisksService,
  DeleteRiskTableService,
  DownloadRisksExcelService,
} from 'src/services/architecture/risk/riskTable.service';

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

import { RiskTableRow } from '../risk-table-row';
import { RiskTableModal } from '../risk-table-modal';
import { RiskTableToolbar } from '../risk-table-toolbar';
import { RiskFiltersResult } from '../risk-table-filters-result';
import { RiskJobsRelationModal } from '../risk-jobs-relation-modal';

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export function RiskTableView() {
  const { t } = useTranslate('architecture');
  const table = useTable();
  const confirmDialog = useBoolean();
  const modalDialog = useBoolean();
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [tableData, setTableData] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedRiskId, setSelectedRiskId] = useState<string | undefined>(undefined);
  const relationDialog = useBoolean();
  const [relationRiskId, setRelationRiskId] = useState<number | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  

  const STATUS_OPTIONS = useMemo(() => [
    { value: 'all', label: t('risk.table.table.filters.all') },
  ], [t]);

  const TABLE_HEAD: TableHeadCellProps[] = useMemo(() => [
    { id: '', width: 50 },
    { id: '', width: 88 },
    { id: 'code', label: t('risk.table.table.columns.code'), align: 'center' },
    { id: 'name', label: t('risk.table.table.columns.name') },
    { id: 'description', label: t('risk.table.table.columns.description') },
    { id: 'riskType', label: t('risk.table.table.columns.riskType') },
    { id: 'superiorRisk', label: t('risk.table.table.columns.superiorRisk'), align: 'center' },
  ], [t]);

  const filters = useSetState<any>({
    name: '',
    description: '',
    abbreviation: '',
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

  // Función para cargar datos desde /api/risk/flow
  const loadData = useCallback(async () => {
    try {
      const response = await GetRiskFlowService();
      const data = response?.data || [];
      const flattened = flattenDataWithHierarchy(data);
      setTableData(flattened);
      setTotalItems(flattened.length);
    } catch (error) {
      console.error('Error loading risk flow:', error);
      toast.error(t('risk.table.messages.error.loading'));
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
        const response = await DeleteRiskTableService(id);

        if (response.data.statusCode === 200) {
          toast.success(t('risk.table.messages.success.deleted'));
          loadData(); // Recargar datos
        }
      } catch (error) {
        console.error('Error deleting risk:', error);
        toast.error(t('risk.table.messages.error.deleting'));
      }
    },
    [loadData, t]
  );

  const handleDownloadExcel = useCallback(async () => {
    try {
      setDownloading(true);
      const response = await DownloadRisksExcelService({});
      const blob = new Blob([response?.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'risks.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading risks excel:', error);
      toast.error(t('risk.table.messages.error.downloading'));
    } finally {
      setDownloading(false);
    }
  }, [t]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleUploadFileChange = useCallback(async (e: any) => {
    const file = e?.target?.files?.[0];
    if (e?.target) e.target.value = '';
    if (!file) return;
    try {
      setUploading(true);
      const form = new FormData();
      form.append('file', file);
      await UploadRisksService(form);
      toast.success(t('risk.table.messages.success.uploaded'));
      loadData();
    } catch (error) {
      console.error('Error uploading risks file:', error);
      toast.error(t('risk.table.messages.error.uploading'));
    } finally {
      setUploading(false);
    }
  }, [t, loadData]);

  const handleDeleteRows = useCallback(async () => {
    try {
      // Eliminar múltiples elementos
      const deletePromises = table.selected.map(id => DeleteRiskTableService(id));
      await Promise.all(deletePromises);

      toast.success(t('risk.table.messages.success.deletedMultiple'));
      table.setSelected([]);
      loadData(); // Recargar datos
    } catch (error) {
      console.error('Error deleting risk tables:', error);
      toast.error(t('risk.table.messages.error.deletingMultiple'));
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

  const handleOpenModal = useCallback((riskId?: string) => {
    setSelectedRiskId(riskId);
    modalDialog.onTrue();
  }, [modalDialog]);

  const handleCloseModal = useCallback(() => {
    setSelectedRiskId(undefined);
    modalDialog.onFalse();
  }, [modalDialog]);

  const handleSaveModal = useCallback(() => {
    loadData(); // Recargar la tabla después de guardar
  }, [loadData]);

  const handleOpenRelation = useCallback((riskId: number) => {
    setRelationRiskId(riskId);
    relationDialog.onTrue();
  }, [relationDialog]);

  const handleCloseRelation = useCallback(() => {
    setRelationRiskId(null);
    relationDialog.onFalse();
  }, [relationDialog]);

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
      // Si no hay hijos cargados, opcionalmente se podría cargar por ID
      setExpandedRows(prev => new Set(prev).add(rowId));
    }
  }, [expandedRows]);

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title={t('risk.table.dialogs.delete.title')}
      content={
        <>
          {t('risk.table.dialogs.delete.contentMultiple', { count: table.selected.length })}
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
          heading={t('risk.table.title')}
          links={[
            { name: t('risk.table.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('risk.table.title') },
          ]}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <input ref={fileInputRef} type="file" accept=".xlsx,.csv" style={{ display: 'none' }} onChange={handleUploadFileChange} />
              <Button onClick={() => handleOpenModal()} variant="contained" startIcon={<Iconify icon="mingcute:add-line" />}>{t('risk.table.actions.add')}</Button>
              <LoadingButton onClick={handleUploadClick} loading={uploading} variant="outlined" startIcon={<Iconify icon="eva:cloud-upload-fill" />}>{t('risk.table.actions.upload')}</LoadingButton>
              <LoadingButton onClick={handleDownloadExcel} loading={downloading} variant="outlined" startIcon={<Iconify icon="solar:download-bold" />}>{t('risk.table.actions.download')}</LoadingButton>
              
            </Box>
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

          <RiskTableToolbar
            filters={currentFilters}
            onFilters={(name, value) => {
              table.onResetPage();
              updateFilters({ [name]: value });
            }}
          />

          {canReset && (
            <RiskFiltersResult
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
                      <RiskTableRow
                        key={row.id}
                        row={row}
                        mapHref={paths.dashboard.architecture.risksTableMap(String(row.id))}
                        selected={table.selected.includes(row.id)}
                        onSelectRow={() => table.onSelectRow(row.id)}
                        onDeleteRow={() => handleDeleteRow(row.id)}
                        onEditRow={() => handleOpenModal(row.id)}
                        onRelateRow={() => handleOpenRelation(row.id)}
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

      <RiskTableModal
        open={modalDialog.value}
        onClose={handleCloseModal}
        riskId={selectedRiskId}
        onSave={handleSaveModal}
      />

      {relationDialog.value && relationRiskId !== null && (
        <RiskJobsRelationModal
          open={relationDialog.value}
          onClose={handleCloseRelation}
          onSuccess={loadData}
          riskId={relationRiskId}
        />
      )}

      
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

  // Mantener el orden natural (preorden del árbol) para que los hijos
  // aparezcan inmediatamente debajo del padre al expandir.
  // No aplicar sort aquí.

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
