'use client';

import type { TableHeadCellProps } from 'src/components/table';
import type { IRole, IRoleTableFilters } from 'src/types/roles';

import { useSetState, useDebounce } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { DeleteRoleService, GetRolesPaginationService } from 'src/services/security/roles.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { RoleTableRow } from 'src/sections/roles/roles-table-row';
import { RoleTableToolbar } from 'src/sections/roles/roles-table-toolbar';
import { PermissionsTable } from 'src/sections/permissions/permissions-table';
import { RoleCreateEditForm } from 'src/sections/roles/roles-create-edit-form';
import { RoleTableFiltersResult } from 'src/sections/roles/roles-table-filters-result';

type ApplyFilterProps = {
  inputData: IRole[];
  filters: IRoleTableFilters;
  comparator: (a: Record<string, string | number>, b: Record<string, string | number>) => number;
};

function applyFilter({ inputData, comparator, filters }: ApplyFilterProps) {
  const { name } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0] as unknown as Record<string, string | number>, b[0] as unknown as Record<string, string | number>);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter(
      (item) => item.name.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }

  return inputData;
}

export function UsersAdministrationRolesView() {
  const { t } = useTranslate('security');
  const table = useTable();

  const [tableData, setTableData] = useState<IRole[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [openFormDrawer, setOpenFormDrawer] = useState(false);
  const [editingRole, setEditingRole] = useState<IRole | null>(null);
  const [permissionsRole, setPermissionsRole] = useState<{ id: string; name: string } | null>(null);

  const TABLE_HEAD: TableHeadCellProps[] = useMemo(
    () => [
      { id: 'actions', width: 88 },
      { id: 'name', label: t('roles.table.columns.name') },
      { id: 'description', label: t('roles.table.columns.description') },
      { id: 'isDefault', label: t('roles.table.columns.isDefault'), width: 120 },
    ],
    [t]
  );

  const filters = useSetState<IRoleTableFilters>({
    name: '',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const debouncedSearch = useDebounce(currentFilters.name, 300);

  const loadData = useCallback(async () => {
    try {
      const params = {
        page: table.page + 1,
        perPage: table.rowsPerPage,
        search: debouncedSearch,
      };

      const response = await GetRolesPaginationService(params);

      if (response.data.statusCode === 200) {
        setTableData(response.data.data || []);
        setTotalItems(response.data.data?.length || 0);
      }
    } catch (error) {
      console.error('Error loading roles:', error);
      toast.error(t('roles.messages.error.loading'));
      setTableData([]);
      setTotalItems(0);
    }
  }, [table.page, table.rowsPerPage, debouncedSearch, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: currentFilters,
  });

  const canReset = !!currentFilters.name;
  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        const response = await DeleteRoleService(id);

        if (response.data.statusCode === 200) {
          toast.success(t('roles.messages.success.deleted'));
          loadData();
        }
      } catch (error) {
        console.error('Error deleting role:', error);
        toast.error(t('roles.messages.error.deleting'));
      }
    },
    [loadData, t]
  );

  const handleResetFilters = useCallback(() => {
    table.onResetPage();
    updateFilters({ name: '' });
  }, [updateFilters, table]);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('roles.title')}
        links={[
          { name: t('usersClarity.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('usersClarity.title'), href: paths.dashboard.userAdministration.usersTable },
          { name: t('roles.title') },
        ]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() => {
              setEditingRole(null);
              setOpenFormDrawer(true);
            }}
          >
            {t('roles.actions.add')}
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <RoleTableToolbar
          filters={currentFilters}
          onFilters={(name, value) => {
            table.onResetPage();
            updateFilters({ [name]: value });
          }}
        />

        {canReset && (
          <RoleTableFiltersResult
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
                {dataFiltered
                  .slice(
                    table.page * table.rowsPerPage,
                    table.page * table.rowsPerPage + table.rowsPerPage
                  )
                  .map((row) => (
                    <RoleTableRow
                      key={row.id}
                      row={row}
                      selected={table.selected.includes(row.id)}
                      onSelectRow={() => table.onSelectRow(row.id)}
                      onDeleteRow={() => handleDeleteRow(row.id)}
                      editHref={paths.dashboard.userAdministration.rolesEdit(row.id)}
                      permissionsHref={paths.dashboard.userAdministration.rolePermissions(row.id)}
                      onEdit={() => {
                        setEditingRole(row);
                        setOpenFormDrawer(true);
                      }}
                      onPermissions={() => setPermissionsRole({ id: row.id, name: row.name })}
                    />
                  ))}

                <TableEmptyRows
                  height={table.dense ? 56 : 76}
                  emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
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

      <Drawer
        anchor="right"
        open={openFormDrawer}
        onClose={() => setOpenFormDrawer(false)}
        slotProps={{ backdrop: { invisible: true } }}
        PaperProps={{ sx: { width: { xs: 1, md: 640 } } }}
      >
        <Stack sx={{ height: 1, display: 'flex', flexDirection: 'column' }}>
          <Box
            sx={{
              p: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: (theme) => `solid 1px ${theme.vars.palette.divider}`,
            }}
          >
            <Typography variant="h6">
              {editingRole ? t('roles.actions.edit') : t('roles.actions.create')}
            </Typography>

            <IconButton onClick={() => setOpenFormDrawer(false)}>
              <Iconify icon="mingcute:close-line" />
            </IconButton>
          </Box>

          <Scrollbar sx={{ flexGrow: 1, p: 2.5 }}>
            <RoleCreateEditForm
              currentRole={editingRole || undefined}
              onCancel={() => setOpenFormDrawer(false)}
              onSuccess={() => {
                setOpenFormDrawer(false);
                setEditingRole(null);
                loadData();
              }}
            />
          </Scrollbar>

          <Divider sx={{ borderStyle: 'dashed' }} />
        </Stack>
      </Drawer>

      <Drawer
        anchor="right"
        open={Boolean(permissionsRole)}
        onClose={() => setPermissionsRole(null)}
        slotProps={{ backdrop: { invisible: true } }}
        PaperProps={{ sx: { width: { xs: 1, md: 720 } } }}
      >
        <Stack sx={{ height: 1, display: 'flex', flexDirection: 'column' }}>
          <Box
            sx={{
              p: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: (theme) => `solid 1px ${theme.vars.palette.divider}`,
            }}
          >
            <Typography variant="h6">
              {permissionsRole ? `${t('permissions.title')} - ${permissionsRole.name}` : t('permissions.title')}
            </Typography>

            <IconButton onClick={() => setPermissionsRole(null)}>
              <Iconify icon="mingcute:close-line" />
            </IconButton>
          </Box>

          <Scrollbar sx={{ flexGrow: 1, p: 2.5 }}>
            {permissionsRole ? <PermissionsTable roleId={permissionsRole.id} roleName={permissionsRole.name} /> : null}
          </Scrollbar>

          <Divider sx={{ borderStyle: 'dashed' }} />
        </Stack>
      </Drawer>
    </DashboardContent>
  );
}
