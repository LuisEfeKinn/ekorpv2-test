'use client';

import type { TableHeadCellProps } from 'src/components/table';
import type { IStrategicObjective, IStrategicObjectiveFilters } from 'src/types/architecture/strategic-objectives';

import { varAlpha } from 'minimal-shared/utils';
import { useSetState } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';
import { DeleteObjectivesService, GetObjectivesPaginationService } from 'src/services/architecture/business/objectives.service';

import { Label } from 'src/components/label';
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

import { StrategicObjectivesTableRow } from '../strategic-objectives-table-row';
import { StrategicObjectivesTableToolbar } from '../strategic-objectives-table-toolbar';

// ----------------------------------------------------------------------

export function StrategicObjectivesTableView() {
  const table = useTable();
  const router = useRouter();

  const [tableData, setTableData] = useState<IStrategicObjective[]>([]);
  const [totalItems, setTotalItems] = useState(0);

  const TABLE_HEAD: TableHeadCellProps[] = useMemo(() => [
    { id: '', width: 88 },
    { id: 'code', label: 'Código' },
    { id: 'name', label: 'Nombre' },
  ], []);

  const STATUS_OPTIONS = useMemo(() => [
    { value: 'all', label: 'Todas' },
  ], []);

  const filters = useSetState<IStrategicObjectiveFilters & { status: string }>({
    name: '',
    status: 'all',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const handleFilterStatus = useCallback(
    (_event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      updateFilters({ status: newValue });
    },
    [table, updateFilters]
  );

  const loadData = useCallback(async () => {
    try {
      const response = await GetObjectivesPaginationService({
        page: table.page + 1,
        perPage: table.rowsPerPage,
        ...currentFilters,
      });

      const raw = response?.data;
      let list: IStrategicObjective[] = [];
      let count = 0;

      if (Array.isArray(raw)) {
        if (Array.isArray(raw[0])) {
          list = raw[0] as IStrategicObjective[];
          count = Number(raw[1] ?? list.length);
        } else {
          list = raw as IStrategicObjective[];
          count = list.length;
        }
      } else if (raw && typeof raw === 'object' && Array.isArray((raw as any).data)) {
        list = (raw as any).data as IStrategicObjective[];
        count = Number((raw as any)?.meta?.itemCount ?? list.length);
      }

      setTableData(list);
      setTotalItems(count);
    } catch (error) {
      console.error('Error loading objectives:', error);
      setTableData([]);
      setTotalItems(0);
    }
  }, [table.page, table.rowsPerPage, currentFilters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        await DeleteObjectivesService(id);
        loadData();
      } catch (error) {
        console.error('Error deleting objective:', error);
      }
    },
    [loadData]
  );

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: currentFilters,
  });

  const notFound = !dataFiltered.length && !!currentFilters.name;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Objetivos Estratégicos"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Arquitectura', href: paths.dashboard.architecture.strategicObjectivesTable },
          { name: 'Objetivos Estratégicos' },
        ]}
        action={
          <Button
            onClick={() => router.push(paths.dashboard.architecture.strategicObjectivesTableCreate)}
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

        <StrategicObjectivesTableToolbar
          filters={currentFilters}
          onFilters={(name, value) => {
            table.onResetPage();
            updateFilters({ [name]: value });
          }}
        />

        <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
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
                {dataFiltered.map((row) => (
                    <StrategicObjectivesTableRow
                      key={row.id}
                      row={row}
                      selected={table.selected.includes(String(row.id))}
                      onSelectRow={() => table.onSelectRow(String(row.id))}
                      onDeleteRow={() => handleDeleteRow(String(row.id))}
                      onEditRow={() => {}}
                    />
                ))}

                <TableEmptyRows
                  height={table.dense ? 56 : 76}
                  emptyRows={emptyRows(0, table.rowsPerPage, dataFiltered.length)}
                />

                <TableNoData notFound={notFound} />
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

// ----------------------------------------------------------------------

type ApplyFilterProps = {
  inputData: IStrategicObjective[];
  filters: IStrategicObjectiveFilters;
  comparator: (a: any, b: any) => number;
};

function applyFilter({ inputData, comparator, filters }: ApplyFilterProps) {
  const { name } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
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
