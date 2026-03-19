'use client';

import type {
  IStrategicObjective,
  IStrategicObjectiveFilters,
  IStrategicObjectiveFlowNode,
} from 'src/types/architecture/strategic-objectives';

import dayjs from 'dayjs';
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
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetObjectiveTypesPaginationService } from 'src/services/architecture/catalogs/objectiveTypes.service';
import {
  DeleteObjectivesService,
  GetObjectivesByIdService,
  GetObjectivesFlowService,
  UploadObjectivesExcelService,
  DownloadObjectivesExcelService,
  DownloadObjectivesTemplateService,
} from 'src/services/architecture/business/objectives.service';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { StrategicObjectivesTableRow } from '../strategic-objectives-table-row';
import { StrategicObjectivesCreateForm } from '../strategic-objectives-create-form';
import { ALL_COLUMNS, FIXED_COLUMNS, DEFAULT_COLUMNS } from '../strategic-objectives-table-config';
import {
  type ObjectiveTypeOption,
  type ObjectiveFlowFilters,
  StrategicObjectivesTableToolbar,
} from '../strategic-objectives-table-toolbar';

// ----------------------------------------------------------------------

type FlowResponse = { data?: unknown };

const normalizeObjective = (raw: unknown): IStrategicObjective | null => {
  if (!raw) return null;
  if (raw && typeof raw === 'object' && 'data' in (raw as { data?: unknown })) {
    const nested = (raw as { data?: unknown }).data;
    if (nested && typeof nested === 'object') return nested as IStrategicObjective;
  }
  if (raw && typeof raw === 'object') return raw as IStrategicObjective;
  return null;
};

const normalizeFlowData = (raw: unknown): IStrategicObjectiveFlowNode[] => {
  if (Array.isArray(raw)) {
    return raw as IStrategicObjectiveFlowNode[];
  }
  if (raw && typeof raw === 'object' && Array.isArray((raw as FlowResponse).data)) {
    return (raw as FlowResponse).data as IStrategicObjectiveFlowNode[];
  }
  return [];
};

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const pickString = (value: unknown): string | null => (typeof value === 'string' ? value : null);

const getRecordString = (value: unknown, key: string): string | null =>
  isRecord(value) ? pickString(value[key]) : null;

const getRecordUnknown = (value: unknown, key: string): unknown =>
  isRecord(value) ? value[key] : undefined;

const stringifyUnknown = (value: unknown) => {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const formatUploadErrorDetails = (details: unknown): string[] => {
  if (!details) return [];

  if (Array.isArray(details)) {
    return details
      .map((item) => {
        const asString = pickString(item);
        if (asString) return asString;

        if (isRecord(item)) {
          const row = getRecordString(item, 'row') ?? (typeof item.row === 'number' ? String(item.row) : null);
          const message = getRecordString(item, 'message') ?? getRecordString(item, 'error');
          const errors = getRecordUnknown(item, 'errors');
          const errorsList = Array.isArray(errors)
            ? errors.map((e) => pickString(e) ?? stringifyUnknown(e)).filter(Boolean)
            : [];

          if (row && message) return `Fila ${row}: ${message}`;
          if (row && errorsList.length) return `Fila ${row}: ${errorsList.join(', ')}`;
          if (message) return message;
        }

        return stringifyUnknown(item);
      })
      .filter((line): line is string => Boolean(line));
  }

  const asString = pickString(details);
  if (asString) return [asString];

  if (isRecord(details)) {
    const message = getRecordString(details, 'message');
    if (message) return [message];
  }

  return [stringifyUnknown(details)];
};

const parseJsonObject = (value: string): UnknownRecord | null => {
  const trimmed = value.trim();
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return null;

  try {
    const parsed: unknown = JSON.parse(trimmed);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const REQUIRED_FIELD_LABELS: Record<string, string> = {
  code: 'Código',
  name: 'Nombre',
  nomenclature: 'Código',
  nomenclatura: 'Código',
};

const getUploadErrorMessage = (error: unknown) => {
  const direct = pickString(error);
  if (direct) {
    const parsed = parseJsonObject(direct);
    if (parsed) return getUploadErrorMessage(parsed);
    return direct;
  }

  const statusCodeValue = getRecordUnknown(error, 'statusCode') ?? getRecordUnknown(getRecordUnknown(error, 'data'), 'statusCode');
  const statusCode = typeof statusCodeValue === 'number' ? statusCodeValue : null;

  const msg =
    getRecordString(error, 'message') ??
    getRecordString(getRecordUnknown(error, 'data'), 'message') ??
    getRecordString(error, 'error') ??
    getRecordString(getRecordUnknown(error, 'data'), 'error');

  const normalizedMsg = msg ? (parseJsonObject(msg)?.message ? getRecordString(parseJsonObject(msg), 'message') ?? msg : msg) : null;

  const rawDetails =
    getRecordUnknown(error, 'details') ??
    getRecordUnknown(error, 'errors') ??
    getRecordUnknown(getRecordUnknown(error, 'data'), 'details') ??
    getRecordUnknown(getRecordUnknown(error, 'data'), 'errors');

  const detailLines = formatUploadErrorDetails(rawDetails);

  if (normalizedMsg) {
    const missingFieldMatch = normalizedMsg.match(/Campo requerido faltante:\s*([A-Za-z0-9_]+)/i);
    if (missingFieldMatch) {
      const rawField = missingFieldMatch[1] ?? '';
      const fieldLabel = REQUIRED_FIELD_LABELS[rawField] ?? rawField;

      const base = 'Archivo inválido o plantilla incorrecta.';
      const fieldLine = fieldLabel
        ? `Hay registros con el campo requerido faltante: ${fieldLabel}.`
        : 'Hay registros con campos requeridos faltantes.';

      const lines = [base, fieldLine];
      if (detailLines.length) lines.push(...detailLines.slice(0, 8));
      return lines.join('\n');
    }
  }

  const base =
    normalizedMsg ??
    (statusCode === 400 ? 'Archivo inválido o plantilla incorrecta.' : 'No se pudo cargar el archivo. Intenta nuevamente.');
  if (!detailLines.length) return base;

  const maxLines = 8;
  const shown = detailLines.slice(0, maxLines);
  const rest = detailLines.length - shown.length;
  const suffix = rest > 0 ? [`…y ${rest} más.`] : [];

  return [base, ...shown, ...suffix].join('\n');
};

const isFixedColumn = (columnId: string) => (FIXED_COLUMNS as readonly string[]).includes(columnId);

const getSanitizedVisibleColumns = (columns: string[]) => {
  const columnSet = new Set(columns);
  FIXED_COLUMNS.forEach((col) => columnSet.add(col));

  return ALL_COLUMNS.map((col) => col.id).filter((colId) => columnSet.has(colId));
};

export function StrategicObjectivesTableView() {
  const { t } = useTranslate('architecture');
  const table = useTable();
  const openDrawer = useBoolean();
  const uploadDialog = useBoolean();
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentObjective, setCurrentObjective] = useState<IStrategicObjective | null>(null);

  const [tableData, setTableData] = useState<IStrategicObjectiveFlowNode[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() =>
    getSanitizedVisibleColumns(DEFAULT_COLUMNS)
  );
  const [objectiveTypeOptions, setObjectiveTypeOptions] = useState<ObjectiveTypeOption[]>([]);
  const [flowFilters, setFlowFilters] = useState<ObjectiveFlowFilters>({
    type: null,
    objectiveLevel: null,
    startDate: null,
    endDate: null,
  });

  const handleFlowFilters = useCallback(
    (next: Partial<ObjectiveFlowFilters>) => {
      setFlowFilters((prev) => {
        const merged: ObjectiveFlowFilters = { ...prev, ...next };

        if (merged.startDate && merged.endDate && merged.endDate.isBefore(merged.startDate, 'day')) {
          toast.error('La fecha de fin no puede ser menor a la fecha de inicio');
          return { ...merged, endDate: null };
        }

        return merged;
      });
    },
    []
  );

  const flowParams = useMemo(() => {
    const params: Record<string, string | number | boolean | undefined> = {};

    if (flowFilters.type) params.type = flowFilters.type;
    if (flowFilters.objectiveLevel) params.objectiveLevel = flowFilters.objectiveLevel;
    if (flowFilters.startDate) params.startDate = dayjs(flowFilters.startDate).format('YYYY-MM-DD');
    if (flowFilters.endDate) params.endDate = dayjs(flowFilters.endDate).format('YYYY-MM-DD');

    return Object.keys(params).length ? params : undefined;
  }, [flowFilters.endDate, flowFilters.objectiveLevel, flowFilters.startDate, flowFilters.type]);

  const handleToggleColumn = useCallback((columnId: string) => {
    if (isFixedColumn(columnId)) return;
    setVisibleColumns((prev) => {
      const nextSet = new Set(prev);

      if (nextSet.has(columnId)) nextSet.delete(columnId);
      else nextSet.add(columnId);

      return getSanitizedVisibleColumns(Array.from(nextSet));
    });
  }, []);

  const TABLE_HEAD = useMemo(() => {
    const dynamicColumns = ALL_COLUMNS.filter((col) => visibleColumns.includes(col.id));
    return [
      { id: '', width: 88 },
      ...dynamicColumns,
    ];
  }, [visibleColumns]);

  const STATUS_OPTIONS = useMemo(() => [
    { value: 'all', label: 'Todas' },
  ], []);

  const filters = useSetState<IStrategicObjectiveFilters & { status: string }>({
    name: '',
    status: 'all',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const handleFilterStatus = useCallback(
    (_event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      updateFilters({ status: newValue });
    },
    [table, updateFilters]
  );

  type FlattenedObjectiveRow = IStrategicObjective & {
    label: string;
    level: number;
    parentId?: number;
    hasChildren: boolean;
    children?: IStrategicObjectiveFlowNode[];
  };

  const flattenDataWithHierarchy = useCallback((data: IStrategicObjectiveFlowNode[], level = 0, parentId?: number): FlattenedObjectiveRow[] => {
    const flattened: FlattenedObjectiveRow[] = [];

    data.forEach((item) => {
      if (!item) return;
      
      const flatItem: FlattenedObjectiveRow = {
        ...item.data,
        id: item.id,
        label: item.label,
        level,
        parentId,
        hasChildren: (item.children?.length ?? 0) > 0,
        children: item.children
      };

      flattened.push(flatItem);

      if (expandedRows.has(Number(item.id)) && Array.isArray(item.children)) {
        flattened.push(...flattenDataWithHierarchy(item.children, level + 1, item.id));
      }
    });

    return flattened;
  }, [expandedRows]);

  const loadObjectiveTypes = useCallback(async () => {
    try {
      const res = await GetObjectiveTypesPaginationService({ page: 1, perPage: 1000 });
      const raw = res?.data;

      let list: unknown[] = [];
      if (Array.isArray(raw)) {
        list = raw.length > 0 && Array.isArray(raw[0]) ? raw[0] : raw;
      } else if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)) {
        list = (raw as { data: unknown[] }).data;
      }

      const opts: ObjectiveTypeOption[] = list
        .map((it) => {
          if (!it || typeof it !== 'object') return null;
          const obj = it as Record<string, unknown>;
          const id = Number(obj.id);
          const label = String(obj.typeName ?? obj.name ?? obj.code ?? `#${obj.id ?? ''}`);
          if (!Number.isFinite(id) || id <= 0) return null;
          return { value: id, label };
        })
        .filter((it): it is ObjectiveTypeOption => !!it);

      setObjectiveTypeOptions(opts);
    } catch {
      setObjectiveTypeOptions([]);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const response = await GetObjectivesFlowService(flowParams);

      const list = normalizeFlowData(response?.data);

      setTableData(list);
      setExpandedRows(new Set());
      setTotalItems(list.length); // Total root items or total items? For tree view, pagination is tricky.
    } catch (error) {
      console.error('Error loading objectives:', error);
      setTableData([]);
      setTotalItems(0);
    }
  }, [flowParams]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadObjectiveTypes();
  }, [loadObjectiveTypes]);

  const handleToggleExpand = (id: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleOpenCreate = useCallback(() => {
    setCurrentObjective(null);
    openDrawer.onTrue();
  }, [openDrawer]);

  const handleCloseDrawer = useCallback(() => {
    openDrawer.onFalse();
    setCurrentObjective(null);
  }, [openDrawer]);

  const handleEditRow = useCallback(
    async (id: number) => {
      setCurrentObjective(null);
      openDrawer.onTrue();

      try {
        const response = await GetObjectivesByIdService(id);
        const normalized = normalizeObjective(response?.data);
        if (normalized) {
          setCurrentObjective(normalized);
        } else {
          toast.error('No se pudo cargar el objetivo');
        }
      } catch (error) {
        console.error('Error loading objective:', error);
        toast.error('No se pudo cargar el objetivo');
      }
    },
    [openDrawer]
  );

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        await DeleteObjectivesService(id);
        loadData();
        toast.success('Objetivo estratégico eliminado con éxito');
      } catch (error) {
        console.error('Error deleting objective:', error);
        toast.error('No se pudo eliminar el objetivo');
      }
    },
    [loadData]
  );

  const handleDownloadExcel = useCallback(async () => {
    try {
      setDownloading(true);
      const trimmedName = currentFilters.name.trim();
      const hasNameFilter = trimmedName.length > 0;
      const hasStatusFilter = currentFilters.status !== 'all';
      const hasFlowFilters = Boolean(
        flowFilters.type || flowFilters.objectiveLevel || flowFilters.startDate || flowFilters.endDate
      );

      const shouldSendParams = hasNameFilter || hasStatusFilter || hasFlowFilters;

      let params: Record<string, string | number | boolean> | undefined;

      if (shouldSendParams) {
        const nextParams: Record<string, string | number | boolean> = {
          columns: visibleColumns.join(','),
        };

        if (hasNameFilter) nextParams.name = trimmedName;
        if (hasStatusFilter) nextParams.status = currentFilters.status;
        if (flowFilters.type) nextParams.objectiveTypeId = flowFilters.type;
        if (flowFilters.objectiveLevel) nextParams.objectiveLevel = flowFilters.objectiveLevel;
        if (flowFilters.startDate) {
          nextParams.startDate = dayjs(flowFilters.startDate).format('YYYY-MM-DD');
        }
        if (flowFilters.endDate) {
          nextParams.endDate = dayjs(flowFilters.endDate).format('YYYY-MM-DD');
        }

        params = nextParams;
      }

      const response = await DownloadObjectivesExcelService(params);
      const blob = new Blob([response?.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'objectives.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading objectives excel:', error);
      toast.error(t('strategicObjectives.table.messages.downloadError', { defaultValue: 'Error al descargar el archivo' }));
    } finally {
      setDownloading(false);
    }
  }, [t, currentFilters, flowFilters.endDate, flowFilters.objectiveLevel, flowFilters.startDate, flowFilters.type, visibleColumns]);

  const handleDownloadTemplate = useCallback(async () => {
    try {
      const response = await DownloadObjectivesTemplateService();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'objectives_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error(t('strategicObjectives.table.messages.downloadError', { defaultValue: 'Error al descargar la plantilla' }));
    }
  }, [t]);

  const handleUploadExcel = useCallback(async (file: File) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      const response = await UploadObjectivesExcelService(formData);
      const rawData: unknown = response?.data;
      const rawMessage =
        rawData && typeof rawData === 'object'
          ? ('message' in (rawData as { message?: unknown })
              ? (rawData as { message?: unknown }).message
              : 'data' in (rawData as { data?: unknown })
                ? (rawData as { data?: unknown }).data
                : undefined)
          : undefined;
      const nestedMessage =
        rawMessage && typeof rawMessage === 'object' && 'message' in (rawMessage as { message?: unknown })
          ? (rawMessage as { message?: unknown }).message
          : rawMessage;
      const messageText = typeof nestedMessage === 'string' ? nestedMessage.toLowerCase() : '';

      if (messageText.includes('sin cambios') || messageText.includes('no changes')) {
        toast.info(t('strategicObjectives.table.messages.uploadNoChanges', { defaultValue: 'No hubo cambios en los objetivos' }));
      } else {
        toast.success(t('strategicObjectives.table.messages.uploadSuccess', { defaultValue: 'Archivo cargado exitosamente' }));
      }
      loadData();
    } catch (error) {
      console.error('Error uploading objectives excel:', error);
      throw new Error(getUploadErrorMessage(error));
    } finally {
      setUploading(false);
    }
  }, [loadData, t]);

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: currentFilters,
  });
  
  const flattenedData = flattenDataWithHierarchy(dataFiltered);

  const notFound = !dataFiltered.length && (!!currentFilters.name || currentFilters.status !== 'all');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Objetivos Estratégicos"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Arquitectura', href: paths.dashboard.architecture.strategicObjectivesTable },
          { name: 'Objetivos Estratégicos' },
        ]}
        action={
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              onClick={handleDownloadTemplate}
              variant="outlined"
              startIcon={<Iconify icon="eva:cloud-download-fill" />}
            >
              {t('strategicObjectives.table.actions.downloadTemplate', { defaultValue: 'Descargar Plantilla' })}
            </Button>

            <LoadingButton
              onClick={uploadDialog.onTrue}
              disabled={uploading}
              variant="outlined"
              startIcon={<Iconify icon="eva:cloud-upload-fill" />}
            >
              {t('strategicObjectives.table.actions.upload', { defaultValue: 'Cargar Plantilla' })}
            </LoadingButton>

            <LoadingButton
              onClick={handleDownloadExcel}
              loading={downloading}
              variant="outlined"
              startIcon={<Iconify icon="solar:download-bold" />}
            >
              {t('strategicObjectives.table.actions.download', { defaultValue: 'Descargar' })}
            </LoadingButton>

            <Button
              onClick={handleOpenCreate}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              {t('strategicObjectives.table.actions.create', { defaultValue: 'Crear' })}
            </Button>
          </Box>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <StrategicObjectivesUploadTemplateDialog
        open={uploadDialog.value}
        uploading={uploading}
        onClose={uploadDialog.onFalse}
        onDownloadTemplate={handleDownloadTemplate}
        onUpload={handleUploadExcel}
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

        <StrategicObjectivesTableToolbar
          filters={currentFilters}
          onFilters={(name, value) => {
            table.onResetPage();
            updateFilters({ [name]: value });
          }}
          visibleColumns={visibleColumns}
          onChangeColumns={handleToggleColumn}
          objectiveTypeOptions={objectiveTypeOptions}
          flowFilters={flowFilters}
          onFlowFilters={handleFlowFilters}
        />

        <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 720 }}>
              <TableHeadCustom
                order={table.order}
                orderBy={table.orderBy}
                headCells={TABLE_HEAD}
                rowCount={flattenedData.length}
                numSelected={table.selected.length}
                onSort={table.onSort}
              />

              <TableBody>
                {flattenedData
                  .slice(
                    table.page * table.rowsPerPage,
                    table.page * table.rowsPerPage + table.rowsPerPage
                  )
                  .map((row) => (
                    <StrategicObjectivesTableRow
                      key={row.id}
                      row={row}
                      selected={table.selected.includes(String(row.id))}
                      onSelectRow={() => table.onSelectRow(String(row.id))}
                      onDeleteRow={() => handleDeleteRow(String(row.id))}
                      onEditRow={() => handleEditRow(row.id)}
                      onToggleExpand={() => handleToggleExpand(row.id)}
                      expanded={expandedRows.has(row.id)}
                      visibleColumns={visibleColumns}
                    />
                ))}

                <TableEmptyRows
                  height={table.dense ? 56 : 76}
                  emptyRows={emptyRows(table.page, table.rowsPerPage, flattenedData.length)}
                />

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
      
      <Drawer
        open={openDrawer.value}
        onClose={handleCloseDrawer}
        anchor="right"
        PaperProps={{ sx: { width: { xs: 1, sm: 480, md: 640 } } }}
      >
        <StrategicObjectivesCreateForm
          currentObjective={currentObjective}
          onSuccess={() => {
            handleCloseDrawer();
            loadData();
          }}
          onCancel={handleCloseDrawer}
        />
      </Drawer>
    </DashboardContent>
  );
}

type StrategicObjectivesUploadTemplateDialogProps = {
  open: boolean;
  uploading: boolean;
  onClose: () => void;
  onDownloadTemplate: () => void;
  onUpload: (file: File) => Promise<void>;
};

function StrategicObjectivesUploadTemplateDialog({
  open,
  uploading,
  onClose,
  onDownloadTemplate,
  onUpload,
}: StrategicObjectivesUploadTemplateDialogProps) {
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
        const msg = t('strategicObjectives.table.uploadDialog.errors.tooManyFiles', {
          defaultValue: 'Solo se permite 1 archivo.',
        });
        setError(msg);
        toast.error(msg);
        return;
      }

      if (code === 'file-invalid-type') {
        const msg = t('strategicObjectives.table.uploadDialog.errors.invalidType', {
          defaultValue: 'Formato no permitido. Usa .xlsx o .xls.',
        });
        setError(msg);
        toast.error(msg);
        return;
      }

      const msg = t('strategicObjectives.table.uploadDialog.errors.generic', {
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
      const msg = t('strategicObjectives.table.uploadDialog.errors.noFile', { defaultValue: 'Selecciona un archivo.' });
      setError(msg);
      toast.error(msg);
      return;
    }
    try {
      await onUpload(file);
      onClose();
    } catch (uploadError) {
      const msg = uploadError instanceof Error ? uploadError.message : getUploadErrorMessage(uploadError);
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
          {t('strategicObjectives.table.uploadDialog.title', { defaultValue: 'Carga masiva de objetivos' })}
        </Typography>
        <IconButton
          aria-label={t('strategicObjectives.table.uploadDialog.actions.close', { defaultValue: 'Cerrar' })}
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
              {t('strategicObjectives.table.uploadDialog.instructions.title', { defaultValue: 'Instrucciones' })}
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
                {t('strategicObjectives.table.uploadDialog.instructions.step1', {
                  defaultValue: 'Descarga la plantilla Excel con el formato requerido.',
                })}{' '}
                <Button
                  size="small"
                  variant="text"
                  onClick={onDownloadTemplate}
                  disabled={uploading}
                  sx={{ p: 0, minWidth: 'unset', textTransform: 'none', verticalAlign: 'baseline' }}
                >
                  {t('strategicObjectives.table.uploadDialog.instructions.downloadLink', { defaultValue: 'Descargar plantilla' })}
                </Button>
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                {t('strategicObjectives.table.uploadDialog.instructions.step2', {
                  defaultValue:
                    'Completa el archivo con las columnas: CODIGO_OBJETIVO, NOMBRE_OBJETIVO, CODIGO_OBJETIVO_PADRE.',
                })}
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                {t('strategicObjectives.table.uploadDialog.instructions.step3', {
                  defaultValue: 'Guarda el archivo sin espacios ni caracteres especiales en el nombre.',
                })}
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                {t('strategicObjectives.table.uploadDialog.instructions.step4', {
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
                  ? t('strategicObjectives.table.uploadDialog.drop.selectedTitle', {
                      defaultValue: 'Archivo seleccionado',
                    })
                  : t('strategicObjectives.table.uploadDialog.drop.title', {
                      defaultValue: 'Seleccionar archivo Excel',
                    })}
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
                    {t('strategicObjectives.table.uploadDialog.actions.remove', { defaultValue: 'Quitar' })}
                  </Button>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t('strategicObjectives.table.uploadDialog.drop.subtitle', {
                    defaultValue: 'o haz clic para seleccionar desde tu dispositivo',
                  })}
                </Typography>
              )}

              <Typography variant="caption" color="text.disabled">
                {t('strategicObjectives.table.uploadDialog.drop.formats', { defaultValue: 'Formatos permitidos: .xlsx, .xls • 1 archivo' })}
              </Typography>
            </Stack>
          </Box>

          {!!error && (
            <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 1, whiteSpace: 'pre-line' }}>
              {error}
            </Typography>
          )}
        </Box>
      </Box>

      <Box sx={{ px: 3, py: 2, borderTop: (theme) => `1px solid ${theme.vars.palette.divider}`, display: 'flex', justifyContent: 'flex-end', gap: 1.25 }}>
        <Button onClick={handleClose} disabled={uploading} color="inherit" variant="outlined">
          {t('strategicObjectives.table.uploadDialog.actions.cancel', { defaultValue: 'Cancelar' })}
        </Button>
        <LoadingButton
          variant="contained"
          loading={uploading}
          onClick={handleConfirmUpload}
          disabled={!file}
        >
          {t('strategicObjectives.table.uploadDialog.actions.upload', { defaultValue: 'Cargar' })}
        </LoadingButton>
      </Box>
    </Drawer>
  );
}

// ----------------------------------------------------------------------

type ApplyFilterProps = {
  inputData: IStrategicObjectiveFlowNode[];
  filters: IStrategicObjectiveFilters;
  comparator: (a: Record<string, string | number>, b: Record<string, string | number>) => number;
};

function applyFilter({ inputData, comparator, filters }: ApplyFilterProps) {
  const { name } = filters;

  const toComparable = (node: IStrategicObjectiveFlowNode): Record<string, string | number> => ({
    id: node.id,
    label: node.label,
    name: node.data.name,
    code: node.data.code,
  });

  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const aData = toComparable(a[0]);
    const bData = toComparable(b[0]);
    const order = comparator(aData, bData);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    const query = name.trim().toLowerCase();
    inputData = inputData.filter((item) => item.data.name.toLowerCase().includes(query));
  }

  return inputData;
}
