'use client';

import type { TableHeadCellProps } from 'src/components/table';
import type { DocumentItem, DocumentsMeta, DocumentsListResponse, DocumentChangeControlItem } from 'src/services/documents/documents.service';

import {
  DeleteDocumentService,
  GetDocumentByIdService,
  DownloadDocumentService,
  ExportDocumentsExcelService,
  GetDocumentsPaginationService,
  GetDocumentChangeControlsByDocumentIdService,
} from 'src/services/documents/documents.service';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useBoolean, usePopover, useDebounce } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import Collapse from '@mui/material/Collapse';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fDate, fDateTime } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomPopover } from 'src/components/custom-popover';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, TableNoData, TableSkeleton, TableHeadCustom, TablePaginationCustom } from 'src/components/table';
import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

import { DocumentPreviewDialog, documentPreviewFileName } from '../document-preview-dialog';
import { DocumentCreateEditDrawer, type DocumentSelectOption } from '../document-create-edit-drawer';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isDocumentsMeta = (value: unknown): value is DocumentsMeta => {
  if (!isRecord(value)) return false;
  return (
    typeof value.page === 'number' &&
    typeof value.perPage === 'number' &&
    typeof value.itemCount === 'number' &&
    typeof value.pageCount === 'number' &&
    typeof value.hasPreviousPage === 'boolean' &&
    typeof value.hasNextPage === 'boolean'
  );
};

const extractDocumentsPayload = (
  payload: unknown
): { rows: DocumentItem[]; meta: DocumentsMeta | null } => {
  if (isRecord(payload) && Array.isArray(payload.data) && isDocumentsMeta(payload.meta)) {
    return { rows: payload.data as DocumentItem[], meta: payload.meta };
  }

  if (isRecord(payload) && isRecord(payload.data)) {
    const nested = payload.data as Record<string, unknown>;
    if (Array.isArray(nested.data) && isDocumentsMeta(nested.meta)) {
      return { rows: nested.data as DocumentItem[], meta: nested.meta };
    }
  }

  if (isRecord(payload) && Array.isArray(payload.data)) {
    return { rows: payload.data as DocumentItem[], meta: null };
  }

  return { rows: [], meta: null };
};

const isTruthy = <T,>(value: T | null | undefined): value is T => value !== null && value !== undefined;

const downloadBlob = (blob: Blob, fileName: string) => {
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = fileName;
  link.rel = 'noreferrer';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
};

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const normalizeDocumentDetail = (value: unknown, fallback: DocumentItem): DocumentItem => {
  if (!isObject(value)) return fallback;

  const source = isObject(value.data) ? value.data : value;
  const detail = isObject(source) ? source : {};

  return {
    ...fallback,
    ...(typeof detail.id === 'number' ? { id: detail.id } : {}),
    ...(typeof detail.code === 'string' ? { code: detail.code } : {}),
    ...(typeof detail.name === 'string' ? { name: detail.name } : {}),
    ...(typeof detail.description === 'string' ? { description: detail.description } : {}),
    ...(typeof detail.version === 'number' ? { version: detail.version } : {}),
    ...(typeof detail.writingDate === 'string' ? { writingDate: detail.writingDate } : {}),
    ...(typeof detail.expirationDate === 'string' ? { expirationDate: detail.expirationDate } : {}),
    ...(typeof detail.modificationDate === 'string' ? { modificationDate: detail.modificationDate } : {}),
    ...(typeof detail.file === 'string' ? { file: detail.file } : {}),
    ...(typeof detail.type === 'string' ? { type: detail.type } : {}),
    ...(typeof detail.link === 'string' ? { link: detail.link } : {}),
    ...(typeof detail.originalFile === 'string' ? { originalFile: detail.originalFile } : {}),
  };
};

export function DocumentManagementView() {
  const { t } = useTranslate('documents');
  const { t: tCommon } = useTranslate('common');
  const table = useTable();
  const upsertDrawer = useBoolean();
  const previewDialog = useBoolean();
  const changeControlDrawer = useBoolean();
  const columnsPopover = usePopover();

  const [rows, setRows] = useState<DocumentItem[]>([]);
  const [meta, setMeta] = useState<DocumentsMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  type DocumentFilters = {
    name: string;
    version: string;
    status: string;
    writingDate: string;
    expirationDate: string;
  };

  const [filters, setFilters] = useState<DocumentFilters>({
    name: '',
    version: '',
    status: '',
    writingDate: '',
    expirationDate: '',
  });

  const debouncedName = useDebounce(filters.name.trim(), 350);
  const hasAnyFilter = useMemo(
    () =>
      Boolean(debouncedName) ||
      Boolean(filters.version) ||
      Boolean(filters.status) ||
      Boolean(filters.writingDate) ||
      Boolean(filters.expirationDate),
    [debouncedName, filters.expirationDate, filters.status, filters.version, filters.writingDate]
  );

  const [editRow, setEditRow] = useState<DocumentItem | null>(null);
  const [previewRow, setPreviewRow] = useState<DocumentItem | null>(null);
  const [changeControlRow, setChangeControlRow] = useState<DocumentItem | null>(null);

  useEffect(() => {
    table.onResetPage();
  }, [
    debouncedName,
    filters.version,
    filters.status,
    filters.writingDate,
    filters.expirationDate,
    table,
  ]);

  const totalItems = meta?.itemCount ?? rows.length;

  type DocumentTableColumnId =
    | 'options'
    | 'code'
    | 'name'
    | 'description'
    | 'version'
    | 'writingDate'
    | 'expirationDate'
    | 'link'
    | 'createdDate'
    | 'lastModifiedDate'
    | 'originalFile'
    | 'documentType'
    | 'status';

  const FIXED_COLUMN_IDS = useMemo(() => new Set<DocumentTableColumnId>(['options']), []);

  const ALL_COLUMNS = useMemo<Array<TableHeadCellProps & { id: DocumentTableColumnId }>>(
    () => [
      { id: 'options', label: '', width: 72 },
      { id: 'code', label: t('documentManagement.table.columns.code'), width: 160 },
      { id: 'name', label: t('documentManagement.table.columns.name'), width: 260 },
      { id: 'description', label: t('documentManagement.table.columns.description'), width: 320 },
      { id: 'version', label: t('documentManagement.table.columns.version'), width: 100, align: 'center' },
      { id: 'writingDate', label: t('documentManagement.table.columns.writingDate'), width: 170 },
      { id: 'expirationDate', label: t('documentManagement.table.columns.expirationDate'), width: 170 },
      { id: 'link', label: t('documentManagement.table.columns.link'), width: 240 },
      { id: 'createdDate', label: t('documentManagement.table.columns.createdDate'), width: 210 },
      { id: 'lastModifiedDate', label: t('documentManagement.table.columns.lastModifiedDate'), width: 230 },
      { id: 'originalFile', label: t('documentManagement.table.columns.originalFile'), width: 240 },
      { id: 'documentType', label: t('documentManagement.table.columns.documentType'), width: 200 },
      { id: 'status', label: t('documentManagement.table.columns.status'), width: 160 },
    ],
    [t]
  );

  const [visibleColumns, setVisibleColumns] = useState<DocumentTableColumnId[]>(() => ALL_COLUMNS.map((c) => c.id));

  useEffect(() => {
    setVisibleColumns((prev) => {
      const available = new Set<DocumentTableColumnId>(ALL_COLUMNS.map((c) => c.id));
      const next = prev.filter((id) => available.has(id));

      ALL_COLUMNS.forEach((c) => {
        if (FIXED_COLUMN_IDS.has(c.id) && !next.includes(c.id)) next.push(c.id);
      });

      return next.length ? next : ALL_COLUMNS.map((c) => c.id);
    });
  }, [ALL_COLUMNS, FIXED_COLUMN_IDS]);

  const handleChangeColumns = useCallback(
    (columnId: DocumentTableColumnId) => {
      if (FIXED_COLUMN_IDS.has(columnId)) return;
      setVisibleColumns((prev) =>
        prev.includes(columnId) ? prev.filter((id) => id !== columnId) : [...prev, columnId]
      );
    },
    [FIXED_COLUMN_IDS]
  );

  const visibleColumnSet = useMemo(() => new Set<DocumentTableColumnId>(visibleColumns), [visibleColumns]);

  const tableHead: TableHeadCellProps[] = useMemo(
    () => ALL_COLUMNS.filter((c) => visibleColumnSet.has(c.id)),
    [ALL_COLUMNS, visibleColumnSet]
  );

  const documentStatusOptions = useMemo<DocumentSelectOption[]>(
    () =>
      rows
        .map((r) => r.documentStatus)
        .filter(isTruthy)
        .reduce<DocumentSelectOption[]>((acc, next) => {
          if (acc.some((it) => it.id === next.id)) return acc;
          return [...acc, { id: next.id, name: next.name }];
        }, [])
        .sort((a, b) => a.name.localeCompare(b.name)),
    [rows]
  );

  const documentTypeOptions = useMemo<DocumentSelectOption[]>(
    () =>
      rows
        .map((r) => r.documentType)
        .filter(isTruthy)
        .reduce<DocumentSelectOption[]>((acc, next) => {
          if (acc.some((it) => it.id === next.id)) return acc;
          return [...acc, { id: next.id, name: next.name }];
        }, [])
        .sort((a, b) => a.name.localeCompare(b.name)),
    [rows]
  );

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const version = filters.version ? Number(filters.version) : undefined;
      const status = filters.status ? Number(filters.status) : undefined;
      const response = await GetDocumentsPaginationService({
        page: table.page + 1,
        perPage: table.rowsPerPage,
        ...(debouncedName ? { name: debouncedName } : {}),
        ...(Number.isFinite(version) ? { version } : {}),
        ...(Number.isFinite(status) ? { status } : {}),
        ...(filters.writingDate ? { writingDate: filters.writingDate } : {}),
        ...(filters.expirationDate ? { expirationDate: filters.expirationDate } : {}),
      });

      const extracted = extractDocumentsPayload(response.data as DocumentsListResponse | unknown);

      setRows(extracted.rows);
      setMeta(extracted.meta);
    } catch {
      setRows([]);
      setMeta(null);
      toast.error(t('documentManagement.messages.error.loading'));
    } finally {
      setLoading(false);
    }
  }, [
    debouncedName,
    filters.expirationDate,
    filters.status,
    filters.version,
    filters.writingDate,
    t,
    table.page,
    table.rowsPerPage,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const notFound = !loading && rows.length === 0;

  const handleOpenCreate = useCallback(() => {
    setEditRow(null);
    upsertDrawer.onTrue();
  }, [upsertDrawer]);

  const handleOpenEdit = useCallback(
    async (row: DocumentItem) => {
      try {
        setEditRow(row);
        upsertDrawer.onTrue();

        const response = await GetDocumentByIdService(row.id);
        setEditRow((current) => normalizeDocumentDetail(response.data, current ?? row));
      } catch {
        setEditRow(row);
        upsertDrawer.onTrue();
      }
    },
    [upsertDrawer]
  );

  const handleCloseDrawer = useCallback(() => {
    upsertDrawer.onFalse();
    setEditRow(null);
  }, [upsertDrawer]);

  const handleOpenPreview = useCallback(
    (row: DocumentItem) => {
      setPreviewRow(row);
      previewDialog.onTrue();
    },
    [previewDialog]
  );

  const handleClosePreview = useCallback(() => {
    previewDialog.onFalse();
    setPreviewRow(null);
  }, [previewDialog]);

  const handleOpenChangeControl = useCallback(
    (row: DocumentItem) => {
      setChangeControlRow(row);
      changeControlDrawer.onTrue();
    },
    [changeControlDrawer]
  );

  const handleCloseChangeControl = useCallback(() => {
    changeControlDrawer.onFalse();
    setChangeControlRow(null);
  }, [changeControlDrawer]);

  const handleDownloadRow = useCallback(
    async (row: DocumentItem) => {
      try {
        const { blob, fileName } = await DownloadDocumentService(row.id, documentPreviewFileName(row));
        downloadBlob(blob, fileName);
      } catch {
        toast.error(t('documentManagement.messages.error.downloading'));
      }
    },
    [t]
  );

  const handleExportExcel = useCallback(async () => {
    try {
      setExporting(true);

      const mapColumn = (id: DocumentTableColumnId): string | null => {
        if (id === 'options') return null;
        if (id === 'code') return 'code';
        if (id === 'name') return 'name';
        if (id === 'description') return 'description';
        if (id === 'version') return 'version';
        if (id === 'writingDate') return 'writingDate';
        if (id === 'expirationDate') return 'expirationDate';
        if (id === 'link') return 'link';
        if (id === 'createdDate') return 'createdDate';
        if (id === 'lastModifiedDate') return 'lastModifiedDate';
        if (id === 'originalFile') return 'originalFile';
        if (id === 'documentType') return 'documentType';
        if (id === 'status') return 'status';
        return null;
      };

      const columns = visibleColumns.map(mapColumn).filter(isTruthy).join(',');
      if (!columns) {
        toast.error(t('documentManagement.messages.error.exportMissingColumns'));
        return;
      }

      const version = filters.version ? Number(filters.version) : undefined;
      const status = filters.status ? Number(filters.status) : undefined;
      const fallbackFileName = `documents-${new Date().toISOString().slice(0, 10)}.xlsx`;

      const { blob, fileName } = await ExportDocumentsExcelService(
        {
          columns,
          ...(debouncedName ? { name: debouncedName } : {}),
          ...(Number.isFinite(version) ? { version } : {}),
          ...(Number.isFinite(status) ? { status } : {}),
          ...(filters.writingDate ? { writingDate: filters.writingDate } : {}),
          ...(filters.expirationDate ? { expirationDate: filters.expirationDate } : {}),
        },
        fallbackFileName
      );

      downloadBlob(blob, fileName);
    } catch {
      toast.error(t('documentManagement.messages.error.exporting'));
    } finally {
      setExporting(false);
    }
  }, [debouncedName, filters.expirationDate, filters.status, filters.version, filters.writingDate, t, visibleColumns]);

  const handleDeleteRow = useCallback(
    async (id: number) => {
      try {
        await DeleteDocumentService(id);
        toast.success(t('documentManagement.messages.success.deleted'));
        loadData();
      } catch {
        toast.error(t('documentManagement.messages.error.deleting'));
      }
    },
    [loadData, t]
  );

  const selectedStatusLabel = useMemo(() => {
    if (!filters.status) return null;
    const id = Number(filters.status);
    if (!Number.isFinite(id)) return filters.status;
    return documentStatusOptions.find((opt) => opt.id === id)?.name ?? String(id);
  }, [documentStatusOptions, filters.status]);

  const handleResetAllFilters = useCallback(() => {
    table.onResetPage();
    setFilters({ name: '', version: '', status: '', writingDate: '', expirationDate: '' });
    setFiltersOpen(false);
  }, [table]);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('documentManagement.title')}
        links={[
          { name: t('documentManagement.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('documentManagement.breadcrumbs.documents') },
          { name: t('documentManagement.title') },
        ]}
        action={
          <Stack direction="row" spacing={1}>
            <Button variant="contained" startIcon={<Iconify icon="mingcute:add-line" />} onClick={handleOpenCreate}>
              {t('documentManagement.actions.create')}
            </Button>
            <Button
              color="inherit"
              variant="outlined"
              startIcon={<Iconify icon="solar:download-bold" />}
              onClick={() => void handleExportExcel()}
              disabled={exporting}
              sx={{ textTransform: 'capitalize' }}
            >
              {t('documentManagement.actions.exportExcel')}
            </Button>
          </Stack>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <Box sx={{ px: 3, py: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
            <TextField
              fullWidth
              value={filters.name}
              onChange={(event) => setFilters((prev) => ({ ...prev, name: event.target.value }))}
              placeholder={t('documentManagement.table.toolbar.search')}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:search-fill" />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Button
              color="inherit"
              variant={hasAnyFilter ? 'contained' : 'outlined'}
              startIcon={<Iconify icon="solar:filter-broken" />}
              onClick={() => setFiltersOpen((prev) => !prev)}
              sx={{ textTransform: 'capitalize', flexShrink: 0 }}
            >
              {tCommon('filters.button', { defaultValue: 'Filtros' })}
            </Button>

            <Button
              color="inherit"
              variant="outlined"
              startIcon={<Iconify icon="solar:settings-bold" />}
              onClick={columnsPopover.onOpen}
              sx={{ textTransform: 'capitalize', flexShrink: 0 }}
            >
              {tCommon('table.columns')}
            </Button>
          </Stack>

          <Collapse in={filtersOpen} timeout="auto" unmountOnExit>
            <Box sx={{ mt: 2 }}>
              <Box
                sx={[
                  (theme) => ({
                    p: 2,
                    borderRadius: 1.5,
                    border: `dashed 1px ${theme.vars.palette.divider}`,
                    backgroundColor: theme.vars.palette.background.neutral,
                  }),
                ]}
              >
                <Box
                  sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' },
                  }}
                >
                  <TextField
                    fullWidth
                    label={t('documentManagement.table.columns.version')}
                    type="number"
                    value={filters.version}
                    onChange={(e) => setFilters((prev) => ({ ...prev, version: e.target.value }))}
                  />

                  <FormControl fullWidth>
                    <InputLabel id="documents-status-filter-label">
                      {t('documentManagement.table.columns.status')}
                    </InputLabel>
                    <Select
                      labelId="documents-status-filter-label"
                      label={t('documentManagement.table.columns.status')}
                      value={filters.status}
                      onChange={(e) => setFilters((prev) => ({ ...prev, status: String(e.target.value) }))}
                    >
                      <MenuItem value="">{t('documentManagement.filters.any')}</MenuItem>
                      {documentStatusOptions.map((opt) => (
                        <MenuItem key={opt.id} value={String(opt.id)}>
                          {opt.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    label={t('documentManagement.table.columns.writingDate')}
                    type="date"
                    value={filters.writingDate}
                    onChange={(e) => setFilters((prev) => ({ ...prev, writingDate: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />

                  <TextField
                    fullWidth
                    label={t('documentManagement.table.columns.expirationDate')}
                    type="date"
                    value={filters.expirationDate}
                    onChange={(e) => setFilters((prev) => ({ ...prev, expirationDate: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
              </Box>
            </Box>
          </Collapse>
        </Box>

        {hasAnyFilter && (
          <FiltersResult totalResults={totalItems} onReset={handleResetAllFilters} sx={{ px: 3, pb: 2 }}>
            <FiltersBlock label={`${tCommon('filters.keyword', { defaultValue: 'Palabra clave' })}:`} isShow={Boolean(debouncedName)}>
              <Chip
                {...chipProps}
                label={debouncedName}
                onDelete={() => setFilters((prev) => ({ ...prev, name: '' }))}
              />
            </FiltersBlock>

            <FiltersBlock label={`${t('documentManagement.table.columns.version')}:`} isShow={Boolean(filters.version)}>
              <Chip {...chipProps} label={filters.version} onDelete={() => setFilters((prev) => ({ ...prev, version: '' }))} />
            </FiltersBlock>

            <FiltersBlock label={`${t('documentManagement.table.columns.status')}:`} isShow={Boolean(filters.status)}>
              <Chip
                {...chipProps}
                label={selectedStatusLabel ?? ''}
                onDelete={() => setFilters((prev) => ({ ...prev, status: '' }))}
              />
            </FiltersBlock>

            <FiltersBlock label={`${t('documentManagement.table.columns.writingDate')}:`} isShow={Boolean(filters.writingDate)}>
              <Chip
                {...chipProps}
                label={filters.writingDate}
                onDelete={() => setFilters((prev) => ({ ...prev, writingDate: '' }))}
              />
            </FiltersBlock>

            <FiltersBlock label={`${t('documentManagement.table.columns.expirationDate')}:`} isShow={Boolean(filters.expirationDate)}>
              <Chip
                {...chipProps}
                label={filters.expirationDate}
                onDelete={() => setFilters((prev) => ({ ...prev, expirationDate: '' }))}
              />
            </FiltersBlock>
          </FiltersResult>
        )}

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Scrollbar>
          <Table stickyHeader sx={{ minWidth: 1600 }}>
            <TableHeadCustom headCells={tableHead} />

            <TableBody>
              {loading ? (
                <TableSkeleton rowCount={table.rowsPerPage} cellCount={tableHead.length} sx={{ height: 69 }} />
              ) : (
                rows.map((row) => (
                  <DocumentManagementTableRow
                    key={row.id}
                    row={row}
                    visibleColumnSet={visibleColumnSet}
                    onEditRow={() => void handleOpenEdit(row)}
                    onPreviewRow={() => handleOpenPreview(row)}
                    onDownloadRow={() => void handleDownloadRow(row)}
                    onChangeControlRow={() => handleOpenChangeControl(row)}
                    onDeleteRow={() => handleDeleteRow(row.id)}
                  />
                ))
              )}

              <TableNoData notFound={notFound} />
            </TableBody>
          </Table>
        </Scrollbar>

        <TablePaginationCustom
          page={table.page}
          count={loading ? 0 : totalItems}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>

      <DocumentCreateEditDrawer
        open={upsertDrawer.value}
        onClose={handleCloseDrawer}
        editRow={editRow}
        documentStatusOptions={documentStatusOptions}
        documentTypeOptions={documentTypeOptions}
        onSuccess={() => {
          handleCloseDrawer();
          loadData();
        }}
      />

      <DocumentPreviewDialog
        open={previewDialog.value}
        documentId={previewRow?.id ?? null}
        fileName={previewRow ? documentPreviewFileName(previewRow) : ''}
        onClose={handleClosePreview}
      />

      <DocumentChangeControlDrawer
        open={changeControlDrawer.value}
        onClose={handleCloseChangeControl}
        document={changeControlRow}
      />

      <CustomPopover
        open={columnsPopover.open}
        anchorEl={columnsPopover.anchorEl}
        onClose={columnsPopover.onClose}
        slotProps={{ arrow: { placement: 'top-right' } }}
      >
        <Box sx={{ p: 2, width: 280 }}>
          <Stack spacing={1}>
            {ALL_COLUMNS.map((column) => {
              const checked = FIXED_COLUMN_IDS.has(column.id) || visibleColumnSet.has(column.id);
              return (
                <FormControlLabel
                  key={column.id}
                  control={
                    <Checkbox
                      checked={checked}
                      disabled={FIXED_COLUMN_IDS.has(column.id)}
                      onChange={() => handleChangeColumns(column.id)}
                    />
                  }
                  label={column.label}
                />
              );
            })}
          </Stack>
        </Box>
      </CustomPopover>
    </DashboardContent>
  );
}

type DocumentManagementTableRowProps = {
  row: DocumentItem;
  visibleColumnSet: ReadonlySet<DocumentTableColumnId>;
  onEditRow: () => void;
  onPreviewRow: () => void;
  onDownloadRow: () => void;
  onChangeControlRow: () => void;
  onDeleteRow: () => void;
};

function DocumentManagementTableRow({
  row,
  visibleColumnSet,
  onEditRow,
  onPreviewRow,
  onDownloadRow,
  onChangeControlRow,
  onDeleteRow,
}: DocumentManagementTableRowProps) {
  const { t } = useTranslate('documents');
  const router = useRouter();
  const menuActions = usePopover();
  const confirmDialog = useBoolean();

  const renderScrollableText = (value: string, maxWidth: number) => (
    <Box
      sx={{
        maxWidth,
        overflowX: 'hidden',
        overflowY: 'auto',
        maxHeight: '4.2em',
        lineHeight: 1.4,
        pr: 0.5,
      }}
    >
      <Typography variant="body2" sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
        {value || '-'}
      </Typography>
    </Box>
  );

  return (
    <>
      <TableRow hover key={row.id}>
        <TableCell>
          <IconButton color={menuActions.open ? 'inherit' : 'default'} onClick={menuActions.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>

        {visibleColumnSet.has('code') && (
          <TableCell>
            {renderScrollableText(row.code || '-', 160)}
          </TableCell>
        )}

        {visibleColumnSet.has('name') && (
          <TableCell>
            {renderScrollableText(row.name || '-', 260)}
          </TableCell>
        )}

        {visibleColumnSet.has('description') && (
          <TableCell>
            {renderScrollableText(row.description || '-', 320)}
          </TableCell>
        )}

        {visibleColumnSet.has('version') && <TableCell align="center">{row.version ?? '-'}</TableCell>}

        {visibleColumnSet.has('writingDate') && (
          <TableCell>
            <Typography variant="body2" noWrap>
              {row.writingDate ? fDate(row.writingDate) : '-'}
            </Typography>
          </TableCell>
        )}

        {visibleColumnSet.has('expirationDate') && (
          <TableCell>
            <Typography variant="body2" noWrap>
              {row.expirationDate ? fDate(row.expirationDate) : '-'}
            </Typography>
          </TableCell>
        )}

        {visibleColumnSet.has('link') && (
          <TableCell>
            {renderScrollableText(row.link || '-', 240)}
          </TableCell>
        )}

        {visibleColumnSet.has('createdDate') && (
          <TableCell>
            <Typography variant="body2" noWrap>
              {row.createdDate ? fDateTime(row.createdDate) : '-'}
            </Typography>
          </TableCell>
        )}

        {visibleColumnSet.has('lastModifiedDate') && (
          <TableCell>
            <Typography variant="body2" noWrap>
              {row.lastModifiedDate ? fDateTime(row.lastModifiedDate) : '-'}
            </Typography>
          </TableCell>
        )}

        {visibleColumnSet.has('originalFile') && (
          <TableCell>
            {renderScrollableText(row.originalFile || '-', 240)}
          </TableCell>
        )}

        {visibleColumnSet.has('documentType') && <TableCell>{renderScrollableText(row.documentType?.name || '-', 200)}</TableCell>}

        {visibleColumnSet.has('status') && <TableCell>{renderScrollableText(row.documentStatus?.name || '-', 160)}</TableCell>}
      </TableRow>

      <CustomPopover
        open={menuActions.open}
        anchorEl={menuActions.anchorEl}
        onClose={menuActions.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem
            onClick={() => {
              onPreviewRow();
              menuActions.onClose();
            }}
          >
            <Iconify icon="solar:eye-bold" />
            {t('documentManagement.actions.preview')}
          </MenuItem>

          <MenuItem
            onClick={() => {
              onDownloadRow();
              menuActions.onClose();
            }}
          >
            <Iconify icon="solar:download-bold" />
            {t('documentManagement.actions.download')}
          </MenuItem>

          <MenuItem
            onClick={() => {
              onEditRow();
              menuActions.onClose();
            }}
          >
            <Iconify icon="solar:pen-bold" />
            {t('documentManagement.actions.edit')}
          </MenuItem>

          <MenuItem
            onClick={() => {
              onChangeControlRow();
              menuActions.onClose();
            }}
          >
            <Iconify icon="solar:history-bold" />
            {t('documentManagement.actions.changeControl')}
          </MenuItem>

          <MenuItem
            onClick={() => {
              router.push(paths.dashboard.documents.documentManagementMap(String(row.id)));
              menuActions.onClose();
            }}
          >
            <Iconify icon="solar:map-point-bold" />
            {t('documentManagement.actions.map')}
          </MenuItem>

          <MenuItem
            onClick={() => {
              confirmDialog.onTrue();
              menuActions.onClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            {t('documentManagement.actions.delete')}
          </MenuItem>
        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={confirmDialog.value}
        onClose={confirmDialog.onFalse}
        title={t('documentManagement.dialogs.delete.title')}
        content={t('documentManagement.dialogs.delete.content')}
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            {t('documentManagement.actions.delete')}
          </Button>
        }
      />
    </>
  );
}

type ChangeControlFilters = {
  changeDate: string;
  userName: string;
  currentStatus: string;
  previousStatus: string;
  numberOfDays: string;
  comments: string;
};

type DocumentChangeControlDrawerProps = {
  open: boolean;
  onClose: () => void;
  document: DocumentItem | null;
};

function DocumentChangeControlDrawer({ open, onClose, document }: DocumentChangeControlDrawerProps) {
  const { t } = useTranslate('documents');
  const table = useTable();

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<DocumentChangeControlItem[]>([]);
  const [filters, setFilters] = useState<ChangeControlFilters>({
    changeDate: '',
    userName: '',
    currentStatus: '',
    previousStatus: '',
    numberOfDays: '',
    comments: '',
  });

  const handleClose = useCallback(() => {
    onClose();
    table.onResetPage();
    setRows([]);
    setFilters({
      changeDate: '',
      userName: '',
      currentStatus: '',
      previousStatus: '',
      numberOfDays: '',
      comments: '',
    });
  }, [onClose, table]);

  useEffect(() => {
    if (!open || !document) return;

    const load = async () => {
      try {
        setLoading(true);
        const { items } = await GetDocumentChangeControlsByDocumentIdService(document.id);
        setRows(items);
      } catch {
        setRows([]);
        toast.error(t('documentManagement.changeControl.messages.error.loading'));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [document, open, t]);

  const filteredRows = useMemo(() => {
    const normalize = (value: string) => value.trim().toLowerCase();
    const f = {
      changeDate: normalize(filters.changeDate),
      userName: normalize(filters.userName),
      currentStatus: normalize(filters.currentStatus),
      previousStatus: normalize(filters.previousStatus),
      numberOfDays: normalize(filters.numberOfDays),
      comments: normalize(filters.comments),
    };

    const userLabel = (row: DocumentChangeControlItem) => {
      const raw = `${row.user?.names ?? ''} ${row.user?.lastnames ?? ''}`.trim();
      if (raw) return raw;
      if (row.user?.email) return row.user.email;
      if (row.createdBy) return row.createdBy;
      return '-';
    };

    return rows.filter((row) => {
      const dateText = fDateTime(row.changeDate, 'YYYY-MM-DD HH:mm');
      const currentStatus = row.currentStatus?.name ?? '-';
      const previousStatus = row.previousStatus?.name ?? '-';
      const daysText = Number.isFinite(row.numberOfDays) ? String(row.numberOfDays) : '';
      const comments = row.comments ?? '';

      if (f.changeDate && !dateText.toLowerCase().includes(f.changeDate)) return false;
      if (f.userName && !userLabel(row).toLowerCase().includes(f.userName)) return false;
      if (f.currentStatus && !currentStatus.toLowerCase().includes(f.currentStatus)) return false;
      if (f.previousStatus && !previousStatus.toLowerCase().includes(f.previousStatus)) return false;
      if (f.numberOfDays && !daysText.toLowerCase().includes(f.numberOfDays)) return false;
      if (f.comments && !comments.toLowerCase().includes(f.comments)) return false;
      return true;
    });
  }, [filters, rows]);

  useEffect(() => {
    if (!open) return;
    table.onResetPage();
  }, [filters, open, table]);

  const pagedRows = useMemo(() => {
    const start = table.page * table.rowsPerPage;
    const end = start + table.rowsPerPage;
    return filteredRows.slice(start, end);
  }, [filteredRows, table.page, table.rowsPerPage]);

  const headCells: TableHeadCellProps[] = useMemo(
    () => [
      { id: 'changeDate', label: t('documentManagement.changeControl.table.columns.changeDate'), width: 200 },
      { id: 'userName', label: t('documentManagement.changeControl.table.columns.userName'), width: 220 },
      { id: 'currentStatus', label: t('documentManagement.changeControl.table.columns.currentStatus'), width: 200 },
      { id: 'previousStatus', label: t('documentManagement.changeControl.table.columns.previousStatus'), width: 200 },
      { id: 'numberOfDays', label: t('documentManagement.changeControl.table.columns.numberOfDays'), width: 180, align: 'center' },
      { id: 'comments', label: t('documentManagement.changeControl.table.columns.comments'), width: 360 },
    ],
    [t]
  );

  const notFound = !loading && filteredRows.length === 0;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      PaperProps={{ sx: { width: { xs: 1, md: 1100 } } }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="subtitle1" sx={{ flex: 1 }}>
          {t('documentManagement.changeControl.drawer.title', { code: document?.code ?? '' })}
        </Typography>
        <IconButton onClick={handleClose}>
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </Box>

      <Scrollbar sx={{ height: 1 }}>
        <Box sx={{ p: 2.5 }}>
          <Table stickyHeader sx={{ minWidth: 1200 }}>
            <TableHeadCustom headCells={headCells} />

            <TableBody>
              <TableRow>
                <TableCell>
                  <TextField
                    size="small"
                    fullWidth
                    value={filters.changeDate}
                    onChange={(e) => setFilters((prev) => ({ ...prev, changeDate: e.target.value }))}
                    placeholder={t('documentManagement.changeControl.table.filters.changeDate')}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    fullWidth
                    value={filters.userName}
                    onChange={(e) => setFilters((prev) => ({ ...prev, userName: e.target.value }))}
                    placeholder={t('documentManagement.changeControl.table.filters.userName')}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    fullWidth
                    value={filters.currentStatus}
                    onChange={(e) => setFilters((prev) => ({ ...prev, currentStatus: e.target.value }))}
                    placeholder={t('documentManagement.changeControl.table.filters.currentStatus')}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    fullWidth
                    value={filters.previousStatus}
                    onChange={(e) => setFilters((prev) => ({ ...prev, previousStatus: e.target.value }))}
                    placeholder={t('documentManagement.changeControl.table.filters.previousStatus')}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    fullWidth
                    value={filters.numberOfDays}
                    onChange={(e) => setFilters((prev) => ({ ...prev, numberOfDays: e.target.value }))}
                    placeholder={t('documentManagement.changeControl.table.filters.numberOfDays')}
                    inputProps={{ inputMode: 'numeric' }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    fullWidth
                    value={filters.comments}
                    onChange={(e) => setFilters((prev) => ({ ...prev, comments: e.target.value }))}
                    placeholder={t('documentManagement.changeControl.table.filters.comments')}
                  />
                </TableCell>
              </TableRow>

              {loading ? (
                <TableSkeleton rowCount={table.rowsPerPage} cellCount={headCells.length} sx={{ height: 56 }} />
              ) : (
                pagedRows.map((row) => {
                  const userName = `${row.user?.names ?? ''} ${row.user?.lastnames ?? ''}`.trim() || row.user?.email || row.createdBy || '-';
                  return (
                    <TableRow hover key={row.id}>
                      <TableCell>{fDateTime(row.changeDate, 'YYYY-MM-DD HH:mm')}</TableCell>
                      <TableCell>{userName}</TableCell>
                      <TableCell>{row.currentStatus?.name ?? '-'}</TableCell>
                      <TableCell>{row.previousStatus?.name ?? '-'}</TableCell>
                      <TableCell align="center">{Number.isFinite(row.numberOfDays) ? row.numberOfDays : '-'}</TableCell>
                      <TableCell>{row.comments || '-'}</TableCell>
                    </TableRow>
                  );
                })
              )}

              <TableNoData notFound={notFound} />
            </TableBody>
          </Table>
        </Box>
      </Scrollbar>

      <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'flex-start', borderTop: '1px solid', borderColor: 'divider' }}>
        <Button variant="outlined" color="inherit" onClick={handleClose}>
          {t('documentManagement.actions.cancel')}
        </Button>
      </Box>

      <TablePaginationCustom
        page={table.page}
        count={loading ? 0 : filteredRows.length}
        rowsPerPage={table.rowsPerPage}
        onPageChange={table.onChangePage}
        onRowsPerPageChange={table.onChangeRowsPerPage}
      />
    </Drawer>
  );
}
