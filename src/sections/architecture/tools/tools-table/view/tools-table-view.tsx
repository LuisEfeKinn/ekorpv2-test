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
import { useRouter } from 'src/routes/hooks/use-router';
import { usePathname } from 'src/routes/hooks/use-pathname';
import { useSearchParams } from 'src/routes/hooks/use-search-params';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetToolTypesPaginationService } from 'src/services/architecture/catalogs/toolTypes.service';
import {
  UploadToolsService,
  GetToolsFlowService,
  DeleteToolsTableService,
  DownloadToolsExcelService,
  DownloadToolsTemplateService,
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
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import { ToolsTableRow } from '../tools-table-row';
import { ToolsTableDrawer } from '../tools-table-drawer';
import { ToolsFiltersResult } from '../tools-table-filters-result';
import { ALL_COLUMNS, DEFAULT_COLUMNS } from '../tools-table-config';
import { ToolsTableToolbar, type ToolTypeOption } from '../tools-table-toolbar';

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export function ToolsTableView() {
  const { t } = useTranslate('architecture');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const table = useTable();
  const confirmDialog = useBoolean();
  const modalDialog = useBoolean();
  const uploadDrawer = useBoolean();
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [tableData, setTableData] = useState<any[]>([]);
  const [originalData, setOriginalData] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedToolId, setSelectedToolId] = useState<string | undefined>(undefined);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_COLUMNS);
  const [toolTypeOptions, setToolTypeOptions] = useState<ToolTypeOption[]>([]);

  const handleToggleColumn = useCallback((columnId: string) => {
    setVisibleColumns((prev) => {
      if (prev.includes(columnId)) {
        return prev.filter((id) => id !== columnId);
      }
      return [...prev, columnId];
    });
  }, []);

  const STATUS_OPTIONS = useMemo(() => [
    { value: 'all', label: t('tools.table.table.filters.all') },
  ], [t]);

  const TABLE_HEAD = useMemo(() => {
    const dynamicColumns = ALL_COLUMNS.filter((col) => visibleColumns.includes(col.id));
    return [
      { id: '', width: 88 },
      ...dynamicColumns,
    ];
  }, [visibleColumns]);

  type ToolsTableFilters = {
    name: string;
    status: string;
  };

  const filters = useSetState<ToolsTableFilters>({
    name: '',
    status: 'all',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const nameFromQuery = useMemo(() => searchParams.get('name') ?? '', [searchParams]);

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
    if (nameFromQuery !== currentFilters.name) {
      table.onResetPage();
      updateFilters({ name: nameFromQuery });
    }
  }, [currentFilters.name, nameFromQuery, table, updateFilters]);

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
    (items: unknown[]): ToolTypeOption[] =>
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
        .filter((opt): opt is ToolTypeOption => !!opt),
    []
  );

  const loadToolTypes = useCallback(async () => {
    try {
      const res = await GetToolTypesPaginationService({ page: 1, perPage: 200 });
      setToolTypeOptions(mapOptions(extractList(res?.data)));
    } catch {
      setToolTypeOptions([]);
    }
  }, [extractList, mapOptions]);

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
      const params: Record<string, string | number | boolean | undefined> = {};
      const q = debouncedName.trim();
      if (q) params.name = q;
      if (typeFromQuery !== null) params.type = typeFromQuery;

      const response = await GetToolsFlowService(Object.keys(params).length ? params : undefined);
      const data = response.data || [];

      setOriginalData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading tools:', error);
      toast.error(t('tools.table.messages.error.loading'));
      setOriginalData([]);
    }
  }, [debouncedName, t, typeFromQuery]);

  // Cargar datos cuando cambian los parámetros
  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadToolTypes();
  }, [loadToolTypes]);

  useEffect(() => {
    const flattenedData = flattenDataWithHierarchy(originalData);
    setTableData(flattenedData);
    setTotalItems(flattenedData.length);
  }, [originalData, flattenDataWithHierarchy]);

  // Aplicar filtros
  const dataFiltered = applyFilter({
    inputData: Array.isArray(tableData) ? tableData : [],
    filters: currentFilters,
  });

  const canReset = !!currentFilters.name || currentFilters.status !== 'all' || typeFromQuery !== null;
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
    (_: React.SyntheticEvent, newValue: string) => {
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

  const handleDownloadTemplate = useCallback(async () => {
    try {
      const response = await DownloadToolsTemplateService();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'tools_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(t('tools.table.messages.success.downloaded', { defaultValue: 'Template downloaded successfully' }));
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error(t('tools.table.messages.error.downloading', { defaultValue: 'Error al descargar la plantilla' }));
    }
  }, [t]);

  const handleDownloadExcel = useCallback(async () => {
    try {
      setDownloading(true);
      const params: Record<string, string | number | boolean | undefined> & { columns: string } = {
        columns: visibleColumns.join(','),
      };
      const q = nameFromQuery.trim();
      if (q) params.name = q;
      if (typeFromQuery !== null) params.type = typeFromQuery;

      const response = await DownloadToolsExcelService(params);
      const blob = new Blob([response?.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tools.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading tools excel:', error);
      toast.error(t('tools.table.messages.error.downloading_excel', { defaultValue: 'Error downloading Excel' }));
    } finally {
      setDownloading(false);
    }
  }, [nameFromQuery, t, typeFromQuery, visibleColumns]);

  const handleUploadExcel = useCallback(async (file: File) => {
    try {
      setUploading(true);
      await UploadToolsService(file);
      toast.success(t('tools.table.messages.success.uploaded', { defaultValue: 'Uploaded successfully' }));
      loadData();
    } catch (error) {
      console.error('Error uploading tools file:', error);
      toast.error(t('tools.table.messages.error.uploading', { defaultValue: 'Error uploading file' }));
      throw error;
    } finally {
      setUploading(false);
    }
  }, [t, loadData]);

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
            <Box sx={{ display: 'flex', gap: 1 }}>
              <LoadingButton
                onClick={uploadDrawer.onTrue}
                loading={uploading}
                variant="outlined"
                startIcon={<Iconify icon="eva:cloud-upload-fill" />}
              >
                {t('tools.table.actions.upload') || 'Cargar'}
              </LoadingButton>
              <LoadingButton
                onClick={handleDownloadExcel}
                loading={downloading}
                variant="outlined"
                startIcon={<Iconify icon="solar:download-bold" />}
              >
                {t('tools.table.actions.download') || 'Descargar'}
              </LoadingButton>
              <Button
                onClick={() => handleOpenModal(undefined)}
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
              >
                {t('tools.table.actions.add')}
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
            visibleColumns={visibleColumns}
            onChangeColumns={handleToggleColumn}
            type={typeFromQuery}
            onTypeChange={handleTypeChange}
            toolTypeOptions={toolTypeOptions}
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

      <ToolsUploadTemplateDrawer
        open={uploadDrawer.value}
        uploading={uploading}
        onClose={uploadDrawer.onFalse}
        onDownloadTemplate={handleDownloadTemplate}
        onUpload={handleUploadExcel}
      />

      <ToolsTableDrawer
        open={modalDialog.value}
        onClose={handleCloseModal}
        toolId={selectedToolId}
        onSave={handleSaveModal}
      />
    </>
  );
}

type ToolsUploadTemplateDrawerProps = {
  open: boolean;
  uploading: boolean;
  onClose: () => void;
  onDownloadTemplate: () => void;
  onUpload: (file: File) => Promise<void>;
};

function ToolsUploadTemplateDrawer({
  open,
  uploading,
  onClose,
  onDownloadTemplate,
  onUpload,
}: ToolsUploadTemplateDrawerProps) {
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
        const msg = t('tools.table.uploadDrawer.errors.tooManyFiles', { defaultValue: 'Solo se permite 1 archivo.' });
        setError(msg);
        toast.error(msg);
        return;
      }

      if (code === 'file-invalid-type') {
        const msg = t('tools.table.uploadDrawer.errors.invalidType', {
          defaultValue: 'Formato no permitido. Usa .xlsx o .xls.',
        });
        setError(msg);
        toast.error(msg);
        return;
      }

      const msg = t('tools.table.uploadDrawer.errors.generic', {
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
      const msg = t('tools.table.uploadDrawer.errors.noFile', { defaultValue: 'Selecciona un archivo.' });
      setError(msg);
      toast.error(msg);
      return;
    }

    try {
      await onUpload(file);
      onClose();
    } catch {
      const msg = t('tools.table.uploadDrawer.errors.generic', {
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
          {t('tools.table.uploadDrawer.title', { defaultValue: 'Cargar herramientas por Lote' })}
        </Typography>
        <IconButton
          aria-label={t('tools.table.uploadDrawer.actions.close', { defaultValue: 'Cerrar' })}
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
              {t('tools.table.uploadDrawer.instructions.title', { defaultValue: 'Instrucciones' })}
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
              {t('tools.table.uploadDrawer.instructions.description', {
                defaultValue: 'Siga las siguientes instrucciones para cargar la plantilla de herramientas:',
              })}
            </Typography>

            <Box component="ol" sx={{ m: 0, pl: 2, display: 'grid', gap: 0.5 }}>
              <li>
                <Typography variant="body2" color="text.secondary">
                  {t('tools.table.uploadDrawer.instructions.step1', {
                    defaultValue:
                      'Debe crear un archivo Excel con las siguientes columnas como encabezado: CODIGO_HERRAMIENTA, NOMBRE_HERRAMIENTA, CODIGO_HERRAMIENTA_PADRE.',
                  })}
                </Typography>
              </li>
              <li>
                <Typography variant="body2" color="text.secondary">
                  {t('tools.table.uploadDrawer.instructions.step2', {
                    defaultValue:
                      'Ingrese el listado de herramientas a cargar, guarde el archivo con un nombre que no contenga espacios ni caracteres especiales.',
                  })}
                </Typography>
              </li>
              <li>
                <Typography variant="body2" color="text.secondary">
                  {t('tools.table.uploadDrawer.instructions.step3', {
                    defaultValue:
                      "Puede arrastrar y soltar el archivo guardado en el cuadro a continuación, o seleccionarlo mediante el botón 'Seleccionar archivo'.",
                  })}
                </Typography>
              </li>
              <li>
                <Typography variant="body2" color="text.secondary">
                  {t('tools.table.uploadDrawer.instructions.step4', {
                    defaultValue: "Haga clic en el botón 'Cargar' para iniciar el proceso de cargue.",
                  })}
                </Typography>
              </li>
            </Box>
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
                  ? t('tools.table.uploadDrawer.drop.selectedTitle', { defaultValue: 'Archivo seleccionado' })
                  : t('tools.table.uploadDrawer.drop.title', { defaultValue: 'Seleccionar archivo Excel' })}
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
                    {t('tools.table.uploadDrawer.actions.remove', { defaultValue: 'Quitar' })}
                  </Button>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t('tools.table.uploadDrawer.drop.subtitle', {
                    defaultValue: 'o haz clic para seleccionar desde tu dispositivo',
                  })}
                </Typography>
              )}

              <Typography variant="caption" color="text.disabled">
                {t('tools.table.uploadDrawer.drop.formats', {
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
            {t('tools.table.actions.downloadTemplate', { defaultValue: 'Descargar Plantilla' })}
          </Button>
        </Box>
      </Box>

      <Box sx={{ px: 3, py: 2, borderTop: (theme) => `1px solid ${theme.vars.palette.divider}`, display: 'flex', justifyContent: 'flex-end', gap: 1.25 }}>
        <Button onClick={handleClose} disabled={uploading} color="inherit" variant="outlined">
          {t('tools.table.uploadDrawer.actions.cancel', { defaultValue: 'Cancelar' })}
        </Button>
        <LoadingButton variant="contained" loading={uploading} onClick={handleConfirmUpload} disabled={!file}>
          {t('tools.table.uploadDrawer.actions.upload', { defaultValue: 'Cargar' })}
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
  // Preservar el orden jerárquico tal como viene del aplanado

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
