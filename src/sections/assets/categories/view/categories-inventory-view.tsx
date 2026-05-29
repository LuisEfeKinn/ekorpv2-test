'use client';

import type { TableHeadCellProps } from 'src/components/table';
import type { ICategoriesInventory, ICategoriesInventoryTableFilters } from 'src/types/assets';

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
  DeleteCategoriesService,
  GetCategoriesPaginationService
} from 'src/services/assets/categories.service';

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

import { CategoriesInventoryTableRow } from '../categories-inventory-table-row';
import { CategoriesInventoryTableToolbar } from '../categories-inventory-table-toolbar';
import { CategoriesInventoryTableFiltersResult } from '../categories-inventory-table-filters-results';

// ----------------------------------------------------------------------

export function CategoriesInventoryView() {
  const { t } = useTranslate('assets');
  const table = useTable();

  const [tableData, setTableData] = useState<ICategoriesInventory[]>([]);
  const [totalItems, setTotalItems] = useState(0);

  const TABLE_HEAD: TableHeadCellProps[] = useMemo(() => [
    { id: 'actions', label: '', width: 88 },
    { id: 'name', label: t('categories.table.columns.name'), sortField: 'category.name' },
    { id: 'assetCount', label: t('categories.table.columns.assetCount') },
    { id: 'status', label: t('categories.table.columns.status'), width: 300 },
  ], [t]);

  const filters = useSetState<ICategoriesInventoryTableFilters>({
    name: '',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const [serverOrderBy, setServerOrderBy] = useState<string>('');
  const [serverOrder, setServerOrder] = useState<'asc' | 'desc'>('asc');

  const handleServerSort = useCallback((sortField: string, direction: 'asc' | 'desc') => {
    table.onResetPage();
    setServerOrderBy(sortField);
    setServerOrder(direction);
  }, [table]);

  const debouncedSearch = useDebounce(currentFilters.name, 300);

  const loadData = useCallback(async () => {
    try {
      // Construir el parámetro order basado en table.orderBy y table.order
      // let orderParam: string | undefined;

      // if (table.orderBy) {
      //   const direction = table.order === 'asc' ? 'asc' : 'desc';

      //   // Mapear los IDs de las columnas a los campos del backend
      //   const fieldMapping: { [key: string]: string } = {
      //     name: 'category.name',
      //   };

      //   const backendField = fieldMapping[table.orderBy];
      //   if (backendField) {
      //     orderParam = `${backendField}:${direction}`;
      //   }
      // }

      const params = {
        page: table.page + 1,
        perPage: table.rowsPerPage,
        search: debouncedSearch,
        order: serverOrderBy ? `${serverOrderBy}:${serverOrder}` : undefined,
      };

      const response = await GetCategoriesPaginationService(params);
      if (response.data) {
        setTableData(response.data.data || []);
        setTotalItems(response.data.meta?.itemCount || 0);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error(t('categories.messages.error.loading'));
      setTableData([]);
      setTotalItems(0);
    }
  }, [table.page, table.rowsPerPage, debouncedSearch, serverOrderBy, serverOrder, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const dataFiltered = tableData;

  const canReset = !!currentFilters.name;
  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        const response = await DeleteCategoriesService(id);

        if (response.data?.statusCode === 200 || response.status === 200) {
          toast.success(t('categories.messages.success.deleted'));
          loadData();
        }
      } catch (error) {
        console.error('Error deleting category:', error);
        toast.error(t('categories.messages.error.deleting'));
      }
    },
    [loadData, t]
  );

  const handleResetFilters = useCallback(() => {
    table.onResetPage();
    updateFilters({
      name: '',
    });
  }, [updateFilters, table]);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('categories.title')}
        links={[
          { name: t('categories.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('categories.breadcrumbs.categories'), href: paths.dashboard.assets.inventoryCategories },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.assets.inventoryCategoriesCreate}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            {t('categories.actions.add')}
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <CategoriesInventoryTableToolbar
          filters={currentFilters}
          onFilters={(name, value) => {
            table.onResetPage();
            updateFilters({ [name]: value });
          }}
          onResetFilters={handleResetFilters}
        />

        {canReset && (
          <CategoriesInventoryTableFiltersResult
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
                headCells={TABLE_HEAD}
                serverOrderBy={serverOrderBy}
                serverOrder={serverOrder}
                onServerSort={handleServerSort}
              />

              <TableBody>
                {dataFiltered.map((row) => (
                  <CategoriesInventoryTableRow
                    key={row.id}
                    row={row}
                    onDeleteRow={() => handleDeleteRow(row.id)}
                    editHref={`${paths.dashboard.assets.inventoryCategoriesEdit(row.id)}`}
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
