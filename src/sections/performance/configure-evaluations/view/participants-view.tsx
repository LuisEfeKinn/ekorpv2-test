'use client';

import type { TableHeadCellProps } from 'src/components/table';
import type {
  ICampaignParticipant,
  ICampaignParticipantTableFilters,
} from 'src/types/performance';

import { useState, useEffect, useCallback } from 'react';
import { useBoolean, useSetState } from 'minimal-shared/hooks';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  GetParticipantsByEvaluationCampaingsIdService,
  SyncParticipantsByEvaluationCampaingsIdService,
  AssignEvaluatorsSmartByEvaluationCampaingsIdService
} from 'src/services/performance/configure-evaluations.service';

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

import { ParticipantsTableRow } from '../participants-table-row';
import { ParticipantsTableToolbar } from '../participants-table-toolbar';
import { ParticipantsTableFiltersResult } from '../participants-table-filters-result';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function ParticipantsView({ id }: Props) {
  const { t } = useTranslate('performance');
  const table = useTable();
  const syncing = useBoolean();
  const assigning = useBoolean();

  const [tableData, setTableData] = useState<ICampaignParticipant[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const filters = useSetState<ICampaignParticipantTableFilters>({
    search: '',
    status: '',
  });

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: filters.state,
  });

  const canReset = !!filters.state.search || !!filters.state.status;

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

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
      if (filters.state.status) {
        params.status = filters.state.status;
      }

      const response = await GetParticipantsByEvaluationCampaingsIdService(id, params);
      const participantsData = response.data?.data || [];
      const meta = response.data?.meta;

      setTableData(participantsData);
      setTotalCount(meta?.itemCount || participantsData.length);
    } catch (error) {
      console.error('Error loading participants:', error);
      toast.error(t('campaign-participants.messages.error.loading'));
    }
  }, [id, table.page, table.rowsPerPage, filters.state.search, filters.state.status, t]);

  // Sync participants handler
  const handleSyncParticipants = useCallback(async () => {
    syncing.onTrue();
    try {
      const response = await SyncParticipantsByEvaluationCampaingsIdService(id);
      toast.success(t(response?.data?.message) || t('campaign-participants.messages.success.synced'));
      // Recargar datos después de sincronizar
      await fetchData();
    } catch (error) {
      console.error('Error syncing participants:', error);
      toast.error(t('campaign-participants.messages.error.syncing'));
    } finally {
      syncing.onFalse();
    }
  }, [id, fetchData, syncing, t]);

  // Assign evaluators handler
  const handleAssignEvaluators = useCallback(async () => {
    assigning.onTrue();
    try {
      const response = await AssignEvaluatorsSmartByEvaluationCampaingsIdService(id);
      toast.success(t(response?.data?.message) || t('campaign-participants.messages.success.assigned'));
      // Recargar datos después de sincronizar
      await fetchData();
    } catch (error: any) {
      console.error('Error assigning participants:', error);
      toast.error(t(error?.message) || t('campaign-participants.messages.error.assigning'));
    } finally {
      assigning.onFalse();
    }
  }, [id, fetchData, assigning, t]);

  // Initial fetch and when filters change
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table.page, table.rowsPerPage, filters.state.search, filters.state.status]);

  const TABLE_HEAD: TableHeadCellProps[] = [
    { id: '', label: '' },
    { id: 'employeeName', label: t('campaign-participants.table.columns.employeeName') },
    { id: 'status', label: t('campaign-participants.table.columns.status') },
    { id: 'createdAt', label: t('campaign-participants.table.columns.createdAt') },
  ];

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('campaign-participants.title')}
        links={[
          {
            name: t('campaign-participants.breadcrumbs.dashboard'),
            href: paths.dashboard.root,
          },
          {
            name: t('campaign-participants.breadcrumbs.configureEvaluations'),
            href: paths.dashboard.performance.configureEvaluations,
          },
          {
            name: t('campaign-participants.breadcrumbs.edit'),
            href: paths.dashboard.performance.configureEvaluationsEdit(id),
          },
          {
            name: t('campaign-participants.breadcrumbs.participants'),
          },
        ]}
        action={
          <>
            <Button
              variant="contained"
              startIcon={
                syncing.value ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <Iconify icon={"mdi:sync" as any} />
                )
              }
              onClick={handleSyncParticipants}
              disabled={syncing.value}
            >
              {syncing.value
                ? t('campaign-participants.actions.syncing')
                : t('campaign-participants.actions.syncParticipants')}
            </Button>
            <Button
              variant="contained"
              startIcon={
                assigning.value ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <Iconify icon={"mingcute:add-line" as any} />
                )
              }
              onClick={handleAssignEvaluators}
              disabled={assigning.value}
            >
              {assigning.value
                ? t('campaign-participants.actions.assigning')
                : t('campaign-participants.actions.assignEvaluators')}
            </Button>
          </>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <ParticipantsTableToolbar filters={filters} onResetPage={table.onResetPage} />

        {canReset && (
          <ParticipantsTableFiltersResult
            filters={filters}
            totalResults={totalCount}
            onResetPage={table.onResetPage}
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
                <ParticipantsTableRow key={row.id} row={row} campaignId={id} />
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
  inputData: ICampaignParticipant[];
  filters: ICampaignParticipantTableFilters;
  comparator: (a: any, b: any) => number;
};

function applyFilter({ inputData, comparator, filters }: ApplyFilterProps) {
  const { search, status } = filters;

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

  if (status) {
    inputData = inputData.filter((participant) => participant.status === status);
  }

  return inputData;
}