'use client';

import type { IOrganizationalUnit } from 'src/types/organization';

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
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetOrganizationalUnitTypesPaginationService } from 'src/services/architecture/catalogs/organizationalUnitTypes.service';
import {
  DeleteOrganizationalUnitService,
  type OrganizationalUnitFlowNode,
  UploadOrganizationalUnitService,
  GetOrganizationalUnitFlowService,
  DownloadOrganizationalUnitExcelService,
  DownloadOrganizationalUnitTemplateService,
} from 'src/services/organization/organizationalUnit.service';

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

import { OrganizationalStructureTableRow } from 'src/sections/architecture/business/organizational-structure/view/organizational-structure-table-row';
import {
  OrganizationalStructureTableToolbar,
  type OrganizationalStructureFlowFilters,
} from 'src/sections/architecture/business/organizational-structure/view/organizational-structure-table-toolbar';

import { ALL_COLUMNS, DEFAULT_COLUMNS } from './organizational-structure-table-config';
import { OrganizationalStructureCreateEditDrawer } from '../organizational-structure-create-form';

// ----------------------------------------------------------------------

type Filters = {
  name: string;
  status: string;
};

type FlowResponse = { data?: unknown };

type FlattenedOrganizationalUnitRow = Omit<IOrganizationalUnit, 'children'> & {
  label: string;
  level: number;
  parentId?: string;
  hasChildren: boolean;
};

type OrgUnitType = {
  id: number | string;
  name: string;
};

type OrgUnitTypeOption = {
  value: number;
  label: string;
};

const normalizeFlowData = (raw: unknown): OrganizationalUnitFlowNode[] => {
  if (Array.isArray(raw)) {
    return raw as OrganizationalUnitFlowNode[];
  }
  if (raw && typeof raw === 'object' && Array.isArray((raw as FlowResponse).data)) {
    return (raw as FlowResponse).data as OrganizationalUnitFlowNode[];
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
  codigo: 'Código',
  nombre: 'Nombre',
  parentId: 'Unidad padre',
  parent: 'Unidad padre',
  orgUnitTypeId: 'Tipo de unidad',
};

const getUploadErrorMessage = (error: unknown) => {
  const direct = pickString(error);
  if (direct) {
    const parsed = parseJsonObject(direct);
    if (parsed) return getUploadErrorMessage(parsed);
    return direct;
  }

  const statusCodeValue =
    getRecordUnknown(error, 'statusCode') ?? getRecordUnknown(getRecordUnknown(error, 'data'), 'statusCode');
  const statusCode = typeof statusCodeValue === 'number' ? statusCodeValue : null;

  const msg =
    getRecordString(error, 'message') ??
    getRecordString(getRecordUnknown(error, 'data'), 'message') ??
    getRecordString(error, 'error') ??
    getRecordString(getRecordUnknown(error, 'data'), 'error');

  const normalizedMsg = msg
    ? parseJsonObject(msg)?.message
      ? getRecordString(parseJsonObject(msg), 'message') ?? msg
      : msg
    : null;

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

export function OrganizationalStructureTableView() {
  const { t, currentLang } = useTranslate('organization');
  const table = useTable();
  const confirmDialog = useBoolean();
  const openDrawer = useBoolean();
  const uploadDrawer = useBoolean();
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const downloadTemplateLabel =
    currentLang.value === 'en'
      ? t('organization.actions.downloadTemplate', { defaultValue: 'Download template' })
      : t('organization.actions.downloadTemplate', { defaultValue: 'Descargar plantilla' });

  const uploadTemplateLabel =
    currentLang.value === 'en'
      ? t('organization.actions.uploadTemplate', { defaultValue: 'Upload template' })
      : t('organization.actions.uploadTemplate', { defaultValue: 'Cargar plantilla' });

  const [flowFilters, setFlowFilters] = useState<OrganizationalStructureFlowFilters>({
    type: null,
  });
  const [orgUnitTypeOptions, setOrgUnitTypeOptions] = useState<OrgUnitTypeOption[]>([]);
  const [tableData, setTableData] = useState<OrganizationalUnitFlowNode[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentUnit, setCurrentUnit] = useState<IOrganizationalUnit | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_COLUMNS);

  useEffect(() => {
    const isOrgUnitType = (value: unknown): value is OrgUnitType => {
      if (!value || typeof value !== 'object') return false;
      const record = value as Record<string, unknown>;
      const id = record.id;
      return (typeof id === 'number' || typeof id === 'string') && typeof record.name === 'string';
    };

    const normalizeOrgUnitTypes = (raw: unknown): OrgUnitType[] => {
      if (Array.isArray(raw)) {
        if (raw.length === 2 && Array.isArray(raw[0])) {
          return raw[0].filter(isOrgUnitType);
        }
        return raw.filter(isOrgUnitType);
      }

      if (raw && typeof raw === 'object') {
        const record = raw as Record<string, unknown>;
        if (Array.isArray(record.data)) {
          return record.data.filter(isOrgUnitType);
        }
      }

      return [];
    };

    const loadOrgUnitTypes = async () => {
      try {
        const res = await GetOrganizationalUnitTypesPaginationService({ page: 1, perPage: 1000 });
        const list = normalizeOrgUnitTypes(res?.data);
        setOrgUnitTypeOptions(
          list
            .map((it) => ({ value: Number(it.id), label: it.name }))
            .filter((opt) => Number.isFinite(opt.value) && opt.label.trim().length > 0)
        );
      } catch {
        setOrgUnitTypeOptions([]);
      }
    };

    loadOrgUnitTypes();
  }, []);

  const handleToggleColumn = useCallback((columnId: string) => {
    setVisibleColumns((prev) => {
      if (prev.includes(columnId)) {
        return prev.filter((id) => id !== columnId);
      }
      return [...prev, columnId];
    });
  }, []);

  const STATUS_OPTIONS = useMemo(() => [{ value: 'all', label: t('organization.table.filters.all') }], [t]);

  const TABLE_HEAD = useMemo(() => {
    const dynamicColumns = ALL_COLUMNS.filter((col) => visibleColumns.includes(col.id)).map((col) => ({
      ...col,
      label: t(col.label),
    }));
    return [
      { id: '', width: 88 },
      ...dynamicColumns,
    ];
  }, [visibleColumns, t]);

  const filters = useSetState<Filters>({ name: '', status: 'all' });
  const { state: currentFilters, setState: updateFilters } = filters;

  const flowParams = useMemo(() => {
    const params: Record<string, string | number | boolean | undefined> = {};

    const name = currentFilters.name.trim();
    if (name) params.name = name;
    if (flowFilters.type) params.orgUnitTypeId = flowFilters.type;

    return Object.keys(params).length ? params : undefined;
  }, [currentFilters.name, flowFilters.type]);

  const handleFlowFilters = useCallback(
    (next: Partial<OrganizationalStructureFlowFilters>) => {
      table.onResetPage();
      setFlowFilters((prev) => ({ ...prev, ...next }));
    },
    [table]
  );

  const flattenDataWithHierarchy = useCallback(
    (data: OrganizationalUnitFlowNode[], level = 0, parentId?: string): FlattenedOrganizationalUnitRow[] => {
      const flattened: FlattenedOrganizationalUnitRow[] = [];

      const comparator = getComparator(table.order, table.orderBy);
      const sortedData = [...data].sort((a, b) => comparator(a.data as any, b.data as any));

      sortedData.forEach((item) => {
        if (!item) return;

        const dataNode = item.data as IOrganizationalUnit;
        const flatItem: FlattenedOrganizationalUnitRow = {
          ...dataNode,
          id: String(item.id ?? dataNode?.id ?? ''),
          label: item.label,
          level,
          parentId,
          hasChildren: (item.children?.length ?? 0) > 0,
        };

        flattened.push(flatItem);

        if (expandedRows.has(String(item.id)) && Array.isArray(item.children)) {
          flattened.push(...flattenDataWithHierarchy(item.children, level + 1, String(item.id)));
        }
      });

      return flattened;
    },
    [expandedRows, table.order, table.orderBy]
  );

  const loadData = useCallback(async () => {
    try {
      const response = await GetOrganizationalUnitFlowService(flowParams);
      const list = normalizeFlowData(response?.data);

      setTableData(list);
    } catch {
      toast.error(t('organization.actions.loadError'));
      setTableData([]);
    }
  }, [flowParams, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const flattenedData = useMemo(
    () => flattenDataWithHierarchy(tableData),
    [flattenDataWithHierarchy, tableData]
  );

  const dataFiltered = applyFilter({
    inputData: flattenedData,
    filters: currentFilters,
    flowFilters,
  });

  useEffect(() => {
    if (table.rowsPerPage !== 10) return;
    if (expandedRows.size === 0) return;
    if (dataFiltered.length <= table.rowsPerPage) return;
    table.setRowsPerPage(25);
  }, [dataFiltered.length, expandedRows.size, table]);

  useEffect(() => {
    setTotalItems(dataFiltered.length);
  }, [dataFiltered.length]);

  const canReset = !!currentFilters.name || currentFilters.status !== 'all';
  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        await DeleteOrganizationalUnitService(id);
        toast.success(t('organization.actions.deleteSuccess'));
        loadData();
      } catch {
        toast.error(t('organization.actions.deleteError'));
      }
    },
    [loadData, t]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      const deletePromises = table.selected.map((id) => DeleteOrganizationalUnitService(id));
      await Promise.all(deletePromises);
      toast.success(t('organization.actions.deleteSuccess'));
      table.setSelected([]);
      loadData();
    } catch {
      toast.error(t('organization.actions.deleteError'));
    }
  }, [loadData, table, t]);

  const handleFilterStatus = useCallback(
    (_event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      updateFilters({ status: newValue });
    },
    [table, updateFilters]
  );

  const handleResetFilters = useCallback(() => {
    table.onResetPage();
    updateFilters({ name: '', status: 'all' });
  }, [table, updateFilters]);

  const handleDownloadTemplate = useCallback(
    async () => {
      try {
        const response = await DownloadOrganizationalUnitTemplateService(currentLang.value);
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'organizational_unit_template.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (error) {
        console.error(error);
        toast.error(t('organization.actions.downloadError'));
      }
    },
    [currentLang.value, t]
  );

  const handleDownloadExcel = useCallback(async () => {
    try {
      setDownloading(true);
      const name = currentFilters.name.trim();
      const params: Record<string, string | number | boolean> = {
        columns: visibleColumns.join(','),
        lang: currentLang.value,
      };

      if (name) params.name = name;
      if (flowFilters.type) params.orgUnitTypeId = flowFilters.type;

      const response = await DownloadOrganizationalUnitExcelService(params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'organizational_units.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(error);
      toast.error(t('organization.actions.downloadError'));
    } finally {
      setDownloading(false);
    }
  }, [currentLang.value, flowFilters.type, t, currentFilters.name, visibleColumns]);

  const handleUpload = useCallback(
    async (file: File) => {
      try {
        setUploading(true);
        await UploadOrganizationalUnitService(file);
        toast.success(t('organization.actions.uploadSuccess'));
        loadData();
      } catch (error) {
        console.error(error);
        throw new Error(getUploadErrorMessage(error));
      } finally {
        setUploading(false);
      }
    },
    [loadData, t]
  );

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title={t('organization.dialogs.delete.title')}
      content={t('organization.dialogs.delete.contentMultiple', { count: table.selected.length })}
      action={
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            handleDeleteRows();
            confirmDialog.onFalse();
          }}
        >
          {t('organization.dialogs.delete.confirm')}
        </Button>
      }
    />
  );

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('organization.view.tableTitle')}
          links={[
            { name: t('organization.view.dashboard'), href: paths.dashboard.root },
            { name: t('organization.view.list') },
          ]}
          action={
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                component={RouterLink}
                href={paths.dashboard.architecture.organizationalStructureMap}
                variant="outlined"
                startIcon={<Iconify icon="solar:map-point-bold" />}
              >
                {t('organization.view.organigram')}
              </Button>

              <Button
                variant="outlined"
                startIcon={<Iconify icon="eva:cloud-download-fill" />}
                onClick={handleDownloadTemplate}
              >
                {downloadTemplateLabel}
              </Button>

              <LoadingButton
                variant="outlined"
                loading={uploading}
                startIcon={<Iconify icon="eva:cloud-upload-fill" />}
                onClick={uploadDrawer.onTrue}
              >
                {uploadTemplateLabel}
              </LoadingButton>

              <LoadingButton
                variant="outlined"
                loading={downloading}
                startIcon={<Iconify icon="solar:download-bold" />}
                onClick={handleDownloadExcel}
              >
                {t('organization.actions.download')}
              </LoadingButton>

              <Button
                onClick={() => {
                  setCurrentUnit(null);
                  openDrawer.onTrue();
                }}
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
              >
                {t('organization.actions.create')}
              </Button>
            </Box>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          <Tabs
            value={currentFilters.status}
            onChange={handleFilterStatus}
            sx={(theme) => ({
              px: { md: 2.5 },
              boxShadow: `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
            })}
          >
            {STATUS_OPTIONS.map((tabItem) => (
              <Tab
                key={tabItem.value}
                iconPosition="end"
                value={tabItem.value}
                label={tabItem.label}
                icon={
                  <Label
                    variant={
                      ((tabItem.value === 'all' || tabItem.value === currentFilters.status) && 'filled') ||
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

          <OrganizationalStructureTableToolbar
            filters={currentFilters}
            onFilters={(name: 'name', value: string) => {
              table.onResetPage();
              updateFilters({ [name]: value } as Partial<Filters>);
            }}
            onResetFilters={handleResetFilters}
            canReset={canReset}
            visibleColumns={visibleColumns}
            onChangeColumns={handleToggleColumn}
            flowFilters={flowFilters}
            onFlowFilters={handleFlowFilters}
            orgUnitTypeOptions={orgUnitTypeOptions}
          />

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
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 720 }}>
                <TableHeadCustom
                  order={table.order}
                  orderBy={table.orderBy}
                  headCells={TABLE_HEAD}
                  rowCount={dataFiltered.length}
                  numSelected={table.selected.length}
                  onSort={table.onSort}
                />

                <TableBody>
                  {dataFiltered
                    .slice(table.page * table.rowsPerPage, table.page * table.rowsPerPage + table.rowsPerPage)
                    .map((row) => (
                      <OrganizationalStructureTableRow
                        key={String(row.id)}
                        row={row}
                        selected={table.selected.includes(String(row.id))}
                        onSelectRow={() => table.onSelectRow(String(row.id))}
                        onDeleteRow={() => handleDeleteRow(String(row.id))}
                        onEditRow={() => {
                          setCurrentUnit(row);
                          openDrawer.onTrue();
                        }}
                        onToggleExpand={() => handleToggleExpand(String(row.id))}
                        expanded={expandedRows.has(String(row.id))}
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

      <OrganizationalStructureCreateEditDrawer
        open={openDrawer.value}
        onClose={openDrawer.onFalse}
        onSuccess={loadData}
        currentOrganizationalUnit={currentUnit}
      />

      <OrganizationalStructureUploadTemplateDrawer
        open={uploadDrawer.value}
        uploading={uploading}
        onClose={uploadDrawer.onFalse}
        onDownloadTemplate={handleDownloadTemplate}
        onUpload={handleUpload}
      />

      {renderConfirmDialog()}
    </>
  );
}

// ----------------------------------------------------------------------

type OrganizationalStructureUploadTemplateDrawerProps = {
  open: boolean;
  uploading: boolean;
  onClose: () => void;
  onDownloadTemplate: () => void;
  onUpload: (file: File) => Promise<void>;
};

function OrganizationalStructureUploadTemplateDrawer({
  open,
  uploading,
  onClose,
  onDownloadTemplate,
  onUpload,
}: OrganizationalStructureUploadTemplateDrawerProps) {
  const { t } = useTranslate('organization');
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
        const msg = t('organization.uploadDrawer.errors.tooManyFiles', { defaultValue: 'Solo se permite 1 archivo.' });
        setError(msg);
        toast.error(msg);
        return;
      }

      if (code === 'file-invalid-type') {
        const msg = t('organization.uploadDrawer.errors.invalidType', {
          defaultValue: 'Formato no permitido. Usa .xlsx o .xls.',
        });
        setError(msg);
        toast.error(msg);
        return;
      }

      const msg = t('organization.uploadDrawer.errors.generic', {
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
      const msg = t('organization.uploadDrawer.errors.noFile', { defaultValue: 'Selecciona un archivo.' });
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
          {t('organization.uploadDrawer.title', { defaultValue: 'Cargar unidades organizacionales por Lote' })}
        </Typography>
        <IconButton
          aria-label={t('organization.uploadDrawer.actions.close', { defaultValue: 'Cerrar' })}
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
              {t('organization.uploadDrawer.instructions.title', { defaultValue: 'Instrucciones' })}
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
                {t('organization.uploadDrawer.instructions.step1', {
                  defaultValue: 'Descarga la plantilla Excel con el formato requerido.',
                })}
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                {t('organization.uploadDrawer.instructions.step2', {
                  defaultValue:
                    'Completa el archivo con las columnas: CODIGO_U_ORGANIZACIONAL, NOMBRE_U_ORGANIZACIONAL, CODIGO_U_ORGANIZACIONAL_PADRE.',
                })}
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                {t('organization.uploadDrawer.instructions.step3', {
                  defaultValue: 'Guarda el archivo sin espacios ni caracteres especiales en el nombre.',
                })}
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                {t('organization.uploadDrawer.instructions.step4', {
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
                  ? t('organization.uploadDrawer.drop.selectedTitle', { defaultValue: 'Archivo seleccionado' })
                  : t('organization.uploadDrawer.drop.title', { defaultValue: 'Seleccionar archivo Excel' })}
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
                    {t('organization.uploadDrawer.actions.remove', { defaultValue: 'Quitar' })}
                  </Button>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t('organization.uploadDrawer.drop.subtitle', {
                    defaultValue: 'o haz clic para seleccionar desde tu dispositivo',
                  })}
                </Typography>
              )}

              <Typography variant="caption" color="text.disabled">
                {t('organization.uploadDrawer.drop.formats', {
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
            {t('organization.actions.downloadTemplate', { defaultValue: 'Descargar Plantilla' })}
          </Button>
        </Box>
      </Box>

      <Box sx={{ px: 3, py: 2, borderTop: (theme) => `1px solid ${theme.vars.palette.divider}`, display: 'flex', justifyContent: 'flex-end', gap: 1.25 }}>
        <Button onClick={handleClose} disabled={uploading} color="inherit" variant="outlined">
          {t('organization.uploadDrawer.actions.cancel', { defaultValue: 'Cancelar' })}
        </Button>
        <LoadingButton variant="contained" loading={uploading} onClick={handleConfirmUpload} disabled={!file}>
          {t('organization.uploadDrawer.actions.upload', { defaultValue: 'Cargar' })}
        </LoadingButton>
      </Box>
    </Drawer>
  );
}

type ApplyFilterProps = {
  inputData: FlattenedOrganizationalUnitRow[];
  filters: Filters;
  flowFilters: OrganizationalStructureFlowFilters;
};

function applyFilter({ inputData, filters, flowFilters }: ApplyFilterProps) {
  let data = inputData;

  if (flowFilters.type) {
    data = data.filter((item) => {
      const record = item as Record<string, unknown>;
      const fromId = record.orgUnitTypeId;
      const fromObj =
        record.orgUnitType && typeof record.orgUnitType === 'object'
          ? (record.orgUnitType as { id?: unknown }).id
          : undefined;

      const parsed = Number(fromId ?? fromObj);
      if (!Number.isFinite(parsed)) return true;
      return parsed === flowFilters.type;
    });
  }

  if (filters.name) {
    const query = filters.name.toLowerCase();
    data = data.filter((item) => {
      const directValues = [
        item.name,
        item.code,
        item.description,
        item.expectedResults,
        item.label,
        item.parent?.name,
      ];

      const byDirectValue = directValues.some((value) => String(value ?? '').toLowerCase().includes(query));
      if (byDirectValue) return true;

      const record = item as Record<string, unknown>;
      return ALL_COLUMNS.some(({ id }) => {
        const value = record[id];
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          return String(value).toLowerCase().includes(query);
        }
        if (value && typeof value === 'object' && 'name' in value) {
          const name = (value as { name?: unknown }).name;
          return String(name ?? '').toLowerCase().includes(query);
        }
        return false;
      });
    });
  }

  return data;
}
