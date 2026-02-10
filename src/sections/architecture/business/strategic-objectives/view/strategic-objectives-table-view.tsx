'use client';

import type { TableHeadCellProps } from 'src/components/table';
import type {
  IStrategicObjective,
  IStrategicObjectiveFilters,
  IStrategicObjectiveFlowNode,
} from 'src/types/architecture/strategic-objectives';

import { varAlpha } from 'minimal-shared/utils';
import { useBoolean , useSetState } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import { Drawer } from '@mui/material';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { DeleteObjectivesService, GetObjectivesFlowService } from 'src/services/architecture/business/objectives.service';

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
import { StrategicObjectivesCreateForm } from '../strategic-objectives-create-form';
import { StrategicObjectivesTableToolbar } from '../strategic-objectives-table-toolbar';

// ----------------------------------------------------------------------

type FlowResponse = { data?: unknown };

const normalizeFlowData = (raw: unknown): IStrategicObjectiveFlowNode[] => {
  if (Array.isArray(raw)) {
    return raw as IStrategicObjectiveFlowNode[];
  }
  if (raw && typeof raw === 'object' && Array.isArray((raw as FlowResponse).data)) {
    return (raw as FlowResponse).data as IStrategicObjectiveFlowNode[];
  }
  return [];
};

export function StrategicObjectivesTableView() {
  const table = useTable();
  const openDrawer = useBoolean();

  const [tableData, setTableData] = useState<IStrategicObjectiveFlowNode[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const TABLE_HEAD: TableHeadCellProps[] = useMemo(() => [
    { id: '', width: 50 },
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

  type FlattenedObjectiveRow = IStrategicObjective & {
    label: string;
    level: number;
    parentId?: number;
    hasChildren: boolean;
    children?: IStrategicObjectiveFlowNode[];
  };

  const flattenDataWithHierarchy = useCallback((data: IStrategicObjectiveFlowNode[], level = 0, parentId?: number): FlattenedObjectiveRow[] => {
    const flattened: FlattenedObjectiveRow[] = [];

    data.forEach((item) => {
      if (!item) return;
      
      const flatItem: FlattenedObjectiveRow = {
        ...item.data,
        id: item.id,
        label: item.label,
        level,
        parentId,
        hasChildren: (item.children?.length ?? 0) > 0,
        children: item.children
      };

      flattened.push(flatItem);

      if (expandedRows.has(Number(item.id)) && Array.isArray(item.children)) {
        flattened.push(...flattenDataWithHierarchy(item.children, level + 1, item.id));
      }
    });

    return flattened;
  }, [expandedRows]);

  const loadData = useCallback(async () => {
    try {
      const response = await GetObjectivesFlowService();

      const list = normalizeFlowData(response?.data);

      setTableData(list);
      setTotalItems(list.length); // Total root items or total items? For tree view, pagination is tricky.
    } catch (error) {
      console.error('Error loading objectives:', error);
      setTableData([]);
      setTotalItems(0);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleExpand = (id: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

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
  
  const flattenedData = flattenDataWithHierarchy(dataFiltered);

  const notFound = !dataFiltered.length && (!!currentFilters.name || currentFilters.status !== 'all');

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
            onClick={openDrawer.onTrue}
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
                rowCount={flattenedData.length}
                numSelected={table.selected.length}
                onSort={table.onSort}
              />

              <TableBody>
                {flattenedData
                  .slice(
                    table.page * table.rowsPerPage,
                    table.page * table.rowsPerPage + table.rowsPerPage
                  )
                  .map((row) => (
                    <StrategicObjectivesTableRow
                      key={row.id}
                      row={row}
                      selected={table.selected.includes(String(row.id))}
                      onSelectRow={() => table.onSelectRow(String(row.id))}
                      onDeleteRow={() => handleDeleteRow(String(row.id))}
                      onEditRow={() => {}}
                      onToggleExpand={() => handleToggleExpand(row.id)}
                      expanded={expandedRows.has(row.id)}
                    />
                ))}

                <TableEmptyRows
                  height={table.dense ? 56 : 76}
                  emptyRows={emptyRows(table.page, table.rowsPerPage, flattenedData.length)}
                />

                <TableNoData notFound={notFound} />
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>

        <TablePaginationCustom
          page={table.page}
          dense={table.dense}
          count={flattenedData.length}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onChangeDense={table.onChangeDense}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>
      
      <Drawer
        open={openDrawer.value}
        onClose={openDrawer.onFalse}
        anchor="right"
        PaperProps={{ sx: { width: { xs: 1, sm: 480, md: 640 } } }}
      >
        <StrategicObjectivesCreateForm
          onSuccess={() => {
            openDrawer.onFalse();
            loadData();
          }}
          onCancel={openDrawer.onFalse}
        />
      </Drawer>
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

type ApplyFilterProps = {
  inputData: IStrategicObjectiveFlowNode[];
  filters: IStrategicObjectiveFilters;
  comparator: (a: Record<string, string | number>, b: Record<string, string | number>) => number;
};

function applyFilter({ inputData, comparator, filters }: ApplyFilterProps) {
  const { name } = filters;

  const toComparable = (node: IStrategicObjectiveFlowNode): Record<string, string | number> => ({
    id: node.id,
    label: node.label ?? '',
    name: node.data?.name ?? '',
    code: node.data?.code ?? '',
  });

  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const aData = toComparable(a[0]);
    const bData = toComparable(b[0]);
    const order = comparator(aData, bData);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter((item) => {
      const nameMatch = (item.data?.name ?? '').toLowerCase().indexOf(name.toLowerCase()) !== -1;
      const codeMatch = (item.data?.code ?? '').toLowerCase().indexOf(name.toLowerCase()) !== -1;
      return nameMatch || codeMatch;
    });
  }

  return inputData;
}
