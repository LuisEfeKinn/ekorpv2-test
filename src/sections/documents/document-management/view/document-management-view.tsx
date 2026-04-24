'use client';

import type { TableHeadCellProps } from 'src/components/table';
import type { DocumentItem, DocumentsMeta, DocumentsListResponse } from 'src/services/documents/documents.service';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useBoolean, usePopover, useDebounce } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  GetDocumentByIdService,
  DeleteDocumentService,
  DownloadDocumentService,
  GetDocumentsPaginationService,
} from 'src/services/documents/documents.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomPopover } from 'src/components/custom-popover';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, TableNoData, TableSkeleton, TableHeadCustom, TablePaginationCustom } from 'src/components/table';

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
  const table = useTable();
  const upsertDrawer = useBoolean();
  const previewDialog = useBoolean();

  const [rows, setRows] = useState<DocumentItem[]>([]);
  const [meta, setMeta] = useState<DocumentsMeta | null>(null);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search.trim(), 350);

  const [editRow, setEditRow] = useState<DocumentItem | null>(null);
  const [previewRow, setPreviewRow] = useState<DocumentItem | null>(null);

  useEffect(() => {
    table.onResetPage();
  }, [debouncedSearch, table]);

  const totalItems = meta?.itemCount ?? rows.length;

  const tableHead: TableHeadCellProps[] = useMemo(
    () => [
      { id: 'options', label: '', width: 72 },
      { id: 'code', label: t('documentManagement.table.columns.code'), width: 160 },
      { id: 'name', label: t('documentManagement.table.columns.name'), width: 260 },
      { id: 'version', label: t('documentManagement.table.columns.version'), width: 100, align: 'center' },
      { id: 'documentType', label: t('documentManagement.table.columns.documentType'), width: 200 },
      { id: 'status', label: t('documentManagement.table.columns.status'), width: 160 },
    ],
    [t]
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
      const response = await GetDocumentsPaginationService({
        page: table.page + 1,
        perPage: table.rowsPerPage,
        ...(debouncedSearch ? { name: debouncedSearch } : {}),
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
  }, [debouncedSearch, t, table.page, table.rowsPerPage]);

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
          <Button variant="contained" startIcon={<Iconify icon="mingcute:add-line" />} onClick={handleOpenCreate}>
            {t('documentManagement.actions.create')}
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <Box sx={{ px: 3, py: 2 }}>
          <TextField
            fullWidth
            value={search}
            onChange={(event) => setSearch(event.target.value)}
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
        </Box>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Scrollbar>
          <Table stickyHeader sx={{ minWidth: 880 }}>
            <TableHeadCustom headCells={tableHead} />

            <TableBody>
              {loading ? (
                <TableSkeleton rowCount={table.rowsPerPage} cellCount={tableHead.length} sx={{ height: 69 }} />
              ) : (
                rows.map((row) => (
                  <DocumentManagementTableRow
                    key={row.id}
                    row={row}
                    onEditRow={() => void handleOpenEdit(row)}
                    onPreviewRow={() => handleOpenPreview(row)}
                    onDownloadRow={() => void handleDownloadRow(row)}
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
    </DashboardContent>
  );
}

type DocumentManagementTableRowProps = {
  row: DocumentItem;
  onEditRow: () => void;
  onPreviewRow: () => void;
  onDownloadRow: () => void;
  onDeleteRow: () => void;
};

function DocumentManagementTableRow({ row, onEditRow, onPreviewRow, onDownloadRow, onDeleteRow }: DocumentManagementTableRowProps) {
  const { t } = useTranslate('documents');
  const router = useRouter();
  const menuActions = usePopover();
  const confirmDialog = useBoolean();

  return (
    <>
      <TableRow hover key={row.id}>
        <TableCell>
          <IconButton color={menuActions.open ? 'inherit' : 'default'} onClick={menuActions.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
        <TableCell>
          <Typography variant="body2" noWrap>
            {row.code || '-'}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2" noWrap>
            {row.name || '-'}
          </Typography>
        </TableCell>
        <TableCell align="center">{row.version ?? '-'}</TableCell>
        <TableCell>{row.documentType?.name || '-'}</TableCell>
        <TableCell>{row.documentStatus?.name || '-'}</TableCell>
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
              router.push(paths.dashboard.documents.documentManagementMap(String(row.id)));
              menuActions.onClose();
            }}
          >
            <Iconify icon="solar:map-point-bold" />
            {t('documentManagement.actions.map')}
          </MenuItem>

          <MenuItem
            onClick={() => {
              router.push(paths.dashboard.documents.documentFeedbacks(String(row.id)));
              menuActions.onClose();
            }}
          >
            <Iconify icon="solar:document-text-bold" />
            {t('documentManagement.actions.feedbacks')}
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
