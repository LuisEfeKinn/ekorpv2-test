'use client';

import type { Announcement } from 'src/types/notifications';
import type { TableHeadCellProps } from 'src/components/table';

import { useBoolean, useDebounce } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { GetAnnouncementsService, DeleteAnnouncementService, normalizeAnnouncementsResponse } from 'src/services/notifications/announcements.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, rowInPage, TableNoData, getComparator, TableSkeleton, TableHeadCustom, TablePaginationCustom } from 'src/components/table';

import { AnnouncementsTableRow } from '../announcements-table-row';
import { AnnouncementCreateEditDrawer } from '../announcements-create-edit-drawer';

export function AnnouncementsView() {
  const table = useTable({ defaultOrderBy: 'id', defaultOrder: 'asc' });
  const upsertDrawer = useBoolean();

  const [rows, setRows] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [editRow, setEditRow] = useState<Announcement | null>(null);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search.trim(), 300);

  const TABLE_HEAD: TableHeadCellProps[] = useMemo(
    () => [
      { id: '', label: '', width: 72 },
      { id: 'id', label: 'ID', width: 100 },
      { id: 'title', label: 'Título', width: 280 },
      { id: 'type', label: 'Tipo', width: 140 },
      { id: 'status', label: 'Estado', width: 140 },
      { id: 'order', label: 'Orden', width: 120, align: 'center' },
      { id: 'file', label: 'Imagen del anuncio', width: 220 },
      { id: 'deadlineDate', label: 'Fecha límite', width: 220 },
    ],
    []
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await GetAnnouncementsService();
      const data = normalizeAnnouncementsResponse(res.data);
      setRows(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error loading announcements:', error);
      toast.error(error?.message || 'Error al cargar anuncios');
      setRows([]);
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
    return rows.filter((r) => String(r.title ?? '').toLowerCase().includes(term));
  }, [rows, debouncedSearch]);

  const sorted = useMemo(() => {
    const orderBy = table.orderBy as keyof Announcement;
    const comparator = getComparator(table.order, orderBy as any);
    return [...filtered].sort(comparator as any);
  }, [filtered, table.order, table.orderBy]);

  const paged = useMemo(() => rowInPage(sorted, table.page, table.rowsPerPage), [sorted, table.page, table.rowsPerPage]);

  const notFound = (!sorted.length && !!debouncedSearch) || !sorted.length;

  const handleNew = () => {
    setEditRow(null);
    upsertDrawer.onTrue();
  };

  const handleEdit = (row: Announcement) => {
    setEditRow(row);
    upsertDrawer.onTrue();
  };

  const handleDelete = async (id: number) => {
    try {
      await DeleteAnnouncementService(id);
      toast.success('Anuncio eliminado');
      setRows((prev) => prev.filter((r) => r.id !== id));
      table.onUpdatePageDeleteRow(paged.length);
    } catch (error: any) {
      console.error('Error deleting announcement:', error);
      toast.error(error?.message || 'Error al eliminar anuncio');
    }
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Anuncios"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Notificaciones', href: paths.dashboard.notifications.root },
          { name: 'Anuncios', href: paths.dashboard.notifications.announcements },
        ]}
        action={
          <Button variant="contained" startIcon={<Iconify icon="mingcute:add-line" />} onClick={handleNew}>
            Nuevo
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ p: 2.5, alignItems: 'center' }}>
          <TextField
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título..."
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
                    <AnnouncementsTableRow
                      key={row.id}
                      row={row}
                      onEdit={() => handleEdit(row)}
                      onDelete={() => handleDelete(row.id)}
                    />
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
          count={sorted.length}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onChangeDense={table.onChangeDense}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>

      <AnnouncementCreateEditDrawer
        open={upsertDrawer.value}
        onClose={upsertDrawer.onFalse}
        current={editRow}
        onSaved={loadData}
      />
    </DashboardContent>
  );
}
