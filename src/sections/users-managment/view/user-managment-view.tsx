'use client';

import type { TableHeadCellProps } from 'src/components/table';
import type { IUserManagement, IUserManagementTableFilters } from 'src/types/employees';

import { varAlpha } from 'minimal-shared/utils';
import { useBoolean, useSetState } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  DeleteUserManagmentService,
  GetUserManagmentPaginationService
} from 'src/services/employees/user-managment.service';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import { UserManagmentTableRow } from '../user-managment-table-row';
import { UserManagmentTableToolbar } from '../user-managment-table-toolbar';
import { UserManagmentTableFiltersResult } from '../user-managment-table-filters-result';


// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export function UserManagmentView() {
  const { t: tUsers } = useTranslate('employees');
  const { t: tCommon } = useTranslate('common');
  const table = useTable();
  const confirmDialog = useBoolean();

  const [tableData, setTableData] = useState<IUserManagement[]>([]);
  const [totalItems, setTotalItems] = useState(0);

  const STATUS_OPTIONS = useMemo(() => [
    { value: 'all', label: tUsers('user-management.table.filters.all') },
  ], [tUsers]);

  const TABLE_HEAD: TableHeadCellProps[] = useMemo(() => [
    { id: '', width: 88 },
    { id: 'fullName', label: tUsers('user-management.table.columns.fullName') },
    { id: 'position', label: tUsers('user-management.table.columns.position'), width: 180 },
    { id: 'skill', label: tUsers('user-management.table.columns.skill'), width: 150 },
    { id: 'location', label: tUsers('user-management.table.columns.location'), width: 180 },
    { id: 'billingRate', label: tUsers('user-management.table.columns.billingRate'), width: 150 },
    { id: 'weeklyHours', label: tUsers('user-management.table.columns.weeklyHours'), width: 120 },
    { id: 'startedWorkOn', label: tUsers('user-management.table.columns.startedWorkOn'), width: 120 },
  ], [tUsers]);

  const filters = useSetState<IUserManagementTableFilters>({
    name: '',
    status: 'all',
    positionId: '',
    skillId: '',
    organizationalUnitId: '',
    countryId: '',
    regionId: ''
  });
  const { state: currentFilters, setState: updateFilters } = filters;


  // Función para cargar datos
  const loadData = useCallback(async () => {
    try {
      const params = {
        page: table.page + 1, // Backend uses 1-based pagination
        // take: table.rowsPerPage,
        search: currentFilters.name || undefined,
        positionId: currentFilters.positionId || undefined,
        skillId: currentFilters.skillId || undefined,
        organizationalUnitId: currentFilters.organizationalUnitId || undefined,
        countryId: currentFilters.countryId || undefined,
        regionId: currentFilters.regionId || undefined,
      };

      const response = await GetUserManagmentPaginationService(params);
      // La respuesta tiene la estructura: { statusCode, data: IUserManagement[], meta: {}, message }
      const responseData = response.data;
      setTableData(responseData.data || []);
      setTotalItems(responseData.meta?.itemCount || 0);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error(tUsers('user-management.messages.error.loading'));
      setTableData([]);
      setTotalItems(0);
    }
  }, [table.page, currentFilters.name, currentFilters.positionId, currentFilters.skillId, currentFilters.organizationalUnitId, currentFilters.countryId, currentFilters.regionId, tUsers]);

  // Cargar datos cuando cambian los parámetros
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Aplicar filtros
  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: currentFilters,
  });

  const canReset = !!currentFilters.name || currentFilters.status !== 'all' || !!currentFilters.positionId || !!currentFilters.skillId || !!currentFilters.organizationalUnitId || !!currentFilters.countryId || !!currentFilters.regionId;
  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        const response = await DeleteUserManagmentService(id);

        if (response.data.statusCode === 200) {
          toast.success(tUsers('user-management.messages.success.deleted'));
          loadData(); // Recargar datos
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error(tUsers('user-management.messages.error.deleting'));
      }
    },
    [loadData, tUsers]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      // Eliminar múltiples elementos
      const deletePromises = table.selected.map(id => DeleteUserManagmentService(id));
      await Promise.all(deletePromises);

      toast.success(tUsers('user-management.messages.success.deletedMultiple'));
      table.setSelected([]);
      loadData(); // Recargar datos
    } catch (error) {
      console.error('Error deleting users:', error);
      toast.error(tUsers('user-management.messages.error.deletingMultiple'));
    }
  }, [table, loadData, tUsers]);

  const handleFilterStatus = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      updateFilters({ status: newValue });
    },
    [updateFilters, table]
  );

  const handleResetFilters = useCallback(() => {
    table.onResetPage();
    updateFilters({ name: '', status: 'all', positionId: '', skillId: '', organizationalUnitId: '', countryId: '', regionId: '' });
  }, [updateFilters, table]);

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title={tUsers('user-management.dialogs.delete.title')}
      content={
        <>
          {tUsers('user-management.dialogs.delete.contentMultiple', { count: table.selected.length })}
        </>
      }
      action={
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            handleDeleteRows();
            confirmDialog.onFalse();
          }}
        >
          {tCommon('actions.delete')}
        </Button>
      }
    />
  );

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading={tUsers('user-management.title')}
          links={[
            { name: tUsers('user-management.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: tUsers('user-management.title') },
          ]}
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.employees.userManagmentCreate}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              {tUsers('user-management.actions.add')}
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
                    color="default"
                  >
                    {totalItems}
                  </Label>
                }
              />
            ))}
          </Tabs>

          <UserManagmentTableToolbar
            filters={currentFilters}
            onFilters={(name, value) => {
              table.onResetPage();
              updateFilters({ [name]: value });
            }}
          />

          {canReset && (
            <UserManagmentTableFiltersResult
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
            <TableSelectedAction
              dense={table.dense}
              numSelected={table.selected.length}
              rowCount={dataFiltered.length}
              onSelectAllRows={(checked) =>
                table.onSelectAllRows(
                  checked,
                  dataFiltered.map((row) => row.id)
                )
              }
              action={
                <IconButton color="primary" onClick={confirmDialog.onTrue}>
                  <Iconify icon="solar:trash-bin-trash-bold" />
                </IconButton>
              }
            />

            <Scrollbar>
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                <TableHeadCustom
                  order={table.order}
                  orderBy={table.orderBy}
                  headCells={TABLE_HEAD}
                  rowCount={dataFiltered.length}
                  numSelected={table.selected.length}
                  onSort={table.onSort}
                // onSelectAllRows={(checked) =>
                //   table.onSelectAllRows(
                //     checked,
                //     dataFiltered.map((row) => row.id)
                //   )
                // }
                />

                <TableBody>
                  {dataFiltered
                    .slice(
                      table.page * table.rowsPerPage,
                      table.page * table.rowsPerPage + table.rowsPerPage
                    )
                    .map((row) => (
                      <UserManagmentTableRow
                        key={row.id}
                        row={row}
                        selected={table.selected.includes(row.id)}
                        onSelectRow={() => table.onSelectRow(row.id)}
                        onDeleteRow={() => handleDeleteRow(row.id)}
                        editHref={`${paths.dashboard.employees.userManagmentEdit(row.id)}`}
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
      </DashboardContent>

      {renderConfirmDialog()}
    </>
  );
}

// ----------------------------------------------------------------------

type ApplyFilterProps = {
  inputData: IUserManagement[];
  filters: IUserManagementTableFilters;
  comparator: (a: any, b: any) => number;
};

function applyFilter({ inputData, comparator, filters }: ApplyFilterProps) {
  const { name, status, positionId, skillId, organizationalUnitId, countryId, regionId } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter(
      (item) => {
        const fullName = item.fullName?.toLowerCase() || `${item.firstName || ''} ${item.secondName || ''} ${item.firstLastName || ''} ${item.secondLastName || ''}`.trim().toLowerCase();
        const email = item.email?.toLowerCase() || '';
        const searchTerm = name.toLowerCase();
        return fullName.indexOf(searchTerm) !== -1 || email.indexOf(searchTerm) !== -1;
      }
    );
  }

  if (status !== 'all') {
    // TODO: Implement status filtering when the data model includes a status field
  }

  if (positionId) {
    inputData = inputData.filter((item) => item.position?.id === positionId);
  }

  if (skillId) {
    inputData = inputData.filter((item) => 
      item.skills?.some((skill) => skill.id === skillId)
    );
  }

  if (organizationalUnitId) {
    inputData = inputData.filter((item) => item.organizationalUnitId === organizationalUnitId);
  }

  if (countryId) {
    inputData = inputData.filter((item) => item.location?.country?.id === countryId);
  }

  if (regionId) {
    inputData = inputData.filter((item) => item.location?.region?.id === regionId);
  }

  return inputData;
}
