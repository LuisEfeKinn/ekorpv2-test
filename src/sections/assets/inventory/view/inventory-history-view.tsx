'use client';

import type { Theme, SxProps } from '@mui/material/styles';
import type { IInventoryHistory } from 'src/types/assets';

import { useSetState } from 'minimal-shared/hooks';
import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import { TableContainer } from '@mui/material';
import TableBody from '@mui/material/TableBody';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetInventoryHistoryByIdService } from 'src/services/assets/inventory.service';

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

import { InventoryHistoryTableRow } from '../inventory-history-table-row';

// ----------------------------------------------------------------------

type Props = {
  assetId: string;
  assetName?: string;
  sx?: SxProps<Theme>;
};

export function InventoryHistoryView({ assetId, assetName, sx }: Props) {
  const { t } = useTranslate('assets');
  const table = useTable({ defaultRowsPerPage: 10 });

  const [loading, setLoading] = useState(true);
  const [tableData, setTableData] = useState<IInventoryHistory[]>([]);
  const [totalRows, setTotalRows] = useState(0);

  const filters = useSetState({
    page: 1,
    perPage: 10,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await GetInventoryHistoryByIdService(assetId, {
        page: filters.state.page,
        perPage: filters.state.perPage,
      });

      setTableData(response.data.data || []);
      setTotalRows(response.data.total || 0);
    } catch (error) {
      console.error('Error loading history:', error);
      setTableData([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  }, [assetId, filters.state.page, filters.state.perPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleChangePage = useCallback(
    (event: unknown, newPage: number) => {
      table.onChangePage(event, newPage);
      filters.setState({ page: newPage + 1 });
    },
    [filters, table]
  );

  const handleChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newRowsPerPage = parseInt(event.target.value, 10);
      table.onChangeRowsPerPage(event);
      filters.setState({ perPage: newRowsPerPage, page: 1 });
      table.setPage(0);
    },
    [filters, table]
  );

  const denseHeight = table.dense ? 56 : 76;

  const notFound = !loading && !tableData.length;

  const TABLE_HEAD = [
    { id: 'type', label: t('inventory.history.type'), width: 120 },
    { id: 'description', label: t('inventory.history.description'), width: 300 },
    { id: 'date', label: t('inventory.history.date'), width: 140 },
    { id: 'performedBy', label: t('inventory.history.performedBy'), width: 180 },
    { id: 'targetEmployee', label: t('inventory.history.targetEmployee'), width: 180 },
    { id: 'changes', label: t('inventory.history.changes'), width: 'auto' },
  ];

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('inventory.history.title')}
        links={[
          {
            name: t('home'),
            href: paths.dashboard.root,
          },
          {
            name: t('inventory.title'),
            href: paths.dashboard.assets.inventory,
          },
          {
            name: assetName || t('inventory.history.asset'),
          },
        ]}
        action={
          <Button
            variant="outlined"
            startIcon={<Iconify icon={"solar:arrow-left-bold" as any} />}
            href={paths.dashboard.assets.inventory}
          >
            {t('inventory.actions.back')}
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card sx={sx}>
        <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
          <Scrollbar sx={{ minHeight: 444 }}>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
              <TableHeadCustom
                order={table.order}
                orderBy={table.orderBy}
                headCells={TABLE_HEAD}
                rowCount={tableData.length}
                onSort={table.onSort}
              />

              <TableBody>
                {tableData
                  .slice(
                    table.page * table.rowsPerPage,
                    table.page * table.rowsPerPage + table.rowsPerPage
                  )
                  .map((row) => (
                    <InventoryHistoryTableRow key={row.id} row={row} />
                  ))}

                <TableEmptyRows
                  height={denseHeight}
                  emptyRows={emptyRows(table.page, table.rowsPerPage, tableData.length)}
                />

                <TableNoData notFound={notFound} />
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>

        <TablePaginationCustom
          page={table.page}
          dense={table.dense}
          count={totalRows}
          rowsPerPage={table.rowsPerPage}
          onPageChange={handleChangePage}
          onChangeDense={table.onChangeDense}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>
    </DashboardContent>
  );
}
