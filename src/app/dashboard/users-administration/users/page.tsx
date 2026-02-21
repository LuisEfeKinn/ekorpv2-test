'use client';

import type { IUserClarity } from 'src/types/users';
import type { TableHeadCellProps } from 'src/components/table';

import { varAlpha } from 'minimal-shared/utils';
import { useSetState } from 'minimal-shared/hooks';
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

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetUsersClarityAllService } from 'src/services/security/users.service';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  TableNoData,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { UsersClarityCreateForm } from 'src/sections/users-clarity/users-clarity-create-form';

type UserStatusFilter = 'all' | 'active' | 'inactive';

interface IUserAdministrationTableFilters {
  search: string;
  status: UserStatusFilter;
}

export default function Page() {
  const { t } = useTranslate('security');
  const table = useTable();

  const [tableData, setTableData] = useState<IUserClarity[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [openCreateDrawer, setOpenCreateDrawer] = useState(false);

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
      { id: 'usuario', label: t('usersClarity.table.columns.username') },
      { id: 'nombres', label: t('usersClarity.table.columns.names') },
      { id: 'apellidos', label: t('usersClarity.table.columns.firstLastName') },
      { id: 'correoElectronico', label: t('usersClarity.table.columns.email1') },
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
      setTableData(Array.isArray(data) ? data : []);
      setTotalItems(Array.isArray(data) ? data.length : 0);
    } catch (error) {
      toast.error(t('usersClarity.messages.error.loading'));
      setTableData([]);
      setTotalItems(0);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
    setOpenCreateDrawer(true);
  }, []);

  const handleCloseCreateDrawer = useCallback(() => {
    setOpenCreateDrawer(false);
  }, []);

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
            <Button variant="outlined" onClick={loadData}>
              {t('usersClarity.actions.refresh')}
            </Button>
          </Stack>
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
            <Typography variant="h6">
              {t('usersClarity.form.sections.systemUsers')}
            </Typography>

            <IconButton onClick={handleCloseCreateDrawer}>
              <Iconify icon="mingcute:close-line" />
            </IconButton>
          </Box>

          <Scrollbar sx={{ flexGrow: 1, p: 2.5 }}>
            <UsersClarityCreateForm
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
    </DashboardContent>
  );
}

interface UsersAdministrationTableRowProps {
  row: IUserClarity;
  isActive: boolean;
}

function UsersAdministrationTableRow({ row, isActive }: UsersAdministrationTableRowProps) {
  const { t } = useTranslate('security');

  return (
    <TableRowBasic>
      <TableCellBasic>
        <Stack direction="row" spacing={1} justifyContent="center">
          <Iconify icon="solar:pen-bold" />
          <Iconify icon="solar:trash-bin-trash-bold" />
        </Stack>
      </TableCellBasic>
      <TableCellBasic>{row.idusuario}</TableCellBasic>
      <TableCellBasic>{row.usuario}</TableCellBasic>
      <TableCellBasic>{row.nombres}</TableCellBasic>
      <TableCellBasic>{row.apellidos}</TableCellBasic>
      <TableCellBasic>{row.correoElectronico}</TableCellBasic>
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
