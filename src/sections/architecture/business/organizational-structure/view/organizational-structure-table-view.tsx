'use client';

import type { TableHeadCellProps } from 'src/components/table';
import type { IOrganizationalUnit } from 'src/types/organization';

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
import { useRouter } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';
import {
  DeleteOrganizationalUnitService,
  GetOrganizationalUnitPaginationService,
} from 'src/services/organization/organizationalUnit.service';

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

import { OrganizationalStructureTableRow } from 'src/sections/architecture/business/organizational-structure/view/organizational-structure-table-row';
import { OrganizationalStructureTableToolbar } from 'src/sections/architecture/business/organizational-structure/view/organizational-structure-table-toolbar';

// ----------------------------------------------------------------------

type Filters = {
  name: string;
  status: string;
};

export function OrganizationalStructureTableView() {
  const table = useTable();
  const router = useRouter();
  const confirmDialog = useBoolean();

  const [tableData, setTableData] = useState<IOrganizationalUnit[]>([]);
  const [totalItems, setTotalItems] = useState(0);

  const STATUS_OPTIONS = useMemo(() => [{ value: 'all', label: 'Todos' }], []);

  const TABLE_HEAD: TableHeadCellProps[] = useMemo(
    () => [
      { id: '', width: 88 },
      { id: 'code', label: 'Nomenclatura' },
      { id: 'name', label: 'Nombre' },
    ],
    []
  );

  const filters = useSetState<Filters>({ name: '', status: 'all' });
  const { state: currentFilters, setState: updateFilters } = filters;

  const loadData = useCallback(async () => {
    try {
      const response = await GetOrganizationalUnitPaginationService({
        page: table.page + 1,
        perPage: table.rowsPerPage,
        search: currentFilters.name,
      });

      const raw = response?.data;
      let list: IOrganizationalUnit[] = [];
      let count = 0;

      if (Array.isArray(raw)) {
        if (Array.isArray(raw[0])) {
          list = raw[0] as IOrganizationalUnit[];
          count = Number(raw[1] ?? list.length);
        } else {
          list = raw as IOrganizationalUnit[];
          count = list.length;
        }
      }

      setTableData(list);
      setTotalItems(count);
    } catch {
      toast.error('Error al cargar la estructura organizacional');
      setTableData([]);
      setTotalItems(0);
    }
  }, [currentFilters.name, table.page, table.rowsPerPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: currentFilters,
  });

  const canReset = !!currentFilters.name || currentFilters.status !== 'all';
  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        await DeleteOrganizationalUnitService(id);
        toast.success('Eliminado');
        loadData();
      } catch {
        toast.error('Error al eliminar');
      }
    },
    [loadData]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      const deletePromises = table.selected.map((id) => DeleteOrganizationalUnitService(id));
      await Promise.all(deletePromises);
      toast.success('Eliminados');
      table.setSelected([]);
      loadData();
    } catch {
      toast.error('Error al eliminar');
    }
  }, [loadData, table]);

  const handleFilterStatus = useCallback(
    (_event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      updateFilters({ status: newValue });
    },
    [table, updateFilters]
  );

  const handleResetFilters = useCallback(() => {
    table.onResetPage();
    updateFilters({ name: '', status: 'all' });
  }, [table, updateFilters]);

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title="Eliminar"
      content={`¿Está seguro de que desea eliminar ${table.selected.length} elementos?`}
      action={
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            handleDeleteRows();
            confirmDialog.onFalse();
          }}
        >
          Eliminar
        </Button>
      }
    />
  );

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Tabla de Estructura Organizacional"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Estructura Organizacional' },
          ]}
          action={
            <Button
              onClick={() => router.push(paths.dashboard.architecture.organizationalStructureTableCreate)}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              Crear
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          <Tabs
            value={currentFilters.status}
            onChange={handleFilterStatus}
            sx={(theme) => ({
              px: { md: 2.5 },
              boxShadow: `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
            })}
          >
            {STATUS_OPTIONS.map((tabItem) => (
              <Tab
                key={tabItem.value}
                iconPosition="end"
                value={tabItem.value}
                label={tabItem.label}
                icon={
                  <Label
                    variant={
                      ((tabItem.value === 'all' || tabItem.value === currentFilters.status) && 'filled') ||
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

          <OrganizationalStructureTableToolbar
            filters={currentFilters}
            onFilters={(name: 'name', value: string) => {
              table.onResetPage();
              updateFilters({ [name]: value } as Partial<Filters>);
            }}
            onResetFilters={handleResetFilters}
            canReset={canReset}
          />

          <Box sx={{ position: 'relative' }}>
            <TableSelectedAction
              dense={table.dense}
              numSelected={table.selected.length}
              rowCount={dataFiltered.length}
              onSelectAllRows={(checked) =>
                table.onSelectAllRows(
                  checked,
                  dataFiltered.map((row) => String(row.id))
                )
              }
              action={
                <IconButton color="primary" onClick={confirmDialog.onTrue}>
                  <Iconify icon="solar:trash-bin-trash-bold" />
                </IconButton>
              }
            />

            <Scrollbar>
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 720 }}>
                <TableHeadCustom
                  order={table.order}
                  orderBy={table.orderBy}
                  headCells={TABLE_HEAD}
                  rowCount={dataFiltered.length}
                  numSelected={table.selected.length}
                  onSort={table.onSort}
                />

                <TableBody>
                  {dataFiltered
                    .slice(table.page * table.rowsPerPage, table.page * table.rowsPerPage + table.rowsPerPage)
                    .map((row) => (
                      <OrganizationalStructureTableRow
                        key={String(row.id)}
                        row={row}
                        selected={table.selected.includes(String(row.id))}
                        onSelectRow={() => table.onSelectRow(String(row.id))}
                        onDeleteRow={() => handleDeleteRow(String(row.id))}
                        onEditRow={() => {}}
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
  inputData: IOrganizationalUnit[];
  filters: Filters;
  comparator: (a: any, b: any) => number;
};

function applyFilter({ inputData, comparator, filters }: ApplyFilterProps) {
  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  let data = stabilizedThis.map((el) => el[0]);

  if (filters.name) {
    data = data.filter((item) => item?.name?.toLowerCase().includes(filters.name.toLowerCase()));
  }

  return data;
}
