'use client';

import type { TableHeadCellProps } from 'src/components/table';
import type {
  ICategory,
  IAssetsItem,
  IInventoryHistory,
  IUserManagementEmployee,
  IAssetRecordTableFilters,
} from 'src/types/assets';

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
import { GetCategoriesPaginationService } from 'src/services/assets/categories.service';
import { GetUserManagmentPaginationService } from 'src/services/employees/user-managment.service';
import { GetInventoryHistoryService, GetInventoryPaginationService } from 'src/services/assets/inventory.service';

import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, TableHeadCustom, TablePaginationCustom } from 'src/components/table';

import { AssetRecordTableRow } from '../asset-record-table-row';
import { AssetRecordTableToolbar } from '../asset-record-table-toolbar';
import { AssetRecordTableFiltersResult } from '../asset-record-table-filters-result';

// ----------------------------------------------------------------------

export function AssetRecordView() {
  const { t } = useTranslate('assets');
  const table = useTable();

  const [tableData, setTableData] = useState<IInventoryHistory[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [assetOptions, setAssetOptions] = useState<IAssetsItem[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<ICategory[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<IUserManagementEmployee[]>([]);

  const TABLE_HEAD: TableHeadCellProps[] = useMemo(
    () => [
      { id: 'type', label: t('record.table.columns.type'), width: 120 },
      { id: 'asset', label: t('record.table.columns.asset'), width: 200 },
      { id: 'description', label: t('record.table.columns.description') },
      { id: 'date', label: t('record.table.columns.date'), width: 150 },
      { id: 'performedBy', label: t('record.table.columns.performedBy'), width: 150 },
      { id: 'targetEmployee', label: t('record.table.columns.targetEmployee'), width: 150 },
      { id: 'category', label: t('record.table.columns.category'), width: 120 },
    ],
    [t]
  );

  const filters = useSetState<IAssetRecordTableFilters>({
    name: '',
    assetId: [],
    type: [],
    fromDate: '',
    toDate: '',
    category: [],
    performedById: [],
    targetEmployeeId: [],
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const debouncedSearch = useDebounce(currentFilters.name, 300);

  const loadData = useCallback(async () => {
    try {
      const params: any = {
        page: table.page + 1,
        perPage: table.rowsPerPage,
        search: debouncedSearch,
        order: 'history.createdAt:desc',
      };

      // Filtros opcionales
      if (currentFilters.assetId.length > 0) {
        params.assetId = currentFilters.assetId.map((a) => a.id).join(',');
      }
      if (currentFilters.type.length > 0) {
        params.type = currentFilters.type.join(',');
      }
      if (currentFilters.category.length > 0) {
        params.categoryId = currentFilters.category.map((c) => c.id).join(',');
      }
      if (currentFilters.fromDate) {
        params.fromDate = currentFilters.fromDate;
      }
      if (currentFilters.toDate) {
        params.toDate = currentFilters.toDate;
      }
      if (currentFilters.performedById.length > 0) {
        params.performedById = currentFilters.performedById.map((e) => e.id).join(',');
      }
      if (currentFilters.targetEmployeeId.length > 0) {
        params.targetEmployeeId = currentFilters.targetEmployeeId.map((e) => e.id).join(',');
      }

      const response = await GetInventoryHistoryService(params);
      if (response.data) {
        setTableData(response.data.data || []);
        setTotalItems(response.data.meta?.itemCount || 0);
      }
    } catch (error) {
      console.error('Error loading history:', error);
      toast.error(t('record.messages.error.loading'));
      setTableData([]);
      setTotalItems(0);
    }
  }, [table.page, table.rowsPerPage, debouncedSearch, currentFilters, t]);

  // Función para cargar activos con búsqueda (20 por página)
  const loadAssets = useCallback(async (search: string = '') => {
    try {
      const params = {
        page: 1,
        perPage: 20,
        search,
      };

      const response = await GetInventoryPaginationService(params);
      if (response.data) {
        setAssetOptions(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading assets:', error);
    }
  }, []);

  // Función para cargar categorías con búsqueda (20 por página)
  const loadCategories = useCallback(async (search: string = '') => {
    try {
      const params = {
        page: 1,
        perPage: 20,
        search,
      };

      const response = await GetCategoriesPaginationService(params);
      if (response.data) {
        setCategoryOptions(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }, []);

  // Función para cargar empleados con búsqueda (20 por página)
  const loadEmployees = useCallback(async (search: string = '') => {
    try {
      const params = {
        page: 1,
        perPage: 20,
        search,
      };

      const response = await GetUserManagmentPaginationService(params);
      if (response.data) {
        // Mapear solo los campos necesarios
        const employees: IUserManagementEmployee[] = response.data.data.map((user: any) => ({
          id: user.id,
          firstName: user.firstName || '',
          secondName: user.secondName || '',
          firstLastName: user.firstLastName || '',
          secondLastName: user.secondLastName || '',
          email: user.email || '',
        }));
        setEmployeeOptions(employees);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  }, []);

  // Cargar opciones iniciales al montar
  useEffect(() => {
    loadAssets();
    loadCategories();
    loadEmployees();
  }, [loadAssets, loadCategories, loadEmployees]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const dataFiltered = tableData;

  const canReset =
    !!currentFilters.name ||
    currentFilters.assetId.length > 0 ||
    currentFilters.type.length > 0 ||
    currentFilters.category.length > 0 ||
    !!currentFilters.fromDate ||
    !!currentFilters.toDate ||
    currentFilters.performedById.length > 0 ||
    currentFilters.targetEmployeeId.length > 0;

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleResetFilters = useCallback(() => {
    table.onResetPage();
    updateFilters({
      name: '',
      assetId: [],
      type: [],
      fromDate: '',
      toDate: '',
      category: [],
      performedById: [],
      targetEmployeeId: [],
    });
  }, [updateFilters, table]);

  const handleFilters = useCallback(
    (name: string, value: any) => {
      updateFilters({ [name]: value });
    },
    [updateFilters]
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('record.title')}
        links={[
          { name: t('record.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('record.breadcrumbs.record') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <AssetRecordTableToolbar
          filters={currentFilters}
          onFilters={handleFilters}
          assetOptions={assetOptions}
          categoryOptions={categoryOptions}
          employeeOptions={employeeOptions}
          onSearchAssets={loadAssets}
          onSearchCategories={loadCategories}
          onSearchEmployees={loadEmployees}
        />

        {canReset && (
          <AssetRecordTableFiltersResult
            filters={currentFilters}
            onFilters={handleFilters}
            onResetFilters={handleResetFilters}
            results={totalItems}
            sx={{ p: 2.5, pt: 0 }}
          />
        )}

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
                  <AssetRecordTableRow key={row.id} row={row} />
                ))}

                {notFound && (
                  <TableRow>
                    <TableCell colSpan={TABLE_HEAD.length} align="center">
                      {t('record.table.noRecords')}
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
