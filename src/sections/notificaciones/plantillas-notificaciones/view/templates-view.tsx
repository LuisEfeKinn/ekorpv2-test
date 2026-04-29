'use client';

import type { TableHeadCellProps } from 'src/components/table';
import type { NotifiableEvent } from 'src/types/notifications';

import { useBoolean, useDebounce } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import TableBody from '@mui/material/TableBody';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { GetNotifiableEventsService, normalizeNotifiableEventsResponse } from 'src/services/notifications/notifiable-events.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, rowInPage, TableNoData, TableSkeleton, TableHeadCustom, TablePaginationCustom } from 'src/components/table';

import { TemplatesTableRow } from '../templates-table-row';
import { TemplatesEditDrawer } from '../templates-edit-drawer';

const getAuditableObjectName = (row: NotifiableEvent) => {
  const key = row.auditableObject?.objectKey;
  if (key) return key;
  const id = row.auditableObject?.id;
  if (typeof id === 'number') return String(id);
  return '-';
};

const compareValues = (a: string | number, b: string | number) => {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
};

export function NotificationTemplatesView() {
  const table = useTable({ defaultOrderBy: 'id', defaultOrder: 'asc' });
  const editDrawer = useBoolean();

  const [rows, setRows] = useState<NotifiableEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editRow, setEditRow] = useState<NotifiableEvent | null>(null);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search.trim(), 300);

  const TABLE_HEAD: TableHeadCellProps[] = useMemo(
    () => [
      { id: '', label: '', width: 72 },
      { id: 'id', label: 'ID', width: 100 },
      { id: 'notificationEventKey', label: 'Nombre del evento', width: 340 },
      { id: 'auditableObject', label: 'Objeto Auditado', width: 220 },
      { id: 'subjectTemplate', label: 'Asunto', width: 360 },
    ],
    []
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await GetNotifiableEventsService();
      const normalized = normalizeNotifiableEventsResponse(res.data);
      setRows(normalized.rows);
      setTotal(normalized.total);
    } catch (error: any) {
      console.error('Error loading notifiable events:', error);
      toast.error(error?.message || 'Error al cargar plantillas');
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    table.onResetPage();
  }, [debouncedSearch, table]);

  const filtered = useMemo(() => {
    if (!debouncedSearch) return rows;
    const term = debouncedSearch.toLowerCase();
    return rows.filter((r) => {
      const key = String(r.notificationEventKey ?? '').toLowerCase();
      const subject = String(r.subjectTemplate ?? '').toLowerCase();
      return key.includes(term) || subject.includes(term);
    });
  }, [rows, debouncedSearch]);

  const sorted = useMemo(() => {
    const orderBy = String(table.orderBy);
    const direction = table.order === 'asc' ? 1 : -1;

    return [...filtered].sort((a, b) => {
      let left: string | number = '';
      let right: string | number = '';

      if (orderBy === 'id') {
        left = a.id;
        right = b.id;
      } else if (orderBy === 'notificationEventKey') {
        left = a.notificationEventKey ?? '';
        right = b.notificationEventKey ?? '';
      } else if (orderBy === 'auditableObject') {
        left = getAuditableObjectName(a);
        right = getAuditableObjectName(b);
      } else if (orderBy === 'subjectTemplate') {
        left = a.subjectTemplate ?? '';
        right = b.subjectTemplate ?? '';
      } else {
        left = a.id;
        right = b.id;
      }

      return compareValues(left, right) * direction;
    });
  }, [filtered, table.order, table.orderBy]);

  const paged = useMemo(() => rowInPage(sorted, table.page, table.rowsPerPage), [sorted, table.page, table.rowsPerPage]);
  const notFound = !sorted.length;

  const handleEdit = (row: NotifiableEvent) => {
    setEditRow(row);
    editDrawer.onTrue();
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Plantillas de notificaciones"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Notificaciones', href: paths.dashboard.notifications.root },
          { name: 'Plantillas de notificaciones', href: paths.dashboard.notifications.templates },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ p: 2.5, alignItems: 'center' }}>
          <TextField
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por evento o asunto..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" />
                </InputAdornment>
              ),
            }}
          />
        </Stack>

        <Box sx={{ position: 'relative' }}>
          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 1100 }}>
              <TableHeadCustom
                headCells={TABLE_HEAD}
                order={table.order}
                orderBy={table.orderBy}
                onSort={table.onSort}
              />

              <TableBody>
                {loading ? (
                  <TableSkeleton rowCount={table.rowsPerPage} cellCount={TABLE_HEAD.length} sx={{ height: 56 }} />
                ) : (
                  paged.map((row) => (
                    <TemplatesTableRow key={row.id} row={row} onEdit={() => handleEdit(row)} />
                  ))
                )}

                {!loading && <TableNoData notFound={notFound} />}
              </TableBody>
            </Table>
          </Scrollbar>
        </Box>

        <TablePaginationCustom
          page={table.page}
          dense={table.dense}
          count={debouncedSearch ? sorted.length : total || sorted.length}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onChangeDense={table.onChangeDense}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>

      <TemplatesEditDrawer
        open={editDrawer.value}
        onClose={editDrawer.onFalse}
        current={editRow}
        onSaved={loadData}
      />
    </DashboardContent>
  );
}
