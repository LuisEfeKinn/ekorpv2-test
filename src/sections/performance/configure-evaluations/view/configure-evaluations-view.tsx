'use client';

import type { TableHeadCellProps } from 'src/components/table';
import type {
  IConfigureEvaluation,
  IConfigureEvaluationTableFilters,
} from 'src/types/performance';

import { useState, useEffect, useCallback } from 'react';
import { useBoolean, useSetState } from 'minimal-shared/hooks';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetConfigureEvaluationsPaginationService } from 'src/services/performance/configure-evaluations.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  rowInPage,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { ConfigureEvaluationsTableRow } from '../configure-evaluations-table-row';
import { ConfigureEvaluationsTableToolbar } from '../configure-evaluations-table-toolbar';
import { ConfigureEvaluationsTableFiltersResult } from '../configure-evaluations-table-filters-result';

// ----------------------------------------------------------------------

export function ConfigureEvaluationsView() {
  const { t } = useTranslate('performance');
  const table = useTable();
  const router = useRouter();
  const confirm = useBoolean();

  const [tableData, setTableData] = useState<IConfigureEvaluation[]>([]);

  const filters = useSetState<IConfigureEvaluationTableFilters>({
    name: '',
    type: '',
    status: '',
    departmentIds: '',
    positionIds: '',
    employeeIds: '',
  });

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: filters.state,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const canReset =
    !!filters.state.name ||
    !!filters.state.type ||
    !!filters.state.status ||
    filters.state.departmentIds.length > 0 ||
    filters.state.positionIds.length > 0 ||
    filters.state.employeeIds.length > 0;

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRow = useCallback(
    (id: string) => {
      const deleteRow = tableData.filter((row) => row.id !== id);
      toast.success(t('configure-evaluations.messages.success.deleted'));
      setTableData(deleteRow);
      table.onUpdatePageDeleteRow(dataInPage.length);
    },
    [dataInPage.length, table, tableData, t]
  );

  const handleDeleteRows = useCallback(() => {
    const deleteRows = tableData.filter((row) => !table.selected.includes(row.id));
    toast.success(t('configure-evaluations.messages.success.deletedMultiple'));
    setTableData(deleteRows);
    table.onUpdatePageDeleteRows(dataInPage.length, dataFiltered.length);
  }, [dataFiltered.length, dataInPage.length, table, tableData, t]);

  const handleEditRow = useCallback(
    (id: string) => {
      router.push(paths.dashboard.performance.configureEvaluationsEdit(id));
    },
    [router]
  );

  const handleViewRow = useCallback(
    (id: string) => {
      router.push(`${paths.dashboard.performance.configureEvaluations}/${id}`);
    },
    [router]
  );

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Solo incluir parámetros que tengan valores
        const params: any = {
          page: table.page + 1,
          perPage: table.rowsPerPage,
        };

        if (filters.state.name) {
          params.search = filters.state.name;
        }
        if (filters.state.type) {
          params.type = filters.state.type;
        }
        if (filters.state.status) {
          params.status = filters.state.status;
        }
        if (filters.state.departmentIds) {
          params.departmentIds = filters.state.departmentIds;
        }
        if (filters.state.positionIds) {
          params.positionIds = filters.state.positionIds;
        }
        if (filters.state.employeeIds) {
          params.employeeIds = filters.state.employeeIds;
        }

        const response = await GetConfigureEvaluationsPaginationService(params);
        // La respuesta puede venir como response.data.data o response.data
        const evaluationsData = Array.isArray(response.data) 
          ? response.data 
          : (response.data?.data || []);
        setTableData(evaluationsData);
      } catch (error) {
        console.error('Error loading evaluations:', error);
        toast.error(t('configure-evaluations.messages.error.loading'));
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    table.page,
    table.rowsPerPage,
    filters.state.name,
    filters.state.type,
    filters.state.status,
    filters.state.departmentIds,
    filters.state.positionIds,
    filters.state.employeeIds,
  ]);

  const TABLE_HEAD: TableHeadCellProps[] = [
    { id: '', label: '' },
    { id: 'name', label: t('configure-evaluations.table.columns.name') },
    { id: 'description', label: t('configure-evaluations.table.columns.description') },
    { id: 'type', label: t('configure-evaluations.table.columns.type') },
    { id: 'period', label: t('configure-evaluations.table.columns.period') },
    { id: 'status', label: t('configure-evaluations.table.columns.status') },
    {
      id: 'totalCompetences',
      label: t('configure-evaluations.table.columns.totalCompetences'),
    },
    {
      id: 'totalObjectives',
      label: t('configure-evaluations.table.columns.totalObjectives'),
    },
    {
      id: 'totalDepartments',
      label: t('configure-evaluations.table.columns.totalDepartments'),
    },
    {
      id: 'totalPositions',
      label: t('configure-evaluations.table.columns.totalPositions'),
    },
    {
      id: 'totalEmployees',
      label: t('configure-evaluations.table.columns.totalEmployees'),
    }
  ];

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('configure-evaluations.title')}
          links={[
            {
              name: t('configure-evaluations.breadcrumbs.dashboard'),
              href: paths.dashboard.root,
            },
            {
              name: t('configure-evaluations.breadcrumbs.configureEvaluations'),
              href: paths.dashboard.performance.configureEvaluations,
            },
          ]}
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.performance.configureEvaluationsCreate}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              {t('configure-evaluations.actions.create')}
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          <ConfigureEvaluationsTableToolbar
            filters={filters}
            onResetPage={table.onResetPage}
          />

          {canReset && (
            <ConfigureEvaluationsTableFiltersResult
              filters={filters}
              totalResults={dataFiltered.length}
              onResetPage={table.onResetPage}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          <Scrollbar>
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
                {dataFiltered
                  .slice(
                    table.page * table.rowsPerPage,
                    table.page * table.rowsPerPage + table.rowsPerPage
                  )
                  .map((row) => (
                    <ConfigureEvaluationsTableRow
                      key={row.id}
                      row={row}
                      selected={table.selected.includes(row.id)}
                      onSelectRow={() => table.onSelectRow(row.id)}
                      onDeleteRow={() => handleDeleteRow(row.id)}
                      onEditRow={() => handleEditRow(row.id)}
                      onViewRow={() => handleViewRow(row.id)}
                    />
                  ))}

                <TableEmptyRows
                  height={table.dense ? 56 : 76}
                  emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
                />

                <TableNoData
                  notFound={notFound}
                  sx={{ textAlign: 'center' }}
                />
              </TableBody>
            </Table>
          </Scrollbar>

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
      </DashboardContent>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title={t('configure-evaluations.dialogs.delete.title')}
        content={
          <>
            {t('configure-evaluations.dialogs.delete.contentMultiple', {
              count: table.selected.length,
            })}
          </>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              handleDeleteRows();
              confirm.onFalse();
            }}
          >
            {t('configure-evaluations.actions.delete')}
          </Button>
        }
      />
    </>
  );
}

// ----------------------------------------------------------------------

type ApplyFilterProps = {
  inputData: IConfigureEvaluation[];
  filters: IConfigureEvaluationTableFilters;
  comparator: (a: any, b: any) => number;
};

function applyFilter({ inputData, comparator, filters }: ApplyFilterProps) {
  const { name, type, status } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter(
      (evaluation) =>
        evaluation.name.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        evaluation.description.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }

  if (type) {
    inputData = inputData.filter((evaluation) => evaluation.type === type);
  }

  if (status) {
    inputData = inputData.filter((evaluation) => evaluation.status === status);
  }

  // Note: Department, position, and employee filtering would be handled by the backend API
  // These filters are sent to the service but not applied client-side

  return inputData;
}
