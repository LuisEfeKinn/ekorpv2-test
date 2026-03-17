'use client';

import dayjs from 'dayjs';
import { useBoolean, useDebounce } from 'minimal-shared/hooks';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetTimeUnitsPaginationService } from 'src/services/architecture/catalogs/timeUnits.service';
import { GetProcessTypesPaginationService } from 'src/services/architecture/catalogs/processTypes.service';
import {
  UploadProcessService,
  GetProcessFlowService,
  DeleteProcessTableService,
  DownloadProcessExcelService,
  DownloadProcessTemplateService,
} from 'src/services/architecture/process/processTable.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  TableNoData,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import { ProcessTableRow } from '../processes-table-row';
import { ProcessCreateEditDrawer } from '../process-create-edit-drawer';
import { ProcessFiltersResult } from '../processes-table-filters-result';
import { ALL_COLUMNS, DEFAULT_COLUMNS } from '../processes-table-config';
import {
  ProcessTableToolbar,
  type TimeUnitOption,
  type ProcessTypeOption,
  type ProcessFlowFilters,
} from '../processes-table-toolbar';

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export function ProcessTableView() {
  const { t } = useTranslate('architecture');
  const { t: tCommon } = useTranslate('common');
  const table = useTable();
  const confirmDialog = useBoolean();
  const openCreateDrawer = useBoolean();
  const [editProcessId, setEditProcessId] = useState<string | undefined>(undefined);
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);

  const [tableData, setTableData] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_COLUMNS);

  const [name, setName] = useState('');

  const [flowFilters, setFlowFilters] = useState<ProcessFlowFilters>({
    type: null,
    requiresOLA: null,
    status: null,
    startDate: null,
    endDate: null,
    timeUnitId: null,
  });

  const debouncedName = useDebounce(name, 300);

  const [processTypeOptions, setProcessTypeOptions] = useState<ProcessTypeOption[]>([]);
  const [timeUnitOptions, setTimeUnitOptions] = useState<TimeUnitOption[]>([]);

  const handleToggleColumn = useCallback((columnId: string) => {
    setVisibleColumns((prev) => {
      if (prev.includes(columnId)) {
        return prev.filter((id) => id !== columnId);
      }
      return [...prev, columnId];
    });
  }, []);

  const TABLE_HEAD = useMemo(() => {
    const dynamicColumns = ALL_COLUMNS.filter((col) => visibleColumns.includes(col.id));
    return [
      { id: '', width: 88 },
      ...dynamicColumns,
    ];
  }, [visibleColumns]);

  const handleFlowFilters = useCallback(
    (next: Partial<ProcessFlowFilters>) => {
      setFlowFilters((prev) => {
        const merged: ProcessFlowFilters = { ...prev, ...next };

        if (merged.startDate && merged.endDate && merged.endDate.isBefore(merged.startDate, 'day')) {
          toast.error(tCommon('filters.dateRangeError'));
          return { ...merged, endDate: null };
        }

        return merged;
      });
    },
    [tCommon]
  );

  const flowParams = useMemo(() => {
    const params: Record<string, string | number | boolean | undefined> = {};

    const q = debouncedName.trim();
    if (q) params.name = q;
    if (flowFilters.type !== null) params.type = flowFilters.type;
    if (flowFilters.requiresOLA !== null) params.requiresOLA = flowFilters.requiresOLA;
    if (flowFilters.status !== null) params.status = flowFilters.status;
    if (flowFilters.timeUnitId !== null) params.timeUnitId = flowFilters.timeUnitId;
    if (flowFilters.startDate) params.startDate = dayjs(flowFilters.startDate).format('YYYY-MM-DD');
    if (flowFilters.endDate) params.endDate = dayjs(flowFilters.endDate).format('YYYY-MM-DD');

    return Object.keys(params).length ? params : undefined;
  }, [
    debouncedName,
    flowFilters.endDate,
    flowFilters.requiresOLA,
    flowFilters.startDate,
    flowFilters.status,
    flowFilters.timeUnitId,
    flowFilters.type,
  ]);

  const extractList = useCallback((raw: unknown): unknown[] => {
    if (Array.isArray(raw)) {
      if (raw.length > 0 && Array.isArray(raw[0])) return raw[0] as unknown[];
      return raw;
    }
    if (raw && typeof raw === 'object') {
      const record = raw as Record<string, unknown>;
      if (Array.isArray(record.data)) return record.data;
    }
    return [];
  }, []);

  const mapOptions = useCallback((items: unknown[]): { value: number; label: string }[] => items
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const record = item as Record<string, unknown>;
        const id = Number(record.id);
        if (!Number.isFinite(id) || id <= 0) return null;
        const labelCandidate = record.name ?? record.typeName ?? record.code ?? record.description;
        const label = String(labelCandidate ?? `#${id}`);
        return { value: id, label };
      })
      .filter((opt): opt is { value: number; label: string } => !!opt), []);

  const loadFilterOptions = useCallback(async () => {
    try {
      const [typesRes, timeUnitsRes] = await Promise.all([
        GetProcessTypesPaginationService({ page: 1, perPage: 200 }),
        GetTimeUnitsPaginationService({ page: 1, perPage: 200 }),
      ]);

      setProcessTypeOptions(mapOptions(extractList(typesRes?.data)));
      setTimeUnitOptions(mapOptions(extractList(timeUnitsRes?.data)));
    } catch {
      setProcessTypeOptions([]);
      setTimeUnitOptions([]);
    }
  }, [extractList, mapOptions]);

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
    const requestId = (requestIdRef.current += 1);
    try {
      const response = await GetProcessFlowService(flowParams);
      if (requestId !== requestIdRef.current) return;

      const data = Array.isArray(response?.data) ? response.data : [];
      const flattened = flattenDataWithHierarchy(data);
      setTableData(flattened);
      setTotalItems(flattened.length);
    } catch (error) {
      console.error('Error loading process:', error);
      toast.error(t('process.table.messages.error.loading'));
      if (requestId !== requestIdRef.current) return;
      setTableData([]);
      setTotalItems(0);
    }
  }, [flattenDataWithHierarchy, flowParams, t]);

  // Cargar datos cuando cambian los parámetros
  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const dataFiltered = tableData;

  const canReset = !!name.trim() || Object.keys(flowParams ?? {}).length > 0;
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

  const handleResetFilters = useCallback(() => {
    table.onResetPage();
    setName('');
    setFlowFilters({
      type: null,
      requiresOLA: null,
      status: null,
      startDate: null,
      endDate: null,
      timeUnitId: null,
    });
  }, [table]);

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

  const handleDownloadTemplate = useCallback(async () => {
    try {
      const response = await DownloadProcessTemplateService();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Process_Template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(t('process.table.messages.success.downloaded', { defaultValue: 'Template downloaded successfully' }));
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error(t('process.table.messages.error.downloading', { defaultValue: 'Error downloading template' }));
    }
  }, [t]);

  const handleDownloadExcel = useCallback(async () => {
    try {
      setDownloading(true);
      const params = {
        ...(flowParams ?? {}),
        columns: visibleColumns.join(','),
      };
      const response = await DownloadProcessExcelService(params);
      const blob = new Blob([response?.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'processes.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading processes excel:', error);
      toast.error(t('process.table.messages.error.downloading_excel', { defaultValue: 'Error downloading Excel' }));
    } finally {
      setDownloading(false);
    }
  }, [flowParams, t, visibleColumns]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleUploadFileChange = useCallback(async (e: any) => {
    const file = e?.target?.files?.[0];
    if (e?.target) e.target.value = '';
    if (!file) return;
    try {
      setUploading(true);
      await UploadProcessService(file);
      toast.success(t('process.table.messages.success.uploaded', { defaultValue: 'Uploaded successfully' }));
      loadData();
    } catch (error) {
      console.error('Error uploading processes file:', error);
      toast.error(t('process.table.messages.error.uploading', { defaultValue: 'Error uploading file' }));
    } finally {
      setUploading(false);
    }
  }, [t, loadData]);

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
              <input ref={fileInputRef} type="file" accept=".xlsx,.csv" style={{ display: 'none' }} onChange={handleUploadFileChange} />
              
              <Button
                component={RouterLink}
                href={paths.dashboard.architecture.processesFlow}
                variant="outlined"
                startIcon={<Iconify icon="solar:map-point-bold" />}
              >
                {t('process.map.title') || 'Flujo de Procesos'}
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
                onClick={handleDownloadTemplate}
                variant="outlined"
                startIcon={<Iconify icon="eva:cloud-download-fill" />}
              >
                {t('process.table.actions.downloadTemplate') || 'Descargar Plantilla'}
              </Button>
              <LoadingButton
                onClick={handleUploadClick}
                loading={uploading}
                variant="outlined"
                startIcon={<Iconify icon="eva:cloud-upload-fill" />}
              >
                {t('process.table.actions.upload') || 'Cargar'}
              </LoadingButton>
              <LoadingButton
                onClick={handleDownloadExcel}
                loading={downloading}
                variant="outlined"
                startIcon={<Iconify icon="solar:download-bold" />}
              >
                {t('process.table.actions.download') || 'Descargar'}
              </LoadingButton>
              
              <Button
                onClick={() => {
                  setEditProcessId(undefined);
                  openCreateDrawer.onTrue();
                }}
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
              >
                {t('process.table.actions.add')}
              </Button>
            </Stack>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <ProcessCreateEditDrawer
          open={openCreateDrawer.value}
          onClose={() => {
            openCreateDrawer.onFalse();
            setEditProcessId(undefined);
          }}
          processId={editProcessId}
          onSaved={() => {
            loadData();
            // openCreateDrawer.onFalse() is handled inside ProcessCreateEditDrawer onClose callback if we pass it correctly or if we just want to reload
          }}
        />

        <Card>
          <ProcessTableToolbar
            name={name}
            onNameChange={(value) => {
              table.onResetPage();
              setName(value);
            }}
            flowFilters={flowFilters}
            onFlowFilters={(next) => {
              table.onResetPage();
              handleFlowFilters(next);
            }}
            processTypeOptions={processTypeOptions}
            timeUnitOptions={timeUnitOptions}
            visibleColumns={visibleColumns}
            onChangeColumns={handleToggleColumn}
          />

          {canReset && (
            <ProcessFiltersResult
              name={name}
              flowFilters={flowFilters}
              processTypeOptions={processTypeOptions}
              timeUnitOptions={timeUnitOptions}
              totalResults={totalItems}
              onNameChange={(value) => {
                table.onResetPage();
                setName(value);
              }}
              onFlowFilters={(next) => {
                table.onResetPage();
                handleFlowFilters(next);
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
                        onEditRow={() => {
                          setEditProcessId(String(row.id));
                          openCreateDrawer.onTrue();
                        }}
                        onToggleExpand={handleToggleExpand}
                        visibleColumns={visibleColumns}
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
