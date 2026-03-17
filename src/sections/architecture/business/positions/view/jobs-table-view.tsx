'use client';

import type { JobFlowNode } from 'src/types/job-flow';
import type { IJob } from 'src/types/architecture/jobs';
import type { JobTypeOption, JobFlowFilters } from '../jobs-table-toolbar';

import { varAlpha } from 'minimal-shared/utils';
import { useBoolean, useSetState } from 'minimal-shared/hooks';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { useMemo, useState, useEffect, useCallback } from 'react';

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
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { JobFlowService } from 'src/services/architecture/business/job-flow.service';
import {
  DeleteJobsService,
  UploadJobsService,
  DownloadJobsExcelService,
  DownloadJobsTemplateService,
  GetJobTypesPaginationService,
} from 'src/services/architecture/business/jobs.service';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  TableNoData,
  TableSkeleton,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { JobsTableRow } from '../jobs-table-row';
import { JobsTableToolbar } from '../jobs-table-toolbar';
import { JobsCreateEditDrawer } from '../jobs-create-edit-drawer';
import { ALL_COLUMNS, DEFAULT_COLUMNS } from '../jobs-table-config';

// ----------------------------------------------------------------------

export function JobsTableView() {
  const { t, i18n } = useTranslate('business');
  const table = useTable();
  const openDrawer = useBoolean();
  const uploadDrawer = useBoolean();

  const [treeData, setTreeData] = useState<JobFlowNode[]>([]);
  const [currentJob, setCurrentJob] = useState<IJob | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_COLUMNS);
  const [jobTypeOptions, setJobTypeOptions] = useState<JobTypeOption[]>([]);
  const [flowFilters, setFlowFilters] = useState<JobFlowFilters>({
    headquarters: '',
    jobTypeId: null,
    actorStatus: null,
    supervises: '',
  });

  const handleToggleColumn = useCallback((columnId: string) => {
    setVisibleColumns((prev) => {
      if (prev.includes(columnId)) {
        return prev.filter((id) => id !== columnId);
      }
      return [...prev, columnId];
    });
  }, []);

  const STATUS_OPTIONS = useMemo(() => [
    { value: 'all', label: t('positions.table.all') },
  ], [t]);

  const TABLE_HEAD = useMemo(() => {
    const dynamicColumns = ALL_COLUMNS.filter((col) => visibleColumns.includes(col.id));
    return [
      { id: '', width: 88 },
      ...dynamicColumns,
    ];
  }, [visibleColumns]);

  const filters = useSetState<{ name: string; status: string }>({
    name: '',
    status: 'all',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const handleFlowFilters = useCallback((next: Partial<JobFlowFilters>) => {
    setFlowFilters((prev) => ({ ...prev, ...next }));
  }, []);

  const flowParams = useMemo(() => {
    const params: Record<string, string | number | boolean | undefined> = {};

    const name = currentFilters.name?.trim();
    if (name) params.name = name;

    const headquarters = flowFilters.headquarters?.trim();
    if (headquarters) params.headquarters = headquarters;

    const supervises = flowFilters.supervises?.trim();
    if (supervises) params.supervises = supervises;

    if (flowFilters.jobTypeId) params.jobTypeId = flowFilters.jobTypeId;
    if (flowFilters.actorStatus) params.actorStatus = flowFilters.actorStatus;

    return Object.keys(params).length ? params : undefined;
  }, [
    currentFilters.name,
    flowFilters.actorStatus,
    flowFilters.headquarters,
    flowFilters.jobTypeId,
    flowFilters.supervises,
  ]);

  // Aplanar jerarquía para mostrar niveles y expansión
  const flattenDataWithHierarchy = useCallback(
    (data: JobFlowNode[], level = 0, parentId?: string): any[] => {
      const flattened: any[] = [];

      data.forEach((item) => {
        const rawData = item.data ?? item;
        const itemData: Record<string, unknown> =
          rawData && typeof rawData === 'object'
            ? (rawData as unknown as Record<string, unknown>)
            : {};
        const itemId = String(item.id || itemData.id || '');

        const flatItem = {
          ...itemData,
          id: itemId,
          code: typeof itemData.code === 'string' ? itemData.code : '',
          name: typeof itemData.name === 'string' && itemData.name ? itemData.name : item.label || '',
          createdAt:
            (typeof itemData.createdAt === 'string' && itemData.createdAt) ||
            (typeof itemData.createdDate === 'string' && itemData.createdDate) ||
            '',
          level,
          parentId,
          hasChildren: Array.isArray(item.children) && item.children.length > 0,
          isExpanded: expandedRows.has(itemId),
          children: item.children || [],
        };

        flattened.push(flatItem);

        if (expandedRows.has(itemId) && Array.isArray(item.children) && item.children.length > 0) {
          const childrenFlattened = flattenDataWithHierarchy(item.children, level + 1, itemId);
          flattened.push(...childrenFlattened);
        }
      });

      return flattened;
    },
    [expandedRows]
  );

  const flattenedData = useMemo(() => flattenDataWithHierarchy(treeData), [flattenDataWithHierarchy, treeData]);

  const countNodes = useCallback((nodes: JobFlowNode[]): number => {
    let count = 0;
    nodes.forEach((n) => {
      count += 1;
      if (Array.isArray(n.children) && n.children.length > 0) {
        count += countNodes(n.children);
      }
    });
    return count;
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await JobFlowService.getFlow(flowParams);
      const data = response.data || [];
      setTreeData(data);
      setExpandedRows(new Set());
      setTotalItems(countNodes(data));
    } catch (error) {
      const message =
        (typeof error === 'string' && error) ||
        (typeof error === 'object' && error && 'message' in error && (error as any).message) ||
        t('positions.table.messages.loadError');
      toast.error(String(message));
      setTreeData([]);
      setExpandedRows(new Set());
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  }, [countNodes, flowParams, t]);

  // Manejar expandir/contraer
  const handleToggleExpand = useCallback((rowId: string, isExpanded: boolean) => {
    if (!isExpanded) {
      setExpandedRows(prev => {
        const next = new Set(prev);
        next.delete(rowId);
        return next;
      });
    } else {
      setExpandedRows(prev => new Set(prev).add(rowId));
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadJobTypes = useCallback(async () => {
    try {
      const res = await GetJobTypesPaginationService({ page: 1, perPage: 1000 });
      const raw = res?.data as unknown;

      let list: unknown[] = [];
      if (Array.isArray(raw)) {
        list = Array.isArray(raw[0]) ? (raw[0] as unknown[]) : raw;
      } else if (raw && typeof raw === 'object' && 'data' in raw) {
        const data = (raw as { data?: unknown }).data;
        list = Array.isArray(data) ? data : [];
      }

      const opts = (Array.isArray(list) ? list : [])
        .map((it) => {
          if (!it || typeof it !== 'object') return null;
          const obj = it as Record<string, unknown>;
          const id = Number(obj.id);
          const label = String(obj.name ?? obj.code ?? `#${obj.id ?? ''}`);
          if (!Number.isFinite(id) || id <= 0) return null;
          return { value: id, label };
        })
        .filter((it): it is JobTypeOption => !!it);

      setJobTypeOptions(opts);
    } catch {
      setJobTypeOptions([]);
    }
  }, []);

  useEffect(() => {
    loadJobTypes();
  }, [loadJobTypes]);

  const handleDownloadTemplate = useCallback(
    async () => {
      try {
        const response = await DownloadJobsTemplateService();
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'jobs_template.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (error) {
        console.error(error);
        toast.error(t('positions.table.messages.downloadError') || 'Error downloading template');
      }
    },
    [t]
  );

  const handleDownloadExcel = useCallback(async () => {
    try {
      setDownloading(true);
      const currentLang = i18n.language || 'es';
      const params: Record<string, string | number | boolean> = {
        ...currentFilters,
        columns: visibleColumns.join(','),
        lang: currentLang,
      };

      const name = currentFilters.name?.trim();
      if (name) params.name = name;

      const headquarters = flowFilters.headquarters?.trim();
      if (headquarters) params.headquarters = headquarters;

      const supervises = flowFilters.supervises?.trim();
      if (supervises) params.supervises = supervises;

      if (flowFilters.jobTypeId) params.jobTypeId = flowFilters.jobTypeId;
      if (flowFilters.actorStatus) params.actorStatus = flowFilters.actorStatus;

      const response = await DownloadJobsExcelService(params);
      const blob = new Blob([response?.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'jobs.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      toast.error(t('positions.table.messages.downloadError') || 'Error downloading excel');
    } finally {
      setDownloading(false);
    }
  }, [t, currentFilters, visibleColumns, i18n.language, flowFilters]);

  const handleUpload = useCallback(
    async (file: File) => {
      try {
        setUploading(true);
        await UploadJobsService(file);
        toast.success(t('positions.table.messages.uploadSuccess') || 'Upload success');
        loadData();
      } catch (error) {
        console.error(error);
        toast.error(t('positions.table.messages.uploadError') || 'Error uploading file');
      } finally {
        setUploading(false);
      }
    },
    [loadData, t]
  );

  const handleFilterStatus = useCallback(
    (_event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      updateFilters({ status: newValue });
    },
    [table, updateFilters]
  );

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        await DeleteJobsService(id);
        toast.success(t('positions.table.messages.deleteSuccess'));
        loadData();
      } catch (error) {
        const message =
          (typeof error === 'string' && error) ||
          (typeof error === 'object' && error && 'message' in error && (error as any).message) ||
          t('positions.table.messages.deleteError');
        toast.error(String(message));
      }
    },
    [loadData, t]
  );

  const handleEditRow = useCallback((row: IJob) => {
    setCurrentJob(row);
    openDrawer.onTrue();
  }, [openDrawer]);

  const hasAnyFilter = !!currentFilters.name?.trim() || !!flowFilters.headquarters?.trim() || !!flowFilters.supervises?.trim() || !!flowFilters.jobTypeId || !!flowFilters.actorStatus;
  const notFound = !flattenedData.length && hasAnyFilter;

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('positions.table.title')}
          links={[
            { name: t('positions.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('positions.breadcrumbs.architecture'), href: paths.dashboard.architecture.positionsTable },
            { name: t('positions.breadcrumbs.positions') },
          ]}
          action={
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                component={RouterLink}
                href={paths.dashboard.architecture.positionsMap}
                variant="outlined"
                startIcon={<Iconify icon="solar:map-point-bold" />}
              >
                {t('positions.table.actions.organigram', { defaultValue: 'Organigrama' })}
              </Button>

              <LoadingButton
                variant="outlined"
                loading={uploading}
                startIcon={<Iconify icon="eva:cloud-upload-fill" />}
                onClick={uploadDrawer.onTrue}
              >
                {t('positions.table.actions.upload', { defaultValue: 'Cargar Plantilla' })}
              </LoadingButton>

              <LoadingButton
                variant="outlined"
                loading={downloading}
                startIcon={<Iconify icon="solar:download-bold" />}
                onClick={handleDownloadExcel}
              >
                {t('positions.table.actions.download', { defaultValue: 'Exportar Excel' })}
              </LoadingButton>

              <Button
                component={RouterLink}
                href="#"
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentJob(undefined);
                  openDrawer.onTrue();
                }}
              >
                {t('positions.table.actions.create', { defaultValue: 'Agregar Cargo' })}
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

        <JobsTableToolbar
          filters={{ name: currentFilters.name }}
          onFilters={(name, value) => {
            table.onResetPage();
            updateFilters({ [name]: value });
          }}
          visibleColumns={visibleColumns}
          onChangeColumns={handleToggleColumn}
          jobTypeOptions={jobTypeOptions}
          flowFilters={flowFilters}
          onFlowFilters={handleFlowFilters}
        />

        <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
              <TableHeadCustom
                headCells={TABLE_HEAD}
                rowCount={flattenedData.length}
                numSelected={table.selected.length}
              />

              <TableBody>
                {isLoading ? (
                  <TableSkeleton rowCount={8} cellCount={4} />
                ) : (
                  flattenedData
                    .slice(table.page * table.rowsPerPage, table.page * table.rowsPerPage + table.rowsPerPage)
                    .map((row) => (
                      <JobsTableRow
                        key={row.id}
                        row={row}
                        selected={table.selected.includes(String(row.id))}
                        onSelectRow={() => table.onSelectRow(String(row.id))}
                        onDeleteRow={() => handleDeleteRow(String(row.id))}
                        onEditRow={() => handleEditRow(row)}
                        onToggleExpand={handleToggleExpand}
                        visibleColumns={visibleColumns}
                      />
                    ))
                )}

                <TableNoData notFound={notFound} />
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>

        <TablePaginationCustom
          page={table.page}
          dense={table.dense}
          count={flattenedData.length}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onChangeDense={table.onChangeDense}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>

        <JobsCreateEditDrawer
          open={openDrawer.value}
          onClose={openDrawer.onFalse}
          currentJob={currentJob}
          onLoadData={loadData}
        />
      </DashboardContent>

      <JobsUploadTemplateDrawer
        open={uploadDrawer.value}
        uploading={uploading}
        onClose={uploadDrawer.onFalse}
        onDownloadTemplate={handleDownloadTemplate}
        onUpload={handleUpload}
      />
    </>
  );
}

type JobsUploadTemplateDrawerProps = {
  open: boolean;
  uploading: boolean;
  onClose: () => void;
  onDownloadTemplate: () => void;
  onUpload: (file: File) => Promise<void>;
};

function JobsUploadTemplateDrawer({
  open,
  uploading,
  onClose,
  onDownloadTemplate,
  onUpload,
}: JobsUploadTemplateDrawerProps) {
  const { t } = useTranslate('business');
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
        const msg = t('positions.table.uploadDrawer.errors.tooManyFiles', { defaultValue: 'Solo se permite 1 archivo.' });
        setError(msg);
        toast.error(msg);
        return;
      }

      if (code === 'file-invalid-type') {
        const msg = t('positions.table.uploadDrawer.errors.invalidType', {
          defaultValue: 'Formato no permitido. Usa .xlsx o .xls.',
        });
        setError(msg);
        toast.error(msg);
        return;
      }

      const msg = t('positions.table.uploadDrawer.errors.generic', {
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
      const msg = t('positions.table.uploadDrawer.errors.noFile', { defaultValue: 'Selecciona un archivo.' });
      setError(msg);
      toast.error(msg);
      return;
    }
    try {
      await onUpload(file);
      onClose();
    } catch {
      const msg = t('positions.table.uploadDrawer.errors.generic', {
        defaultValue: 'No se pudo cargar el archivo. Intenta nuevamente.',
      });
      setError(msg);
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
          {t('positions.table.uploadDrawer.title', { defaultValue: 'Cargar cargos por Lote' })}
        </Typography>
        <IconButton
          aria-label={t('positions.table.uploadDrawer.actions.close', { defaultValue: 'Cerrar' })}
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
              {t('positions.table.uploadDrawer.instructions.title', { defaultValue: 'Instrucciones' })}
            </Typography>
          </Stack>

          <Box
            component="ul"
            sx={{
              m: 0,
              pl: 2,
              display: 'grid',
              gap: 0.5,
              typography: 'body2',
              color: 'text.secondary',
            }}
          >
            <li>
              <Typography variant="body2" color="text.secondary">
                {t('positions.table.uploadDrawer.instructions.step1', {
                  defaultValue: 'Descarga la plantilla Excel con el formato requerido.',
                })}{' '}
                <Button
                  size="small"
                  variant="text"
                  onClick={onDownloadTemplate}
                  disabled={uploading}
                  sx={{ p: 0, minWidth: 'unset', textTransform: 'none', verticalAlign: 'baseline' }}
                >
                  {t('positions.table.uploadDrawer.instructions.downloadLink', { defaultValue: 'Descargar plantilla' })}
                </Button>
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                {t('positions.table.uploadDrawer.instructions.step2', {
                  defaultValue: 'Completa el archivo con las columnas: CODIGO_CARGO, NOMBRE_CARGO, CODIGO_CARGO_PADRE.',
                })}
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                {t('positions.table.uploadDrawer.instructions.step3', {
                  defaultValue: 'Guarda el archivo sin espacios ni caracteres especiales en el nombre.',
                })}
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                {t('positions.table.uploadDrawer.instructions.step4', {
                  defaultValue: 'Arrastra y suelta el archivo o haz clic para seleccionarlo.',
                })}
              </Typography>
            </li>
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
                  ? t('positions.table.uploadDrawer.drop.selectedTitle', { defaultValue: 'Archivo seleccionado' })
                  : t('positions.table.uploadDrawer.drop.title', { defaultValue: 'Seleccionar archivo Excel' })}
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
                    {t('positions.table.uploadDrawer.actions.remove', { defaultValue: 'Quitar' })}
                  </Button>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t('positions.table.uploadDrawer.drop.subtitle', {
                    defaultValue: 'o haz clic para seleccionar desde tu dispositivo',
                  })}
                </Typography>
              )}

              <Typography variant="caption" color="text.disabled">
                {t('positions.table.uploadDrawer.drop.formats', {
                  defaultValue: 'Formatos permitidos: .xlsx, .xls • 1 archivo',
                })}
              </Typography>
            </Stack>
          </Box>

          {!!error && (
            <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 1 }}>
              {error}
            </Typography>
          )}
        </Box>
      </Box>

      <Box sx={{ px: 3, py: 2, borderTop: (theme) => `1px solid ${theme.vars.palette.divider}`, display: 'flex', justifyContent: 'flex-end', gap: 1.25 }}>
        <Button onClick={handleClose} disabled={uploading} color="inherit" variant="outlined">
          {t('positions.table.uploadDrawer.actions.cancel', { defaultValue: 'Cancelar' })}
        </Button>
        <LoadingButton variant="contained" loading={uploading} onClick={handleConfirmUpload} disabled={!file}>
          {t('positions.table.uploadDrawer.actions.upload', { defaultValue: 'Cargar' })}
        </LoadingButton>
      </Box>
    </Drawer>
  );
}
