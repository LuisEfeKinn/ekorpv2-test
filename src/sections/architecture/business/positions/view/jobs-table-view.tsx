'use client';

import type { IJob } from 'src/types/architecture/jobs';
import type { TableHeadCellProps } from 'src/components/table';

import { varAlpha } from 'minimal-shared/utils';
import { useSetState } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { DeleteJobsService, GetJobsPaginationService } from 'src/services/architecture/business/jobs.service';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  TableNoData,
  TableSkeleton,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { JobsTableRow } from '../jobs-table-row';
import { JobsTableToolbar } from '../jobs-table-toolbar';

// ----------------------------------------------------------------------

export function JobsTableView() {
  const { t } = useTranslate('business');
  const table = useTable();

  const [tableData, setTableData] = useState<IJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  const STATUS_OPTIONS = useMemo(() => [
    { value: 'all', label: t('positions.table.all') },
  ], [t]);

  const TABLE_HEAD: TableHeadCellProps[] = useMemo(() => [
    { id: '', width: 88 },
    { id: 'code', label: t('positions.table.code') },
    { id: 'name', label: t('positions.table.name') },
    { id: 'jobType', label: t('positions.table.jobType') },
  ], [t]);

  const filters = useSetState<{ name: string; status: string }>({
    name: '',
    status: 'all',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await GetJobsPaginationService({
        page: table.page + 1,
        perPage: table.rowsPerPage,
      });

      const raw = response?.data;
      const list = (raw && typeof raw === 'object' && Array.isArray((raw as any).data))
        ? ((raw as any).data as IJob[])
        : [];
      const count = (raw && typeof raw === 'object')
        ? Number((raw as any)?.meta?.itemCount ?? list.length)
        : list.length;

      setTableData(list);
      setTotalItems(count);
    } catch (error) {
      const message =
        (typeof error === 'string' && error) ||
        (typeof error === 'object' && error && 'message' in error && (error as any).message) ||
        t('positions.table.messages.loadError');
      toast.error(String(message));
      setTableData([]);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  }, [t, table.page, table.rowsPerPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterStatus = useCallback(
    (_event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      updateFilters({ status: newValue });
    },
    [table, updateFilters]
  );

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        await DeleteJobsService(id);
        toast.success(t('positions.table.messages.deleteSuccess'));
        loadData();
      } catch (error) {
        const message =
          (typeof error === 'string' && error) ||
          (typeof error === 'object' && error && 'message' in error && (error as any).message) ||
          t('positions.table.messages.deleteError');
        toast.error(String(message));
      }
    },
    [loadData, t]
  );

  const handleEditRow = useCallback(() => {
    toast.info(t('positions.table.messages.editPending'));
  }, [t]);

  const dataFiltered = useMemo(() => {
    const name = currentFilters.name?.toLowerCase().trim();
    if (!name) return tableData;
    return tableData.filter((item) => item.name?.toLowerCase().includes(name));
  }, [currentFilters.name, tableData]);

  const notFound = !dataFiltered.length && !!currentFilters.name;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('positions.table.title')}
        links={[
          { name: t('positions.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('positions.breadcrumbs.architecture'), href: paths.dashboard.architecture.positionsTable },
          { name: t('positions.breadcrumbs.positions') },
        ]}
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

        <JobsTableToolbar
          filters={{ name: currentFilters.name }}
          onFilters={(name, value) => {
            table.onResetPage();
            updateFilters({ [name]: value });
          }}
        />

        <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
              <TableHeadCustom
                headCells={TABLE_HEAD}
                rowCount={dataFiltered.length}
                numSelected={table.selected.length}
              />

              <TableBody>
                {isLoading ? (
                  <TableSkeleton rowCount={8} cellCount={4} />
                ) : (
                  dataFiltered.map((row) => (
                    <JobsTableRow
                      key={row.id}
                      row={row}
                      selected={table.selected.includes(String(row.id))}
                      onSelectRow={() => table.onSelectRow(String(row.id))}
                      onDeleteRow={() => handleDeleteRow(String(row.id))}
                      onEditRow={() => handleEditRow()}
                    />
                  ))
                )}

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

