'use client';

import type { TableHeadCellProps } from 'src/components/table';
import type { IReward, IRewardTableFilters } from 'src/types/rewards';

import { useSetState, useDebounce } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  DeleteRewardsService,
  GetRewardsPaginationService,
} from 'src/services/rewards/rewards.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  TableNoData,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { RewardsTableRow } from '../rewards-table-row';
import { RewardsTableToolbar } from '../rewards-table-toolbar';
import { RewardTableFiltersResult } from '../rewards-table-filters-results';

// ----------------------------------------------------------------------

export function RewardsView() {
  const { t } = useTranslate('rewards');
  const table = useTable();

  const [tableData, setTableData] = useState<IReward[]>([]);
  const [totalItems, setTotalItems] = useState(0);

  const TABLE_HEAD: TableHeadCellProps[] = useMemo(() => [
    { id: 'actions', label: '', width: 88 },
    { id: 'name', label: t('rewards.table.columns.name') },
    { id: 'description', label: t('rewards.table.columns.description') },
    { id: 'category', label: t('rewards.table.columns.category'), width: 150 },
    { id: 'points', label: t('rewards.table.columns.points'), width: 120 },
    { id: 'stock', label: t('rewards.table.columns.stock'), width: 100 },
    { id: 'status', label: t('rewards.table.columns.status'), width: 120 },
  ], [t]);

  const filters = useSetState<IRewardTableFilters>({
    name: '',
    categoryRewardId: '',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const debouncedSearch = useDebounce(currentFilters.name, 300);

  const loadData = useCallback(async () => {
    try {
      // Construir el parámetro order basado en table.orderBy y table.order
      let orderParam: string | undefined;
      
      if (table.orderBy) {
        const direction = table.order === 'asc' ? 'asc' : 'desc';
        
        // Mapear los IDs de las columnas a los campos del backend
        const fieldMapping: { [key: string]: string } = {
          name: 'reward.name',
          category: 'category.name',
          points: 'reward.pointsRequired',
          stock: 'reward.stockAvailable',
        };
        
        const backendField = fieldMapping[table.orderBy];
        if (backendField) {
          orderParam = `${backendField}:${direction}`;
        }
      }

      const params = {
        page: table.page + 1,
        perPage: table.rowsPerPage,
        search: debouncedSearch,
        order: orderParam,
        categoryRewardId: currentFilters.categoryRewardId || undefined,
      };

      const response = await GetRewardsPaginationService(params);
      if (response.data) {
        setTableData(response.data.data || []);
        setTotalItems(response.data.meta?.itemCount || 0);
      }
    } catch (error) {
      console.error('Error loading rewards:', error);
      toast.error(t('rewards.messages.error.loading'));
      setTableData([]);
      setTotalItems(0);
    }
  }, [table.page, table.rowsPerPage, table.order, table.orderBy, debouncedSearch, currentFilters.categoryRewardId, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const dataFiltered = tableData;

  const canReset = !!currentFilters.name || !!currentFilters.categoryRewardId;
  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleSort = useCallback(
    (id: string) => {
      // Solo permitir ordenamiento para las columnas mapeadas
      const sortableColumns = ['name', 'category', 'points', 'stock'];
      if (sortableColumns.includes(id)) {
        table.onSort(id);
      }
    },
    [table]
  );

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        const response = await DeleteRewardsService(id);

        if (response.data?.statusCode === 200 || response.status === 200) {
          toast.success(t('rewards.messages.success.deleted'));
          loadData();
        }
      } catch (error) {
        console.error('Error deleting reward:', error);
        toast.error(t('rewards.messages.error.deleting'));
      }
    },
    [loadData, t]
  );

  const handleResetFilters = useCallback(() => {
    table.onResetPage();
    updateFilters({
      name: '',
      categoryRewardId: '',
    });
  }, [updateFilters, table]);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('rewards.title')}
        links={[
          { name: t('rewards.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('rewards.breadcrumbs.rewards'), href: paths.dashboard.rewards.rewards },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.rewards.rewardsCreate}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            {t('rewards.actions.add')}
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <RewardsTableToolbar
          filters={currentFilters}
          onFilters={(name, value) => {
            table.onResetPage();
            updateFilters({ [name]: value });
          }}
          onResetFilters={handleResetFilters}
        />

        {canReset && (
          <RewardTableFiltersResult
            filters={currentFilters}
            totalResults={totalItems}
            onFilters={(name, value) => {
              updateFilters({ [name]: value });
            }}
            onReset={handleResetFilters}
            sx={{ p: 2.5, pt: 0 }}
          />
        )}

        <Box sx={{ position: 'relative' }}>
          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
              <TableHeadCustom
                order={table.order}
                orderBy={table.orderBy}
                headCells={TABLE_HEAD}
                onSort={handleSort}
              />

              <TableBody>
                {dataFiltered.map((row) => (
                  <RewardsTableRow
                    key={row.id}
                    row={row}
                    onDeleteRow={() => handleDeleteRow(row.id)}
                    editHref={`${paths.dashboard.rewards.rewardsEdit(row.id)}`}
                  />
                ))}

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
  );
}
