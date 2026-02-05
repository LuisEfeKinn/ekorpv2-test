'use client';

import type { TableHeadCellProps } from 'src/components/table';
import type { IEvaluationList, IEvaluationListTableFilters } from 'src/types/performance';

import { useState, useEffect, useCallback } from 'react';
import { usePopover, useSetState } from 'minimal-shared/hooks';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableBody from '@mui/material/TableBody';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import axios, { endpoints } from 'src/utils/axios';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetEvaluationListPaginationService } from 'src/services/performance/evaluations-list.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomPopover } from 'src/components/custom-popover';
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

import { EvaluationsListTableRow } from '../evaluations-list-table-row';
import { EvaluationsListTableToolbar } from '../evaluations-list-table-toolbar';
import { EvaluationsListTableFiltersResult } from '../evaluations-list-table-filters-result';

// ----------------------------------------------------------------------

export function EvaluationsListView() {
  const { t } = useTranslate('performance');
  const table = useTable();
  const router = useRouter();
  const exportPopover = usePopover();

  const [tableData, setTableData] = useState<IEvaluationList[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const filters = useSetState<IEvaluationListTableFilters>({
    name: '',
    vigencyId: '',
    organizationalUnitIds: [],
    orderDirection: '',
  });

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: filters.state,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const canReset =
    !!filters.state.name ||
    !!filters.state.vigencyId ||
    filters.state.organizationalUnitIds.length > 0 ||
    !!filters.state.orderDirection;

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleViewParticipants = useCallback(
    (id: string) => {
      router.push(paths.dashboard.performance.evaluationByParticipant(id));
    },
    [router]
  );

  const handleExport = useCallback(
    async (format: 0 | 1) => {
      setExporting(true);
      exportPopover.onClose();
      try {
        const params: any = {
          page: table.page + 1,
          perPage: table.rowsPerPage,
          exportFormat: format,
        };

        if (filters.state.name) {
          params.search = filters.state.name;
        }
        if (filters.state.vigencyId) {
          params.vigencyId = filters.state.vigencyId;
        }
        if (filters.state.organizationalUnitIds.length > 0) {
          params.organizationalUnitIds = filters.state.organizationalUnitIds.join(',');
        }
        if (filters.state.orderDirection) {
          params.orderDirection = filters.state.orderDirection;
        }

        // Llamada directa a axios con responseType: 'blob' para manejar archivos binarios
        const response = await axios.get(endpoints.performance.evaluationsList.all, {
          params,
          responseType: 'blob',
        });
        
        // Crear un blob con la respuesta
        const blob = new Blob([response.data], {
          type: format === 0 
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'application/pdf',
        });
        
        // Crear URL temporal y descargar
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `evaluaciones_${new Date().getTime()}.${format === 0 ? 'xlsx' : 'pdf'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.success(t('evaluations-list.messages.success.exported'));
      } catch (error) {
        console.error('Error exporting evaluations:', error);
        toast.error(t('evaluations-list.messages.error.exporting'));
      } finally {
        setExporting(false);
      }
    },
    [
      table.page,
      table.rowsPerPage,
      filters.state,
      exportPopover,
      t,
    ]
  );

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Solo incluir parámetros que tengan valores
        const params: any = {
          page: table.page + 1,
          perPage: table.rowsPerPage,
        };

        if (filters.state.name) {
          params.search = filters.state.name;
        }
        if (filters.state.vigencyId) {
          params.vigencyId = filters.state.vigencyId;
        }
        if (filters.state.organizationalUnitIds.length > 0) {
          params.organizationalUnitIds = filters.state.organizationalUnitIds.join(',');
        }
        if (filters.state.orderDirection) {
          params.orderDirection = filters.state.orderDirection;
        }

        const response = await GetEvaluationListPaginationService(params);

        // La respuesta puede venir como response.data.data o response.data
        const evaluationsData = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];

        setTableData(evaluationsData);

        // Establecer el total count desde meta si está disponible
        if (response.data?.meta?.itemCount) {
          setTotalCount(response.data.meta.itemCount);
        } else {
          setTotalCount(evaluationsData.length);
        }
      } catch (error) {
        console.error('Error loading evaluations:', error);
        toast.error(t('evaluations-list.messages.error.loading'));
        setTableData([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    table.page,
    table.rowsPerPage,
    filters.state.name,
    filters.state.vigencyId,
    filters.state.organizationalUnitIds,
    filters.state.orderDirection,
  ]);

  const TABLE_HEAD: TableHeadCellProps[] = [
    { id: '', label: '' },
    { id: 'name', label: t('evaluations-list.table.columns.name') },
    { id: 'vigencyName', label: t('evaluations-list.table.columns.vigency') },
    { id: 'status', label: t('evaluations-list.table.columns.status') },
    {
      id: 'organizationalUnits',
      label: t('evaluations-list.table.columns.organizationalUnits'),
    },
    {
      id: 'participants',
      label: t('evaluations-list.table.columns.participants'),
      align: 'center',
    },
  ];

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('evaluations-list.title')}
        links={[
          {
            name: t('evaluations-list.breadcrumbs.dashboard'),
            href: paths.dashboard.root,
          },
          {
            name: t('evaluations-list.breadcrumbs.evaluationsList'),
            href: paths.dashboard.performance.evaluationsList,
          },
        ]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:download-bold" />}
            onClick={exportPopover.onOpen}
            disabled={exporting || tableData.length === 0}
          >
            {exporting ? t('evaluations-list.actions.exporting') : t('evaluations-list.actions.export')}
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <EvaluationsListTableToolbar filters={filters} onResetPage={table.onResetPage} />

        {canReset && (
          <EvaluationsListTableFiltersResult
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
              onSort={table.onSort}
            />

            <TableBody>
              {dataInPage.map((row) => (
                <EvaluationsListTableRow
                  key={row.id}
                  row={row}
                  onViewParticipants={() => handleViewParticipants(row.id)}
                />
              ))}

              <TableEmptyRows
                height={table.dense ? 56 : 76}
                emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
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

      <CustomPopover
        open={exportPopover.open}
        anchorEl={exportPopover.anchorEl}
        onClose={exportPopover.onClose}
        slotProps={{ arrow: { placement: 'top-right' } }}
      >
        <MenuList>
          <MenuItem
            onClick={() => handleExport(0)}
            disabled={exporting}
          >
            <Iconify icon="solar:file-text-bold" />
            {t('evaluations-list.actions.exportExcel')}
          </MenuItem>

          <MenuItem
            onClick={() => handleExport(1)}
            disabled={exporting}
          >
            <Iconify icon="solar:file-text-bold" />
            {t('evaluations-list.actions.exportPdf')}
          </MenuItem>
        </MenuList>
      </CustomPopover>
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

type ApplyFilterProps = {
  inputData: IEvaluationList[];
  filters: IEvaluationListTableFilters;
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
      (evaluation) =>
        evaluation.name.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        evaluation.vigencyName.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }

  // Note: Vigency and organizational unit filtering is handled by the backend API
  // These filters are sent to the service but not applied client-side

  return inputData;
}
