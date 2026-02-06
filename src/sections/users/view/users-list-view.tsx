'use client';

import type { IRole } from 'src/types/roles';
import type { TableHeadCellProps } from 'src/components/table';
import type { IUser, IUserTableFilters } from 'src/types/users';

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
import {
  GetRolesPaginationService
} from 'src/services/security/roles.service';
import {
  DeleteUserService,
  GetUsersPaginationService
} from 'src/services/security/users.service';

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

import { UsersTableRow } from '../users-table-row';
import { UsersTableToolbar } from '../users-table-toolbar';
import { UsersTableFiltersResult } from '../users-table-filters-result';

// ----------------------------------------------------------------------

export function UsersListView() {
  const { t } = useTranslate('security');
  const table = useTable();

  const [tableData, setTableData] = useState<IUser[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [roleOptions, setRoleOptions] = useState<IRole[]>([]);

  const STATUS_OPTIONS = useMemo(() => [
    { value: 'all', label: t('users.table.filters.all') },
    // { value: 'active', label: t('users.table.filters.active') },
    // { value: 'inactive', label: t('users.table.filters.inactive') },
  ], [t]);

  const TABLE_HEAD: TableHeadCellProps[] = useMemo(() => [
    { id: 'actions', width: 88 },
    { id: 'fullName', label: t('users.table.columns.names') },
    { id: 'roles', label: t('users.table.columns.roles') },
    { id: 'status', label: t('users.table.columns.status'), width: 100 },
  ], [t]);

  const filters = useSetState<IUserTableFilters>({
    name: '',
    status: 'all',
    role: [],
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const debouncedSearch = useDebounce(currentFilters.name, 300);

  const loadData = useCallback(async () => {
    try { 
      const params = {
        page: table.page + 1,
        perPage: table.rowsPerPage,
        search: debouncedSearch,
        roleId: currentFilters.role.join(','),
        order: 'user.lastnames:asc'
        //status: currentFilters.status !== 'all' ? currentFilters.status : undefined,
      };

      const response = await GetUsersPaginationService(params);
      if (response.data?.data) {
        setTableData(response.data.data || []);
        setTotalItems(response.data.meta?.itemCount || 0);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error(t('users.messages.error.loading'));
      setTableData([]);
      setTotalItems(0);
    }
  }, [table.page, table.rowsPerPage, debouncedSearch, currentFilters, t]);

  // Cargar roles disponibles al montar
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await GetRolesPaginationService();

        if (response.data?.data) {
          setRoleOptions(
            response.data.data.map((role: any) => ({
              id: role.id,
              name: role.name,
            }))
          );
        }
      } catch (error) {
        console.error('Error loading roles:', error);
      }
    };
    fetchRoles();
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const dataFiltered = tableData;

  const canReset = !!currentFilters.name || currentFilters.status !== 'all';
  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        const response = await DeleteUserService(id);

        if (response.data.statusCode === 200) {
          toast.success(t('users.messages.success.deleted'));
          loadData();
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error(t('users.messages.error.deleting'));
      }
    },
    [loadData, t]
  );

  const handleFilterStatus = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      updateFilters({ status: newValue });
    },
    [updateFilters, table]
  );

  const handleResetFilters = useCallback(() => {
    table.onResetPage();
    updateFilters({ name: '', status: 'all' });
  }, [updateFilters, table]);

  const getStatusCount = useCallback((status: string) => {
    if (status === 'all') return totalItems;
    return dataFiltered.filter(user => user.isActive === (status === 'active')).length;
  }, [dataFiltered, totalItems]);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('users.title')}
        links={[
          { name: t('users.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('users.title') },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.security.usersCreate}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            {t('users.actions.add')}
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <Tabs
          value={currentFilters.status}
          onChange={handleFilterStatus}
          sx={[
            (theme) => ({
              px: { md: 2.5 },
              boxShadow: `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
            }),
          ]}
        >
          {STATUS_OPTIONS.map((tab) => (
            <Tab
              key={tab.value}
              iconPosition="end"
              value={tab.value}
              label={tab.label}
              icon={
                <Label
                  variant={
                    ((tab.value === 'all' || tab.value === currentFilters.status) && 'filled') ||
                    'soft'
                  }
                  color={
                    (tab.value === 'active' && 'success') ||
                    (tab.value === 'inactive' && 'error') ||
                    'default'
                  }
                >
                  {getStatusCount(tab.value)}
                </Label>
              }
            />
          ))}
        </Tabs>

        <UsersTableToolbar
          filters={currentFilters}
          onFilters={(name, value) => {
            table.onResetPage();
            updateFilters({ [name]: value });
          }}
          roleOptions={roleOptions}
        />

        {canReset && (
          <UsersTableFiltersResult
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
                    <UsersTableRow
                      key={row.id}
                      row={row}
                      onDeleteRow={() => handleDeleteRow(row.id)}
                      editHref={`${paths.dashboard.security.usersEdit(row.id)}`}
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