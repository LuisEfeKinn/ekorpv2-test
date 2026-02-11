'use client';

import type { TableHeadCellProps } from 'src/components/table';
import type { IState, ICategory, IEmployee, IAssetsItem, IAssetsTableFilters } from 'src/types/assets';

import { varAlpha } from 'minimal-shared/utils';
import { useSetState, useDebounce } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetCategoriesPaginationService } from 'src/services/assets/categories.service';
import { GetUserManagmentPaginationService } from 'src/services/employees/user-managment.service';
import {
  DeleteInventoryService,
  GetInventoryStatesService,
  GetInventoryPaginationService,
} from 'src/services/assets/inventory.service';

import { Label } from 'src/components/label';
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

import { InventoryTableRow } from '../inventory-table-row';
import { InventoryTableToolbar } from '../inventory-table-toolbar';
import { InventoryTableFiltersResult } from '../inventory-table-filters-result';

// ----------------------------------------------------------------------

export function InventoryView() {
  const { t } = useTranslate('assets');
  const table = useTable();

  const [tableData, setTableData] = useState<IAssetsItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [categoryOptions, setCategoryOptions] = useState<ICategory[]>([]);
  const [stateOptions, setStateOptions] = useState<IState[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<IEmployee[]>([]);

  const TABLE_HEAD: TableHeadCellProps[] = useMemo(() => [
    { id: 'actions', label: '', width: 88 },
    { id: 'internalId', label: t('inventory.table.columns.internalId'), width: 120 },
    { id: 'name', label: t('inventory.table.columns.name') },
    { id: 'serial', label: t('inventory.table.columns.serial'), width: 150 },
    { id: 'category', label: t('inventory.table.columns.category'), width: 120 },
    { id: 'purchaseDate', label: t('inventory.table.columns.purchaseDate'), width: 130 },
    { id: 'purchaseValue', label: t('inventory.table.columns.purchaseValue'), width: 130 },
    { id: 'warrantyExpiration', label: t('inventory.table.columns.warrantyExpiration'), width: 150 },
    { id: 'state', label: t('inventory.table.columns.state'), width: 120 },
    { id: 'assignedTo', label: t('inventory.table.columns.assignedTo') },
  ], [t]);

  const filters = useSetState<IAssetsTableFilters>({
    name: '',
    category: [],
    state: [],
    employee: [],
    serial: '',
    internalId: '',
    includeInactive: false,
    hasActiveAssignment: undefined,
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const debouncedSearch = useDebounce(currentFilters.name, 300);

  const loadData = useCallback(async () => {
    try { 
      const params: any = {
        page: table.page + 1,
        perPage: table.rowsPerPage,
        search: debouncedSearch,
        includeInactive: currentFilters.includeInactive,
        order: 'asset.name:asc'
      };

      // Filtros opcionales
      if (currentFilters.category.length > 0) {
        params.categoryId = currentFilters.category.map(cat => cat.id).join(',');
      }
      if (currentFilters.state.length > 0) {
        params.stateId = currentFilters.state.map(state => state.id).join(',');
      }
      if (currentFilters.employee.length > 0) {
        params.employeeId = currentFilters.employee.map(emp => emp.id).join(',');
      }
      if (currentFilters.serial) {
        params.serial = currentFilters.serial;
      }
      if (currentFilters.internalId) {
        params.internalId = currentFilters.internalId;
      }
      if (currentFilters.hasActiveAssignment !== undefined) {
        params.hasActiveAssignment = currentFilters.hasActiveAssignment;
      }

      const response = await GetInventoryPaginationService(params);
      if (response.data) {
        setTableData(response.data.data || []);
        setTotalItems(response.data.meta?.itemCount || 0);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
      toast.error(t('inventory.messages.error.loading'));
      setTableData([]);
      setTotalItems(0);
    }
  }, [table.page, table.rowsPerPage, debouncedSearch, currentFilters, t]);

  // Función para cargar categorías con búsqueda (15 por página)
  const loadCategories = useCallback(async (search: string = '') => {
    try {
      const params = {
        page: 1,
        perPage: 15,
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

  // Función para cargar estados con búsqueda (20 por página)
  const loadStates = useCallback(async (search: string = '') => {
    try {
      const params = {
        page: 1,
        perPage: 20,
        search,
      };
      
      const response = await GetInventoryStatesService(params);
      if (response.data) {
        setStateOptions(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading states:', error);
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
        // Mapear IUserManagement a IEmployee
        const mappedEmployees: IEmployee[] = response.data.data.map((user: any) => ({
          id: user.id,
          firstName: user.firstName || '',
          firstLastName: user.firstLastName || '',
          secondName: user.secondName,
          secondLastName: user.secondLastName,
          email: user.email || '',
        }));
        setEmployeeOptions(mappedEmployees);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  }, []);

  // Cargar opciones iniciales al montar
  useEffect(() => {
    loadCategories();
    loadStates();
    loadEmployees();
  }, [loadCategories, loadStates, loadEmployees]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const dataFiltered = tableData;

  const canReset = !!currentFilters.name || currentFilters.category.length > 0 || 
                   currentFilters.state.length > 0 || currentFilters.employee.length > 0 || 
                   !!currentFilters.serial || !!currentFilters.internalId || 
                   currentFilters.hasActiveAssignment !== undefined;
  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        const response = await DeleteInventoryService(id);

        if (response.data?.statusCode === 200 || response.status === 200) {
          toast.success(t('inventory.messages.success.deleted'));
          loadData();
        }
      } catch (error) {
        console.error('Error deleting inventory item:', error);
        toast.error(t('inventory.messages.error.deleting'));
      }
    },
    [loadData, t]
  );

  const handleResetFilters = useCallback(() => {
    table.onResetPage();
    updateFilters({ 
      name: '', 
      category: [], 
      state: [],
      employee: [],
      serial: '',
      internalId: '',
      includeInactive: false,
      hasActiveAssignment: undefined
    });
  }, [updateFilters, table]);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('inventory.title')}
        links={[
          { name: t('inventory.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('inventory.breadcrumbs.inventory'), href: paths.dashboard.assets.inventory },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.assets.inventoryCreate}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            {t('inventory.actions.add')}
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <Tabs
          value="all"
          sx={[
            (theme) => ({
              px: { md: 2.5 },
              boxShadow: `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
            }),
          ]}
        >
          <Tab
            value="all"
            label={t('inventory.table.filters.all')}
            iconPosition="end"
            icon={
              <Label
                variant="filled"
                sx={{
                  backgroundColor: '#212B36',
                  color: '#fff',
                  borderColor: '#212B36',
                }}
              >
                {totalItems}
              </Label>
            }
          />
        </Tabs>

        <InventoryTableToolbar
          filters={currentFilters}
          onFilters={(name, value) => {
            table.onResetPage();
            updateFilters({ [name]: value });
          }}
          categoryOptions={categoryOptions}
          stateOptions={stateOptions}
          employeeOptions={employeeOptions}
          onSearchCategories={loadCategories}
          onSearchStates={loadStates}
          onSearchEmployees={loadEmployees}
        />

        {canReset && (
          <InventoryTableFiltersResult
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
                onSort={table.onSort}
              />

              <TableBody>
                  {dataFiltered.map((row) => (
                    <InventoryTableRow
                      key={row.id}
                      row={row}
                      onDeleteRow={() => handleDeleteRow(row.id)}
                      editHref={`${paths.dashboard.assets.inventoryEdit(row.id)}`}
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
