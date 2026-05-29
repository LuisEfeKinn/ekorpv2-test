'use client';

import type { TableHeadCellProps } from 'src/components/table';
import type { IClient, IClientTableFilters } from 'src/types/project-management';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useBoolean, useSetState, useDebounce } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { DeleteClientService, GetClientsPaginationService } from 'src/services/project-management/client.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  TableNoData,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { ClientsTableRow } from '../clients-table-row';
import { ClientsTableToolbar } from '../clients-table-toolbar';
import { ClientsCreateEditDrawer } from '../clients-create-edit-drawer';
import { ClientsTableFiltersResult } from '../clients-table-filters-result';

// ----------------------------------------------------------------------

export function ClientsView() {
  const { t } = useTranslate('project-management');
  const table = useTable();
  const createEditDrawer = useBoolean();

  const [tableData, setTableData] = useState<IClient[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentRow, setCurrentRow] = useState<IClient | null>(null);

  const filters = useSetState<IClientTableFilters>({ search: '', isActive: 'all' });
  const { state: currentFilters, setState: updateFilters } = filters;

  const TABLE_HEAD: TableHeadCellProps[] = useMemo(
    () => [
      { id: '', width: 60 },
      { id: 'name', label: t('clients.table.columns.name') },
      { id: 'nit', label: t('clients.table.columns.nit'), width: 180 },
      { id: 'isActive', label: t('clients.table.columns.status'), width: 120 },
      { id: 'createdAt', label: t('clients.table.columns.createdAt'), width: 160 },
    ],
    [t]
  );

  const debouncedSearch = useDebounce(currentFilters.search, 300);

  const canReset = !!currentFilters.search || currentFilters.isActive !== 'all';
  const notFound = !tableData.length;

  const loadData = useCallback(async () => {
    try {
      const params: Record<string, unknown> = {
        page: table.page + 1,
        perPage: table.rowsPerPage,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (currentFilters.isActive !== 'all') params.isActive = currentFilters.isActive === 'true';

      const response = await GetClientsPaginationService(params as any);
      setTableData(response.data.data ?? []);
      setTotalItems(response.data.meta?.itemCount ?? 0);
    } catch {
      toast.error(t('clients.messages.errorLoading'));
      setTableData([]);
      setTotalItems(0);
    }
  }, [table.page, table.rowsPerPage, debouncedSearch, currentFilters.isActive, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = useCallback(() => {
    setCurrentRow(null);
    createEditDrawer.onTrue();
  }, [createEditDrawer]);

  const handleOpenEdit = useCallback(
    (row: IClient) => {
      setCurrentRow(row);
      createEditDrawer.onTrue();
    },
    [createEditDrawer]
  );

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        await DeleteClientService(id);
        toast.success(t('clients.messages.deleted'));
        loadData();
      } catch {
        toast.error(t('clients.messages.errorDelete'));
      }
    },
    [loadData, t]
  );

  const handleResetFilters = useCallback(() => {
    table.onResetPage();
    updateFilters({ search: '', isActive: 'all' });
  }, [updateFilters, table]);

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('clients.title')}
          links={[
            { name: t('clients.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('clients.breadcrumbs.projectManagement') },
            { name: t('clients.breadcrumbs.clients') },
          ]}
          action={
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={handleOpenCreate}
            >
              {t('clients.actions.new')}
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          <ClientsTableToolbar
            filters={currentFilters}
            onFilters={(name, value) => {
              table.onResetPage();
              updateFilters({ [name]: value });
            }}
          />

          {canReset && (
            <ClientsTableFiltersResult
              filters={currentFilters}
              totalResults={totalItems}
              onFilters={(name, value) => updateFilters({ [name]: value })}
              onReset={handleResetFilters}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          <Box sx={{ position: 'relative' }}>
            <Scrollbar>
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 720 }}>
                <TableHeadCustom headCells={TABLE_HEAD} />

                <TableBody>
                  {tableData.map((row) => (
                    <ClientsTableRow
                      key={row.id}
                      row={row}
                      onEditRow={() => handleOpenEdit(row)}
                      onDeleteRow={() => handleDeleteRow(row.id)}
                    />
                  ))}

                  <TableEmptyRows
                    height={table.dense ? 56 : 76}
                    emptyRows={emptyRows(0, table.rowsPerPage, tableData.length)}
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

      <ClientsCreateEditDrawer
        open={createEditDrawer.value}
        currentRow={currentRow}
        onClose={createEditDrawer.onFalse}
        onSuccess={loadData}
      />
    </>
  );
}
