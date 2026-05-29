'use client';

import type { TableHeadCellProps } from 'src/components/table';
import type { IWorker, ICatalogOption, IWorkerTableFilters } from 'src/types/project-management';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useBoolean, useSetState, useDebounce } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetWorkersPaginationService } from 'src/services/project-management/worker.service';

import { toast } from 'src/components/snackbar';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  TableNoData,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { WorkersTableRow } from '../workers-table-row';
import { WorkersEditDrawer } from '../workers-edit-drawer';
import { WorkersTableToolbar } from '../workers-table-toolbar';
import { WorkersTableFiltersResult } from '../workers-table-filters-result';

// ----------------------------------------------------------------------

export function WorkersView() {
  const { t } = useTranslate('project-management');
  const table = useTable();
  const editDrawer = useBoolean();

  const [tableData, setTableData] = useState<IWorker[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentRow, setCurrentRow] = useState<IWorker | null>(null);

  // Keep catalog names for filter chips
  const [filterNames, setFilterNames] = useState<{
    workerStatus?: string;
    experienceLevel?: string;
    employmentType?: string;
  }>({});

  const filters = useSetState<IWorkerTableFilters>({
    search: '',
    workerStatusId: '',
    experienceLevelId: '',
    employmentTypeId: '',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const TABLE_HEAD: TableHeadCellProps[] = useMemo(
    () => [
      { id: '', width: 60 },
      { id: 'fullName', label: t('workers.table.columns.name') },
      { id: 'positionName', label: t('workers.table.columns.position'), width: 180 },
      { id: 'experienceLevel', label: t('workers.table.columns.experience'), width: 200 },
      { id: 'technologies', label: t('workers.table.columns.technologies'), width: 200 },
      { id: 'workerStatus', label: t('workers.table.columns.status'), width: 130 },
      { id: 'employmentType', label: t('workers.table.columns.employmentType'), width: 180 },
    ],
    [t]
  );

  const debouncedSearch = useDebounce(currentFilters.search, 300);

  const canReset =
    !!currentFilters.search ||
    !!currentFilters.workerStatusId ||
    !!currentFilters.experienceLevelId ||
    !!currentFilters.employmentTypeId;

  const notFound = !tableData.length;

  const loadData = useCallback(async () => {
    try {
      const params: Record<string, unknown> = {
        page: table.page + 1,
        perPage: table.rowsPerPage,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (currentFilters.workerStatusId) params.workerStatusId = Number(currentFilters.workerStatusId);
      if (currentFilters.experienceLevelId) params.experienceLevelId = Number(currentFilters.experienceLevelId);
      if (currentFilters.employmentTypeId) params.employmentTypeId = Number(currentFilters.employmentTypeId);

      const response = await GetWorkersPaginationService(params as any);
      setTableData(response.data.data ?? []);
      setTotalItems(response.data.meta?.itemCount ?? 0);
    } catch {
      toast.error(t('workers.messages.errorLoading'));
      setTableData([]);
      setTotalItems(0);
    }
  }, [
    table.page,
    table.rowsPerPage,
    debouncedSearch,
    currentFilters.workerStatusId,
    currentFilters.experienceLevelId,
    currentFilters.employmentTypeId,
    t,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenEdit = useCallback(
    (row: IWorker) => {
      setCurrentRow(row);
      editDrawer.onTrue();
    },
    [editDrawer]
  );

  const handleFilterChange = useCallback(
    (name: string, value: string, option?: ICatalogOption) => {
      table.onResetPage();
      updateFilters({ [name]: value });
      if (option) {
        const nameMap: Record<string, string> = {
          workerStatusId: 'workerStatus',
          experienceLevelId: 'experienceLevel',
          employmentTypeId: 'employmentType',
        };
        const key = nameMap[name];
        if (key) setFilterNames((prev) => ({ ...prev, [key]: option.name }));
      } else if (!value) {
        const nameMap: Record<string, string> = {
          workerStatusId: 'workerStatus',
          experienceLevelId: 'experienceLevel',
          employmentTypeId: 'employmentType',
        };
        const key = nameMap[name];
        if (key) setFilterNames((prev) => ({ ...prev, [key]: undefined }));
      }
    },
    [table, updateFilters]
  );

  const handleResetFilters = useCallback(() => {
    table.onResetPage();
    updateFilters({ search: '', workerStatusId: '', experienceLevelId: '', employmentTypeId: '' });
    setFilterNames({});
  }, [updateFilters, table]);

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('workers.title')}
          links={[
            { name: t('workers.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('workers.breadcrumbs.projectManagement'), href: paths.dashboard.projectManagement.clients },
            { name: t('workers.breadcrumbs.workers') },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          <WorkersTableToolbar
            filters={currentFilters}
            onFilters={(name, value, option) => handleFilterChange(name, value, option)}
          />

          {canReset && (
            <WorkersTableFiltersResult
              filters={currentFilters}
              totalResults={totalItems}
              onFilters={(name, value) => handleFilterChange(name, value)}
              onReset={handleResetFilters}
              workerStatusName={filterNames.workerStatus}
              experienceLevelName={filterNames.experienceLevel}
              employmentTypeName={filterNames.employmentType}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          <Box sx={{ position: 'relative' }}>
            <Scrollbar>
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                <TableHeadCustom headCells={TABLE_HEAD} />

                <TableBody>
                  {tableData.map((row) => (
                    <WorkersTableRow
                      key={row.id}
                      row={row}
                      onEditRow={() => handleOpenEdit(row)}
                    />
                  ))}

                  <TableEmptyRows
                    height={table.dense ? 56 : 76}
                    emptyRows={emptyRows(0, table.rowsPerPage, tableData.length)}
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

      <WorkersEditDrawer
        open={editDrawer.value}
        currentRow={currentRow}
        onClose={editDrawer.onFalse}
        onSuccess={loadData}
      />
    </>
  );
}
