'use client';


import { varAlpha } from 'minimal-shared/utils';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { useBoolean, useDebounce, useSetState } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter } from 'src/routes/hooks/use-router';
import { usePathname } from 'src/routes/hooks/use-pathname';
import { useSearchParams } from 'src/routes/hooks/use-search-params';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  GetRiskFlowService,
} from 'src/services/architecture/risk/riskFlow.service';
import {
  UploadRisksService,
  GetRiskTypesService,
  DeleteRiskTableService,
  DownloadRisksExcelService,
  DownloadRisksTemplateService,
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
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import { RiskTableRow } from '../risk-table-row';
import { RiskTableModal } from '../risk-table-modal';
import { RiskFiltersResult } from '../risk-table-filters-result';
import { RiskJobsRelationModal } from '../risk-jobs-relation-modal';
import { RiskTableToolbar, type RiskTypeOption } from '../risk-table-toolbar';
import { ALL_COLUMNS, DEFAULT_COLUMNS, type RiskTableColumn } from '../risk-table-config';

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export function RiskTableView() {
  const { t, currentLang } = useTranslate('architecture');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const table = useTable();
  const confirmDialog = useBoolean();
  const modalDialog = useBoolean();
  const uploadDrawer = useBoolean();
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);

  type RiskFlowNode = {
    id: number;
    label?: string;
    data?: Record<string, unknown>;
    children?: RiskFlowNode[];
  };

  type RiskFlatRow = Record<string, unknown> & {
    id: number;
    label: string;
    level: number;
    parentId?: number;
    hasChildren: boolean;
    isExpanded: boolean;
    children: RiskFlowNode[];
  };

  const [flowData, setFlowData] = useState<RiskFlowNode[]>([]);
  const [selectedRiskId, setSelectedRiskId] = useState<string | undefined>(undefined);
  const relationDialog = useBoolean();
  const [relationRiskId, setRelationRiskId] = useState<number | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_COLUMNS);
  const [riskTypeOptions, setRiskTypeOptions] = useState<RiskTypeOption[]>([]);

  const handleToggleColumn = useCallback((columnId: string) => {
    setVisibleColumns((prev) => {
      if (prev.includes(columnId)) {
        return prev.filter((id) => id !== columnId);
      }
      return [...prev, columnId];
    });
  }, []);

  const STATUS_OPTIONS = useMemo(() => [
    { value: 'all', label: t('risk.table.table.filters.all', { defaultValue: 'All' }) },
  ], [t]);

  const TABLE_HEAD = useMemo(() => {
    const getColumnLabel = (column: RiskTableColumn) => {
      const keyValue = t(column.labelKey);
      if (keyValue && keyValue !== column.labelKey) return keyValue;
      return currentLang?.value === 'es' ? column.fallback.es : column.fallback.en;
    };

    const dynamicColumns = ALL_COLUMNS
      .filter((col) => visibleColumns.includes(col.id))
      .map((col) => ({ id: col.id, label: getColumnLabel(col) }));
    return [
      { id: '', width: 88 },
      ...dynamicColumns,
    ];
  }, [visibleColumns, t, currentLang?.value]);

  type RiskTableFilters = {
    name: string;
    status: string;
  };

  const nameFromQuery = useMemo(() => searchParams.get('name') ?? '', [searchParams]);

  const filters = useSetState<RiskTableFilters>({
    name: nameFromQuery,
    status: 'all',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const typeFromQuery = useMemo(() => {
    const raw = searchParams.get('type');
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [searchParams]);

  const setQueryParams = useCallback(
    (next: { name?: string; type?: number | null }) => {
      const url = new URLSearchParams(searchParams.toString());

      if ('name' in next) {
        const value = (next.name ?? '').trim();
        if (value) url.set('name', value);
        else url.delete('name');
      }

      if ('type' in next) {
        const value = next.type;
        if (value === null || value === undefined) url.delete('type');
        else url.set('type', String(value));
      }

      const query = url.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router, searchParams]
  );

  const debouncedName = useDebounce(currentFilters.name, 300);

  useEffect(() => {
    const q = debouncedName.trim();
    const currentQ = nameFromQuery.trim();
    if (q === currentQ) return;
    setQueryParams({ name: q });
  }, [debouncedName, nameFromQuery, setQueryParams]);

  const handleTypeChange = useCallback(
    (nextType: number | null) => {
      table.onResetPage();
      setQueryParams({ type: nextType });
    },
    [setQueryParams, table]
  );

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

  const mapOptions = useCallback(
    (items: unknown[]): RiskTypeOption[] =>
      items
        .map((item) => {
          if (!item || typeof item !== 'object') return null;
          const record = item as Record<string, unknown>;
          const id = Number(record.id);
          if (!Number.isFinite(id) || id <= 0) return null;
          const labelCandidate = record.name ?? record.typeName ?? record.code ?? record.description;
          const label = String(labelCandidate ?? `#${id}`);
          return { value: id, label };
        })
        .filter((opt): opt is RiskTypeOption => !!opt),
    []
  );

  const loadRiskTypeOptions = useCallback(async () => {
    try {
      const res = await GetRiskTypesService();
      const list = extractList(res?.data);
      setRiskTypeOptions(mapOptions(list));
    } catch {
      setRiskTypeOptions([]);
    }
  }, [extractList, mapOptions]);

  // Aplanar jerarquía para mostrar niveles y expansión
  const flattenDataWithHierarchy = useCallback((data: RiskFlowNode[], level = 0, parentId?: number): RiskFlatRow[] => {
    const flattened: RiskFlatRow[] = [];

    data.forEach((item) => {
      if (!item) return;
      const safeLabel = typeof item.label === 'string' ? item.label : '';
      const safeData = item.data ?? {};
      const safeChildren = Array.isArray(item.children) ? item.children : [];

      const flatItem = {
        ...safeData,
        id: item.id,
        label: safeLabel,
        level,
        parentId,
        hasChildren: safeChildren.length > 0,
        isExpanded: expandedRows.has(item.id),
        children: safeChildren,
      } satisfies RiskFlatRow;

      flattened.push(flatItem);

      if (expandedRows.has(item.id) && safeChildren.length > 0) {
        const childrenFlattened = flattenDataWithHierarchy(safeChildren, level + 1, item.id);
        flattened.push(...childrenFlattened);
      }
    });

    return flattened;
  }, [expandedRows]);

  const flattenAllNodes = useCallback((data: RiskFlowNode[], level = 0, parentId?: number): RiskFlatRow[] => {
    const flattened: RiskFlatRow[] = [];

    data.forEach((item) => {
      if (!item) return;
      const safeLabel = typeof item.label === 'string' ? item.label : '';
      const safeData = item.data ?? {};
      const safeChildren = Array.isArray(item.children) ? item.children : [];

      const flatItem = {
        ...safeData,
        id: item.id,
        label: safeLabel,
        level,
        parentId,
        hasChildren: safeChildren.length > 0,
        isExpanded: expandedRows.has(item.id),
        children: safeChildren,
      } satisfies RiskFlatRow;

      flattened.push(flatItem);

      if (safeChildren.length > 0) {
        flattened.push(...flattenAllNodes(safeChildren, level + 1, item.id));
      }
    });

    return flattened;
  }, [expandedRows]);

  const countFlowNodes = useCallback(function count(nodes: RiskFlowNode[]): number {
    return nodes.reduce((acc, node) => {
      const children = Array.isArray(node.children) ? node.children : [];
      return acc + 1 + count(children);
    }, 0);
  }, []);

  // Función para cargar datos desde /api/risk/flow
  const loadData = useCallback(async () => {
    try {
      const params: Record<string, string | number | boolean | undefined> = {};
      const q = nameFromQuery.trim();
      if (q) {
        params.name = q;
      }
      if (typeFromQuery !== null) params.type = typeFromQuery;

      const response = await GetRiskFlowService(Object.keys(params).length ? params : undefined);
      const data = Array.isArray(response?.data) ? (response.data as RiskFlowNode[]) : [];
      setFlowData(data);
      setExpandedRows(new Set());
    } catch (error) {
      console.error('Error loading risk flow:', error);
      toast.error(t('risk.table.messages.error.loading'));
      setFlowData([]);
      setExpandedRows(new Set());
    }
  }, [nameFromQuery, t, typeFromQuery]);

  // Cargar datos cuando cambian los parámetros
  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadRiskTypeOptions();
  }, [loadRiskTypeOptions]);

  const hasKeyword = currentFilters.name.trim().length > 0;
  const flowTotalCount = useMemo(() => countFlowNodes(flowData), [countFlowNodes, flowData]);

  const baseRows = useMemo(
    () => (hasKeyword ? flattenAllNodes(flowData) : flattenDataWithHierarchy(flowData)),
    [flattenAllNodes, flattenDataWithHierarchy, flowData, hasKeyword]
  );

  const dataFiltered = applyFilter({
    inputData: baseRows,
    filters: currentFilters,
  });

  const tabCount = hasKeyword ? dataFiltered.length : flowTotalCount;

  const selectedTypeLabel = useMemo(() => {
    if (typeFromQuery === null) return null;
    return riskTypeOptions.find((opt) => opt.value === typeFromQuery)?.label ?? String(typeFromQuery);
  }, [riskTypeOptions, typeFromQuery]);

  const canReset = !!currentFilters.name || currentFilters.status !== 'all' || typeFromQuery !== null;
  const notFound = !dataFiltered.length && canReset;

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
      const params: Record<string, string | number> = { columns: visibleColumns.join(',') };
      const q = nameFromQuery.trim();
      if (q) params.name = q;
      if (typeFromQuery !== null) params.type = typeFromQuery;
      const response = await DownloadRisksExcelService(params);
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
  }, [nameFromQuery, t, typeFromQuery, visibleColumns]);

  const handleDownloadTemplate = useCallback(async () => {
    try {
      const response = await DownloadRisksTemplateService();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'risk_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error(t('risk.table.messages.error.downloading'));
    }
  }, [t]);

  const handleUploadExcel = useCallback(async (file: File) => {
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
      throw error;
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
    setQueryParams({ name: '', type: null });
  }, [setQueryParams, table, updateFilters]);

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
              <Button
                component={RouterLink}
                href={paths.dashboard.architecture.riskMatrix}
                variant="outlined"
                startIcon={<Iconify icon="solar:list-bold" />}
              >
                {t('riskMatrix.title')}
              </Button>

              <Button
                component={RouterLink}
                href={paths.dashboard.architecture.riskMatrixProcess}
                variant="outlined"
                startIcon={<Iconify icon="solar:graph-up-bold-duotone" />}
              >
                {t('riskMatrixProcess.title')}
              </Button>

              <LoadingButton onClick={uploadDrawer.onTrue} loading={uploading} variant="outlined" startIcon={<Iconify icon="eva:cloud-upload-fill" />}>
                {t('risk.table.actions.upload') || 'Cargar'}
              </LoadingButton>
              <LoadingButton onClick={handleDownloadExcel} loading={downloading} variant="outlined" startIcon={<Iconify icon="solar:download-bold" />}>
                {t('risk.table.actions.download') || 'Descargar'}
              </LoadingButton>
              <Button onClick={() => handleOpenModal()} variant="contained" startIcon={<Iconify icon="mingcute:add-line" />}>
                {t('risk.table.actions.add')}
              </Button>
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
                    {tabCount}
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
            visibleColumns={visibleColumns}
            onChangeColumns={handleToggleColumn}
            type={typeFromQuery}
            onTypeChange={handleTypeChange}
            riskTypeOptions={riskTypeOptions}
          />

          {canReset && (
            <RiskFiltersResult
              filters={currentFilters}
              typeLabel={selectedTypeLabel}
              onClearType={() => handleTypeChange(null)}
              totalResults={tabCount}
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
                        onEditRow={() => handleOpenModal(String(row.id))}
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
            count={dataFiltered.length}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onChangeDense={table.onChangeDense}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </Card>
      </DashboardContent>

      {renderConfirmDialog()}

      <RiskUploadTemplateDrawer
        open={uploadDrawer.value}
        uploading={uploading}
        onClose={uploadDrawer.onFalse}
        onDownloadTemplate={handleDownloadTemplate}
        onUpload={handleUploadExcel}
      />

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

type RiskUploadTemplateDrawerProps = {
  open: boolean;
  uploading: boolean;
  onClose: () => void;
  onDownloadTemplate: () => void;
  onUpload: (file: File) => Promise<void>;
};

function RiskUploadTemplateDrawer({
  open,
  uploading,
  onClose,
  onDownloadTemplate,
  onUpload,
}: RiskUploadTemplateDrawerProps) {
  const { t } = useTranslate('architecture');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setError(null);
    }
  }, [open]);

  const accept = useMemo(
    () => ({
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    }),
    []
  );

  const handleDropRejected = useCallback(
    (rejections: FileRejection[]) => {
      const first = rejections[0];
      const firstError = first?.errors?.[0];
      const code = firstError?.code;

      if (code === 'too-many-files') {
        const msg = t('risk.table.uploadDrawer.errors.tooManyFiles', { defaultValue: 'Solo se permite 1 archivo.' });
        setError(msg);
        toast.error(msg);
        return;
      }

      if (code === 'file-invalid-type') {
        const msg = t('risk.table.uploadDrawer.errors.invalidType', {
          defaultValue: 'Formato no permitido. Usa .xlsx o .xls.',
        });
        setError(msg);
        toast.error(msg);
        return;
      }

      const msg = t('risk.table.uploadDrawer.errors.generic', {
        defaultValue: 'No se pudo cargar el archivo. Intenta nuevamente.',
      });
      setError(msg);
      toast.error(msg);
    },
    [t]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    multiple: false,
    maxFiles: 1,
    accept,
    disabled: uploading,
    onDropAccepted: (files) => {
      setFile(files[0] ?? null);
      setError(null);
    },
    onDropRejected: handleDropRejected,
  });

  const handleClose = useCallback(() => {
    if (!uploading) onClose();
  }, [onClose, uploading]);

  const handleConfirmUpload = useCallback(async () => {
    if (!file) {
      const msg = t('risk.table.uploadDrawer.errors.noFile', { defaultValue: 'Selecciona un archivo.' });
      setError(msg);
      toast.error(msg);
      return;
    }

    try {
      await onUpload(file);
      onClose();
    } catch {
      const msg = t('risk.table.uploadDrawer.errors.generic', {
        defaultValue: 'No se pudo cargar el archivo. Intenta nuevamente.',
      });
      setError(msg);
      toast.error(msg);
    }
  }, [file, onClose, onUpload, t]);

  return (
    <Drawer
      open={open}
      anchor="right"
      onClose={handleClose}
      PaperProps={{ sx: { width: { xs: 1, sm: 520, md: 620 }, display: 'flex', flexDirection: 'column' } }}
    >
      <Box sx={{ px: 3, py: 2, position: 'relative', borderBottom: (theme) => `1px solid ${theme.vars.palette.divider}` }}>
        <Typography variant="h6">
          {t('risk.table.uploadDrawer.title', { defaultValue: 'Cargar riesgos por Lote' })}
        </Typography>
        <IconButton
          aria-label={t('risk.table.uploadDrawer.actions.close', { defaultValue: 'Cerrar' })}
          onClick={handleClose}
          disabled={uploading}
          sx={{ position: 'absolute', right: 12, top: 12 }}
        >
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </Box>

      <Box sx={{ px: 3, py: 2.5, overflow: 'auto', flex: '1 1 auto' }}>
        <Box
          sx={[
            (theme) => ({
              display: 'grid',
              gap: 1,
              p: 2,
              borderRadius: 1.5,
              border: `1px solid ${varAlpha(theme.vars.palette.info.mainChannel, 0.28)}`,
              backgroundColor: varAlpha(theme.vars.palette.info.mainChannel, 0.1),
              color: theme.vars.palette.info.darker,
            }),
          ]}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Iconify icon="solar:info-circle-bold" />
            <Typography variant="subtitle2">
              {t('risk.table.uploadDrawer.instructions.title', { defaultValue: 'Instrucciones' })}
            </Typography>
          </Stack>

          <Box
            component="div"
            sx={{
              m: 0,
              display: 'grid',
              gap: 0.5,
              typography: 'body2',
              color: 'text.secondary',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {t('risk.table.uploadDrawer.instructions.step1', {
                defaultValue:
                  'Debe crear un archivo Excel con las siguientes columnas como encabezado: NOMENCLATURA_RIESGO, NOMBRE_RIESGO, NOMENCLATURA_RIESGO_PADRE, TIPO_RIESGO (ver ids tipo riesgo).',
              })}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('risk.table.uploadDrawer.instructions.step2', {
                defaultValue:
                  'Ingrese el listado de riesgos a cargar, guarde el archivo con un nombre que no contenga espacios ni caracteres especiales.',
              })}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('risk.table.uploadDrawer.instructions.step3', {
                defaultValue:
                  "Puede arrastrar y soltar el archivo guardado en el cuadro a continuación, o seleccionarlo mediante el botón 'Seleccionar archivo'.",
              })}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('risk.table.uploadDrawer.instructions.step4', {
                defaultValue: "Haga clic en el botón 'Cargar' para iniciar el proceso de cargue.",
              })}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Box
            {...getRootProps()}
            sx={[
              (theme) => ({
                p: 4,
                borderRadius: 2,
                textAlign: 'center',
                outline: 'none',
                cursor: uploading ? 'default' : 'pointer',
                border: `dashed 1px ${theme.vars.palette.divider}`,
                backgroundColor: theme.vars.palette.background.neutral,
                transition: theme.transitions.create(['border-color', 'background-color'], {
                  duration: theme.transitions.duration.shorter,
                }),
                ...(isDragActive && {
                  borderColor: theme.vars.palette.primary.main,
                  backgroundColor: varAlpha(theme.vars.palette.primary.mainChannel, 0.08),
                }),
                ...((isDragReject || !!error) && {
                  borderColor: theme.vars.palette.error.main,
                  backgroundColor: varAlpha(theme.vars.palette.error.mainChannel, 0.08),
                }),
              }),
            ]}
          >
            <input {...getInputProps()} />

            <Stack spacing={1.25} alignItems="center">
              <Iconify icon="eva:cloud-upload-fill" width={28} />

              <Typography variant="subtitle1">
                {file
                  ? t('risk.table.uploadDrawer.drop.selectedTitle', { defaultValue: 'Archivo seleccionado' })
                  : t('risk.table.uploadDrawer.drop.title', { defaultValue: 'Seleccionar archivo Excel' })}
              </Typography>

              {file ? (
                <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {file.name}
                  </Typography>
                  <Button
                    size="small"
                    variant="text"
                    onClick={(event) => {
                      event.stopPropagation();
                      setFile(null);
                      setError(null);
                    }}
                    disabled={uploading}
                    sx={{ textTransform: 'none' }}
                  >
                    {t('risk.table.uploadDrawer.actions.remove', { defaultValue: 'Quitar' })}
                  </Button>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t('risk.table.uploadDrawer.drop.subtitle', {
                    defaultValue: 'o haz clic para seleccionar desde tu dispositivo',
                  })}
                </Typography>
              )}

              <Typography variant="caption" color="text.disabled">
                {t('risk.table.uploadDrawer.drop.formats', {
                  defaultValue: 'Formatos permitidos: .xlsx, .xls • 1 archivo',
                })}
              </Typography>

              {!!error && (
                <Typography
                  variant="caption"
                  color="error.main"
                  sx={{ whiteSpace: 'pre-line', alignSelf: 'stretch', textAlign: 'left' }}
                >
                  {error}
                </Typography>
              )}
            </Stack>
          </Box>

          <Button
            variant="outlined"
            startIcon={<Iconify icon="eva:cloud-download-fill" />}
            onClick={onDownloadTemplate}
            disabled={uploading}
            sx={{ mt: 1.5, width: 1 }}
          >
            {t('risk.table.actions.downloadTemplate', { defaultValue: 'Descargar Plantilla' })}
          </Button>
        </Box>
      </Box>

      <Box sx={{ px: 3, py: 2, borderTop: (theme) => `1px solid ${theme.vars.palette.divider}`, display: 'flex', justifyContent: 'flex-end', gap: 1.25 }}>
        <Button onClick={handleClose} disabled={uploading} color="inherit" variant="outlined">
          {t('risk.table.uploadDrawer.actions.cancel', { defaultValue: 'Cancelar' })}
        </Button>
        <LoadingButton variant="contained" loading={uploading} onClick={handleConfirmUpload} disabled={!file}>
          {t('risk.table.uploadDrawer.actions.upload', { defaultValue: 'Cargar' })}
        </LoadingButton>
      </Box>
    </Drawer>
  );
}

// ----------------------------------------------------------------------

type ApplyFilterProps = {
  inputData: any[];
  filters: { name: string; status: string };
};

function applyFilter({ inputData, filters }: ApplyFilterProps) {
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
    const query = name.trim().toLowerCase();
    if (query) {
      inputData = inputData.filter((item) => {
        const record = item as Record<string, unknown>;

        const directValues = [record.name, record.code, record.description, record.label];
        if (directValues.some((value) => String(value ?? '').toLowerCase().includes(query))) return true;

        return ALL_COLUMNS.some(({ id }) => {
          const value = record[id];
          if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            return String(value).toLowerCase().includes(query);
          }
          if (value && typeof value === 'object' && 'name' in value) {
            const nestedName = (value as { name?: unknown }).name;
            return String(nestedName ?? '').toLowerCase().includes(query);
          }
          return false;
        });
      });
    }
  }

  if (status !== 'all') {
    // TODO: Implement status filtering when the data model includes a status field
  }

  return inputData;
}
