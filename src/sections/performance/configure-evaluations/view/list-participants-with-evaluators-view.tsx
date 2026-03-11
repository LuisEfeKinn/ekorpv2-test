'use client';

import type { TableHeadCellProps } from 'src/components/table';
import type {
  IParticipantWithEvaluators,
  IParticipantWithEvaluatorsTableFilters,
} from 'src/types/performance';

import { useSetState } from 'minimal-shared/hooks';
import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetOrganizationalUnitPaginationService } from 'src/services/organization/organizationalUnit.service';
import { ListParticipantsWithEvaluatorsService } from 'src/services/performance/configure-evaluations.service';

import { toast } from 'src/components/snackbar';
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

import { ParticipantsWithEvaluatorsTableRow } from '../participants-with-evaluators-table-row';
import { ParticipantsWithEvaluatorsTableToolbar } from '../participants-with-evaluators-table-toolbar';
import { ParticipantsWithEvaluatorsTableFiltersResult } from '../participants-with-evaluators-table-filters-result';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function ListParticipantsWithEvaluatorsView({ id }: Props) {
  const { t } = useTranslate('performance');
  const table = useTable();

  const [tableData, setTableData] = useState<IParticipantWithEvaluators[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedUnitName, setSelectedUnitName] = useState('');

  const filters = useSetState<IParticipantWithEvaluatorsTableFilters>({
    search: '',
    organizationalUnitId: '',
  });

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: filters.state,
  });

  const canReset = !!filters.state.search || !!filters.state.organizationalUnitId;

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  // Función para aplanar la estructura de árbol de unidades organizacionales
  const flattenUnits = useCallback((units: any[]): { id: string; name: string }[] => {
    const result: { id: string; name: string }[] = [];

    const processUnit = (unit: any) => {
      result.push({
        id: unit.id,
        name: unit.name,
      });
      if (unit.children && unit.children.length > 0) {
        unit.children.forEach(processUnit);
      }
    };

    units.forEach(processUnit);
    return result;
  }, []);

  // Obtener nombre de la unidad organizacional seleccionada
  const fetchUnitName = useCallback(async () => {
    if (!filters.state.organizationalUnitId) {
      setSelectedUnitName('');
      return;
    }

    try {
      const response = await GetOrganizationalUnitPaginationService({ page: 1, perPage: 100 });
      const units = flattenUnits(response.data || []);
      const unit = units.find((u) => u.id === filters.state.organizationalUnitId);
      setSelectedUnitName(unit?.name || '');
    } catch (error) {
      console.error('Error fetching unit name:', error);
    }
  }, [filters.state.organizationalUnitId, flattenUnits]);

  useEffect(() => {
    fetchUnitName();
  }, [fetchUnitName]);

  // Fetch data function
  const fetchData = useCallback(async () => {
    try {
      const params: any = {
        page: table.page + 1,
        perPage: table.rowsPerPage,
      };

      if (filters.state.search) {
        params.search = filters.state.search;
      }
      if (filters.state.organizationalUnitId) {
        params.organizationalUnitId = filters.state.organizationalUnitId;
      }

      const response = await ListParticipantsWithEvaluatorsService(id, params);
      const participantsData = response.data?.data || [];
      const meta = response.data?.meta;

      setTableData(participantsData);
      setTotalCount(meta?.itemCount || participantsData.length);
    } catch (error) {
      console.error('Error loading participants with evaluators:', error);
      toast.error(t('participants-with-evaluators.messages.error.loading'));
    }
  }, [id, table.page, table.rowsPerPage, filters.state.search, filters.state.organizationalUnitId, t]);

  // Initial fetch and when filters change
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table.page, table.rowsPerPage, filters.state.search, filters.state.organizationalUnitId]);

  const TABLE_HEAD: TableHeadCellProps[] = [
    { id: 'employeeName', label: t('participants-with-evaluators.table.columns.participantName') },
    { id: 'evaluators', label: t('participants-with-evaluators.table.columns.evaluators') },
    { id: 'evaluatorsCount', label: t('participants-with-evaluators.table.columns.evaluatorsCount'), align: 'center' },
  ];

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('participants-with-evaluators.title')}
        links={[
          {
            name: t('participants-with-evaluators.breadcrumbs.dashboard'),
            href: paths.dashboard.root,
          },
          {
            name: t('participants-with-evaluators.breadcrumbs.configureEvaluations'),
            href: paths.dashboard.performance.configureEvaluations,
          },
          {
            name: t('participants-with-evaluators.breadcrumbs.edit'),
            href: paths.dashboard.performance.configureEvaluationsEdit(id),
          },
          {
            name: t('participants-with-evaluators.breadcrumbs.participantsWithEvaluators'),
          },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <ParticipantsWithEvaluatorsTableToolbar filters={filters} onResetPage={table.onResetPage} />

        {canReset && (
          <ParticipantsWithEvaluatorsTableFiltersResult
            filters={filters}
            totalResults={totalCount}
            onResetPage={table.onResetPage}
            organizationalUnitName={selectedUnitName}
            sx={{ p: 2.5, pt: 0 }}
          />
        )}

        <Scrollbar>
          <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 720 }}>
            <TableHeadCustom
              order={table.order}
              orderBy={table.orderBy}
              headCells={TABLE_HEAD}
              rowCount={dataFiltered.length}
              onSort={table.onSort}
            />

            <TableBody>
              {dataFiltered.map((row) => (
                <ParticipantsWithEvaluatorsTableRow key={row.participantId} row={row} />
              ))}

              <TableEmptyRows
                height={table.dense ? 56 : 76}
                emptyRows={emptyRows(table.page, table.rowsPerPage, totalCount)}
              />

              <TableNoData notFound={notFound} sx={{ textAlign: 'center' }} />
            </TableBody>
          </Table>
        </Scrollbar>

        <TablePaginationCustom
          page={table.page}
          dense={table.dense}
          count={totalCount}
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
  inputData: IParticipantWithEvaluators[];
  filters: IParticipantWithEvaluatorsTableFilters;
  comparator: (a: any, b: any) => number;
};

function applyFilter({ inputData, comparator, filters }: ApplyFilterProps) {
  const { search } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (search) {
    inputData = inputData.filter(
      (participant) =>
        participant.employee?.fullName?.toLowerCase().indexOf(search.toLowerCase()) !== -1
    );
  }

  return inputData;
}
