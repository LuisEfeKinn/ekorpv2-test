'use client';

import type { TableHeadCellProps } from 'src/components/table';
import type { IMyAssets, IMyAssetsTableFilters } from 'src/types/assets';

import { toast } from 'sonner';
import { useSetState, useDebounce } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import { TableRow, TableCell, TableContainer } from '@mui/material';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetMyAssetsService } from 'src/services/assets/inventory.service';

import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, TableHeadCustom, TablePaginationCustom } from 'src/components/table';

import { MyAssetsTableRow } from '../my-assets-table-row';
import { MyAssetsTableToolbar } from '../my-assets-table-toolbar';

// ----------------------------------------------------------------------

export function MyAssetsView() {
  const { t } = useTranslate('assets');
  const table = useTable();

  const [tableData, setTableData] = useState<IMyAssets[]>([]);
  const [totalItems, setTotalItems] = useState(0);

  const TABLE_HEAD: TableHeadCellProps[] = useMemo(
    () => [
      { id: 'asset', label: t('myAssets.table.columns.asset'), width: 200 },
      { id: 'internalId', label: t('myAssets.table.columns.internalId'), width: 120 },
      { id: 'category', label: t('myAssets.table.columns.category'), width: 150 },
      { id: 'serial', label: t('myAssets.table.columns.serial'), width: 150 },
      { id: 'state', label: t('myAssets.table.columns.state'), width: 120 },
      { id: 'assignedAt', label: t('myAssets.table.columns.assignedAt'), width: 150 },
      { id: 'notes', label: t('myAssets.table.columns.notes') },
    ],
    [t]
  );

  const filters = useSetState<IMyAssetsTableFilters>({
    name: '',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const debouncedSearch = useDebounce(currentFilters.name, 300);

  const loadData = useCallback(async () => {
    try {
      const params: any = {
        page: table.page + 1,
        perPage: table.rowsPerPage,
        search: debouncedSearch,
      };

      const response = await GetMyAssetsService(params);
      if (response.data) {
        setTableData(response.data.data || []);
        setTotalItems(response.data.meta?.itemCount || 0);
      }
    } catch (error) {
      console.error('Error loading my assets:', error);
      toast.error(t('myAssets.messages.error.loading'));
      setTableData([]);
      setTotalItems(0);
    }
  }, [table.page, table.rowsPerPage, debouncedSearch, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const dataFiltered = tableData;

  const notFound = !dataFiltered.length;

  const handleFilters = useCallback(
    (name: string, value: any) => {
      updateFilters({ [name]: value });
    },
    [updateFilters]
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('myAssets.title')}
        links={[
          { name: t('myAssets.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('myAssets.breadcrumbs.myAssets') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <MyAssetsTableToolbar filters={currentFilters} onFilters={handleFilters} />

        <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
          <Scrollbar sx={{ minHeight: 444 }}>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
              <TableHeadCustom
                order={table.order}
                orderBy={table.orderBy}
                headCells={TABLE_HEAD}
                rowCount={dataFiltered.length}
                numSelected={table.selected.length}
                onSort={table.onSort}
              />

              <TableBody>
                {dataFiltered.map((row) => (
                  <MyAssetsTableRow key={row.id} row={row} />
                ))}

                {notFound && (
                  <TableRow>
                    <TableCell colSpan={TABLE_HEAD.length} align="center">
                      {t('myAssets.table.noAssets')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>

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
  );
}
