'use client';

import type { IUserClarity } from 'src/types/users';
import type { TableHeadCellProps } from 'src/components/table';
import type { IRole, IRoleTableFilters } from 'src/types/roles';

import { varAlpha } from 'minimal-shared/utils';
import { useDebounce, useSetState } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  DeleteUserClarityService,
  GetUsersClarityAllService,
} from 'src/services/security/users.service';
import { DeleteRoleService, GetRolesByIdService, GetRolesPaginationService } from 'src/services/security/roles.service';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { LoadingScreen } from 'src/components/loading-screen';
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
import { UsersClarityCreateForm } from 'src/sections/users-clarity/users-clarity-create-form';

type UserStatusFilter = 'all' | 'active' | 'inactive';

interface IUserAdministrationTableFilters {
  search: string;
  status: UserStatusFilter;
}

export default function Page() {
  const { t } = useTranslate('security');
  const router = useRouter();
  const searchParams = useSearchParams();

  const sectionParam = searchParams.get('section');
  const section = sectionParam === 'roles' ? 'roles' : 'users';
  const editRoleId = searchParams.get('editRoleId');
  const permissionsRoleId = searchParams.get('permissionsRoleId');
  const createRole = searchParams.get('createRole') === '1';
  const queryString = searchParams.toString();

  const createNextUrl = useCallback((next: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(next).forEach(([key, value]) => {
      if (!value) params.delete(key);
      else params.set(key, value);
    });

    const qs = params.toString();
    return qs ? `${paths.dashboard.userAdministration.usersTable}?${qs}` : paths.dashboard.userAdministration.usersTable;
  }, [searchParams]);

  const table = useTable();
  const rolesTable = useTable();

  const [tableData, setTableData] = useState<IUserClarity[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [openCreateDrawer, setOpenCreateDrawer] = useState(false);
  const [editingUser, setEditingUser] = useState<IUserClarity | null>(null);

  const [rolesData, setRolesData] = useState<IRole[]>([]);
  const [rolesTotal, setRolesTotal] = useState(0);
  const [currentRole, setCurrentRole] = useState<IRole | null>(null);
  const [loadingRole, setLoadingRole] = useState(false);

  const filters = useSetState<IUserAdministrationTableFilters>({
    search: '',
    status: 'all',
  });

  const { state: currentFilters, setState: updateFilters } = filters;

  const STATUS_OPTIONS = useMemo(
    () => [
      { value: 'all' as UserStatusFilter, label: t('usersClarity.table.filters.all') },
      { value: 'active' as UserStatusFilter, label: t('usersClarity.table.filters.active') },
      { value: 'inactive' as UserStatusFilter, label: t('usersClarity.table.filters.inactive') },
    ],
    [t]
  );

  const TABLE_HEAD: TableHeadCellProps[] = useMemo(
    () => [
      { id: 'actions', width: 88 },
      { id: 'idusuario', label: t('usersClarity.table.columns.id') },
      { id: 'userId', label: t('usersClarity.table.columns.userId') },
      { id: 'usuario', label: t('usersClarity.table.columns.username') },
      { id: 'nombres', label: t('usersClarity.table.columns.names') },
      { id: 'apellidos', label: t('usersClarity.table.columns.firstLastName') },
      { id: 'correoElectronico', label: t('usersClarity.table.columns.email1') },
      { id: 'roles', label: t('usersClarity.table.columns.roles') },
      { id: 'estadousuario', label: t('usersClarity.table.columns.userStatus') },
      { id: 'cargo', label: t('usersClarity.table.columns.position') },
      { id: 'perfil', label: t('usersClarity.table.columns.profile') },
      { id: 'unidadOrganizacional', label: t('usersClarity.table.columns.organizationalUnit') },
      { id: 'jefeInmediato', label: t('usersClarity.table.columns.immediateBoss') },
      { id: 'codigoEmpleado', label: t('usersClarity.table.columns.employeeCode') },
    ],
    [t]
  );

  const loadData = useCallback(async () => {
    try {
      const response = await GetUsersClarityAllService();
      const data = response.data ?? [];
      setTableData(Array.isArray(data) ? data.filter((item) => item !== null && item !== undefined) : []);
      setTotalItems(Array.isArray(data) ? data.length : 0);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error(t('usersClarity.messages.error.loading'));
      setTableData([]);
      setTotalItems(0);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const rolesFilters = useSetState<IRoleTableFilters>({ name: '' });
  const { state: currentRolesFilters, setState: updateRolesFilters } = rolesFilters;
  const debouncedRoleSearch = useDebounce(currentRolesFilters.name, 300);

  const loadRoles = useCallback(async () => {
    try {
      const params = {
        page: rolesTable.page + 1,
        perPage: rolesTable.rowsPerPage,
        search: debouncedRoleSearch,
      };

      const response = await GetRolesPaginationService(params);

      if (response.data.statusCode === 200) {
        setRolesData(response.data.data || []);
        setRolesTotal(response.data.data?.length || 0);
      }
    } catch (error) {
      console.error('Error loading roles:', error);
      toast.error(t('roles.messages.error.loading'));
      setRolesData([]);
      setRolesTotal(0);
    }
  }, [debouncedRoleSearch, rolesTable.page, rolesTable.rowsPerPage, t]);

  useEffect(() => {
    if (section !== 'roles') return;
    loadRoles();
  }, [loadRoles, queryString, section]);

  useEffect(() => {
    const loadRole = async (id: string) => {
      try {
        setLoadingRole(true);
        const response = await GetRolesByIdService(id);
        if (response.data.statusCode === 200) {
          setCurrentRole(response.data.data);
        } else {
          setCurrentRole(null);
        }
      } catch {
        setCurrentRole(null);
      } finally {
        setLoadingRole(false);
      }
    };

    if (editRoleId) {
      void loadRole(editRoleId);
    } else {
      setCurrentRole(null);
      setLoadingRole(false);
    }
  }, [editRoleId]);

  const applyFilter = useCallback(
    (inputData: IUserClarity[], currentFilterState: IUserAdministrationTableFilters) => {
      const { search, status } = currentFilterState;

      let filtered = [...inputData];

      if (search) {
        const query = search.toLowerCase();
        filtered = filtered.filter((item) => {
          const fullName = `${item.nombres ?? ''} ${item.apellidos ?? ''}`.toLowerCase();
          return (
            fullName.includes(query) ||
            (item.usuario ?? '').toLowerCase().includes(query) ||
            (item.correoElectronico ?? '').toLowerCase().includes(query)
          );
        });
      }

      if (status !== 'all') {
        filtered = filtered.filter((item) => {
          const isActive = item.estadousuario === 1;
          return status === 'active' ? isActive : !isActive;
        });
      }

      return filtered;
    },
    []
  );

  const dataFiltered = applyFilter(tableData, currentFilters);

  const canReset = !!currentFilters.search || currentFilters.status !== 'all';
  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleFilterStatus = useCallback(
    (_event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      updateFilters({ status: newValue as UserStatusFilter });
    },
    [updateFilters, table]
  );

  const handleResetFilters = useCallback(() => {
    table.onResetPage();
    updateFilters({ search: '', status: 'all' });
  }, [updateFilters, table]);

  const getStatusCount = useCallback(
    (status: UserStatusFilter) => {
      if (status === 'all') {
        return totalItems;
      }

      return tableData.filter((user) => {
        const isActive = user.estadousuario === 1;
        return status === 'active' ? isActive : !isActive;
      }).length;
    },
    [tableData, totalItems]
  );

  const handleOpenCreateDrawer = useCallback(() => {
    setEditingUser(null);
    setOpenCreateDrawer(true);
  }, []);

  const handleCloseCreateDrawer = useCallback(() => {
    setEditingUser(null);
    setOpenCreateDrawer(false);
  }, []);

  const handleEditUser = useCallback((user: IUserClarity) => {
    setEditingUser(user);
    setOpenCreateDrawer(true);
  }, []);

  const handleDeleteUser = useCallback(
    async (idusuario: number) => {
      try {
        await DeleteUserClarityService(idusuario);
        toast.success('Usuario eliminado correctamente');
        loadData();
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Error al eliminar el usuario');
      }
    },
    [loadData]
  );

  const rolesTableHead: TableHeadCellProps[] = useMemo(
    () => [
      { id: 'actions', width: 88 },
      { id: 'name', label: t('roles.table.columns.name') },
      { id: 'description', label: t('roles.table.columns.description') },
      { id: 'isDefault', label: t('roles.table.columns.isDefault'), width: 120 },
    ],
    [t]
  );

  const rolesFiltered = useMemo(() => {
    const comparator = getComparator(rolesTable.order, rolesTable.orderBy);
    const stabilizedThis = rolesData.map((el, index) => [el, index] as const);

    stabilizedThis.sort((a, b) => {
      const order = comparator(
        a[0] as unknown as Record<string, string | number>,
        b[0] as unknown as Record<string, string | number>
      );
      if (order !== 0) return order;
      return a[1] - b[1];
    });

    const sorted = stabilizedThis.map((el) => el[0]);
    if (!currentRolesFilters.name) return sorted;
    return sorted.filter((item) =>
      item.name.toLowerCase().indexOf(currentRolesFilters.name.toLowerCase()) !== -1
    );
  }, [currentRolesFilters.name, rolesData, rolesTable.order, rolesTable.orderBy]);

  const handleDeleteRole = useCallback(
    async (id: string) => {
      try {
        const response = await DeleteRoleService(id);

        if (response.data.statusCode === 200) {
          toast.success(t('roles.messages.success.deleted'));
          loadRoles();
        }
      } catch (error) {
        console.error('Error deleting role:', error);
        toast.error(t('roles.messages.error.deleting'));
      }
    },
    [loadRoles, t]
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('usersClarity.title')}
        links={[
          { name: t('usersClarity.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('usersClarity.title') },
        ]}
        action={
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              startIcon={<Iconify icon="solar:user-plus-bold" />}
              onClick={handleOpenCreateDrawer}
            >
              {t('users.actions.create')}
            </Button>
          </Stack>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Tabs
        value={section}
        onChange={(_event, nextValue: string) => {
          router.push(
            createNextUrl({
              section: nextValue === 'roles' ? 'roles' : undefined,
              editRoleId: undefined,
              permissionsRoleId: undefined,
              createRole: undefined,
            })
          );
        }}
        sx={{ mb: { xs: 3, md: 3 } }}
      >
        <Tab value="users" label={t('usersClarity.title')} />
        <Tab value="roles" label={t('roles.title')} />
      </Tabs>

      {section === 'users' ? (
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

        <Box sx={{ px: 2.5, py: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              component="input"
              value={currentFilters.search}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                table.onResetPage();
                updateFilters({ search: event.target.value });
              }}
              placeholder={t('usersClarity.table.filters.search')}
              sx={{
                flexGrow: 1,
                px: 2,
                py: 1,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
                typography: 'body2',
              }}
            />

            {canReset && (
              <Button variant="text" color="inherit" onClick={handleResetFilters}>
                {t('usersClarity.table.filters.clear')}
              </Button>
            )}
          </Stack>
        </Box>

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
                  .map((row) => {
                    const isActive = row.estadousuario === 1;

                    return (
                      <UsersAdministrationTableRow
                        key={row.idusuario}
                        row={row}
                        isActive={isActive}
                        onEdit={() => handleEditUser(row)}
                        onDelete={() => handleDeleteUser(row.idusuario)}
                      />
                    );
                  })}

                <TableEmptyRows
                  height={table.dense ? 56 : 76}
                  emptyRows={
                    table.page > 0
                      ? Math.max(0, (1 + table.page) * table.rowsPerPage - dataFiltered.length)
                      : 0
                  }
                />

                <TableNoData notFound={notFound} />
              </TableBody>
            </Table>
          </Scrollbar>
        </Box>

        <TablePaginationCustom
          page={table.page}
          dense={table.dense}
          count={dataFiltered.length}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onChangeDense={table.onChangeDense}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
        </Card>
      ) : (
        <Card>
          <Box sx={{ p: 2.5, display: 'flex', gap: 1.5, alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">{t('roles.title')}</Typography>
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={() => {
                router.push(
                  createNextUrl({
                    section: 'roles',
                    createRole: '1',
                    editRoleId: undefined,
                    permissionsRoleId: undefined,
                  })
                );
              }}
            >
              {t('roles.actions.add')}
            </Button>
          </Box>

          <RoleTableToolbar
            filters={currentRolesFilters}
            onFilters={(name, value) => {
              rolesTable.onResetPage();
              updateRolesFilters({ [name]: value });
            }}
          />

          {!!currentRolesFilters.name && (
            <RoleTableFiltersResult
              filters={currentRolesFilters}
              totalResults={rolesTotal}
              onFilters={(name, value) => {
                updateRolesFilters({ [name]: value });
              }}
              onReset={() => {
                rolesTable.onResetPage();
                updateRolesFilters({ name: '' });
              }}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          <Box sx={{ position: 'relative' }}>
            <Scrollbar>
              <Table size={rolesTable.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                <TableHeadCustom
                  order={rolesTable.order}
                  orderBy={rolesTable.orderBy}
                  headCells={rolesTableHead}
                  onSort={rolesTable.onSort}
                />

                <TableBody>
                  {rolesFiltered
                    .slice(
                      rolesTable.page * rolesTable.rowsPerPage,
                      rolesTable.page * rolesTable.rowsPerPage + rolesTable.rowsPerPage
                    )
                    .map((row) => (
                      <RoleTableRow
                        key={row.id}
                        row={row}
                        selected={rolesTable.selected.includes(row.id)}
                        onSelectRow={() => rolesTable.onSelectRow(row.id)}
                        onDeleteRow={() => handleDeleteRole(row.id)}
                        editHref={createNextUrl({ section: 'roles', editRoleId: row.id, createRole: undefined, permissionsRoleId: undefined })}
                        permissionsHref={createNextUrl({ section: 'roles', permissionsRoleId: row.id, createRole: undefined, editRoleId: undefined })}
                      />
                    ))}

                  <TableEmptyRows
                    height={rolesTable.dense ? 56 : 76}
                    emptyRows={emptyRows(rolesTable.page, rolesTable.rowsPerPage, rolesFiltered.length)}
                  />

                  <TableNoData notFound={!rolesFiltered.length} />
                </TableBody>
              </Table>
            </Scrollbar>
          </Box>

          <TablePaginationCustom
            page={rolesTable.page}
            dense={rolesTable.dense}
            count={rolesFiltered.length}
            rowsPerPage={rolesTable.rowsPerPage}
            onPageChange={rolesTable.onChangePage}
            onChangeDense={rolesTable.onChangeDense}
            onRowsPerPageChange={rolesTable.onChangeRowsPerPage}
          />
        </Card>
      )}

      {section === 'users' ? (
        <Drawer
          anchor="right"
          open={openCreateDrawer}
          onClose={handleCloseCreateDrawer}
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
              <Typography variant="h6">{t('usersClarity.form.sections.systemUsers')}</Typography>

              <IconButton onClick={handleCloseCreateDrawer}>
                <Iconify icon="mingcute:close-line" />
              </IconButton>
            </Box>

            <Scrollbar sx={{ flexGrow: 1, p: 2.5 }}>
              <UsersClarityCreateForm
                mode={editingUser ? 'edit' : 'create'}
                initialUser={editingUser ?? undefined}
                onSuccess={() => {
                  handleCloseCreateDrawer();
                  loadData();
                }}
                onCancel={handleCloseCreateDrawer}
              />
            </Scrollbar>

            <Divider sx={{ borderStyle: 'dashed' }} />
          </Stack>
        </Drawer>
      ) : null}

      <Drawer
        anchor="right"
        open={section === 'roles' && (createRole || Boolean(editRoleId))}
        onClose={() => {
          router.push(
            createNextUrl({
              section: 'roles',
              createRole: undefined,
              editRoleId: undefined,
            })
          );
        }}
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
              {createRole ? t('roles.actions.create') : t('roles.actions.edit')}
            </Typography>

            <IconButton
              onClick={() => {
                router.push(
                  createNextUrl({
                    section: 'roles',
                    createRole: undefined,
                    editRoleId: undefined,
                  })
                );
              }}
            >
              <Iconify icon="mingcute:close-line" />
            </IconButton>
          </Box>

          <Scrollbar sx={{ flexGrow: 1, p: 2.5 }}>
            {createRole ? (
              <RoleCreateEditForm redirectTo={createNextUrl({ section: 'roles' })} />
            ) : loadingRole ? (
              <LoadingScreen />
            ) : (
              <RoleCreateEditForm
                currentRole={currentRole || undefined}
                redirectTo={createNextUrl({ section: 'roles' })}
              />
            )}
          </Scrollbar>

          <Divider sx={{ borderStyle: 'dashed' }} />
        </Stack>
      </Drawer>

      <Drawer
        anchor="right"
        open={section === 'roles' && Boolean(permissionsRoleId)}
        onClose={() => {
          router.push(
            createNextUrl({
              section: 'roles',
              permissionsRoleId: undefined,
            })
          );
        }}
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
            <Typography variant="h6">{t('permissions.title')}</Typography>

            <IconButton
              onClick={() => {
                router.push(
                  createNextUrl({
                    section: 'roles',
                    permissionsRoleId: undefined,
                  })
                );
              }}
            >
              <Iconify icon="mingcute:close-line" />
            </IconButton>
          </Box>

          <Scrollbar sx={{ flexGrow: 1, p: 2.5 }}>
            {permissionsRoleId ? <PermissionsTable roleId={permissionsRoleId} /> : null}
          </Scrollbar>

          <Divider sx={{ borderStyle: 'dashed' }} />
        </Stack>
      </Drawer>
    </DashboardContent>
  );
}

interface UsersAdministrationTableRowProps {
  row: IUserClarity;
  isActive: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function UsersAdministrationTableRow({ row, isActive, onEdit, onDelete }: UsersAdministrationTableRowProps) {
  const { t } = useTranslate('security');

  if (!row) {
    return null;
  }

  const rolesLabel =
    row.linkedUserRoles?.map((r) => r.name).filter(Boolean).join(', ') ||
    row.roleIds?.join(', ') ||
    '-';

  return (
    <TableRowBasic>
      <TableCellBasic>
        <Stack direction="row" spacing={1} justifyContent="center">
          <IconButton size="small" onClick={onEdit}>
            <Iconify icon="solar:pen-bold" />
          </IconButton>
          <IconButton size="small" color="error" onClick={onDelete}>
            <Iconify icon="solar:trash-bin-trash-bold" />
          </IconButton>
        </Stack>
      </TableCellBasic>
      <TableCellBasic>{row.idusuario}</TableCellBasic>
      <TableCellBasic>{row.userId ?? '-'}</TableCellBasic>
      <TableCellBasic>{row.usuario}</TableCellBasic>
      <TableCellBasic>{row.nombres}</TableCellBasic>
      <TableCellBasic>{row.apellidos}</TableCellBasic>
      <TableCellBasic>{row.correoElectronico}</TableCellBasic>
      <TableCellBasic>{rolesLabel}</TableCellBasic>
      <TableCellBasic>
        <Label variant="soft" color={isActive ? 'success' : 'error'}>
          {isActive ? t('usersClarity.status.active') : t('usersClarity.status.inactive')}
        </Label>
      </TableCellBasic>
      <TableCellBasic>-</TableCellBasic>
      <TableCellBasic>{row.descripcionPerfil}</TableCellBasic>
      <TableCellBasic>{row.empresa}</TableCellBasic>
      <TableCellBasic>-</TableCellBasic>
      <TableCellBasic>-</TableCellBasic>
    </TableRowBasic>
  );
}

function TableCellBasic({ children }: { children: React.ReactNode }) {
  return (
    <TableCell>
      <Box sx={{ typography: 'body2', color: 'text.primary' }}>{children}</Box>
    </TableCell>
  );
}

function TableRowBasic({ children }: { children: React.ReactNode }) {
  return <TableRow hover>{children}</TableRow>;
}
