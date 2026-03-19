'use client';

import type { TableHeadCellProps } from 'src/components/table';
import type { IVigency, IVigencyTableFilters } from 'src/types/organization';

import { useSetState, useDebounce } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  DeleteVigenciesService,
  GetVigenciesPaginationService
} from 'src/services/organization/vigencies.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  TableNoData,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { VigenciesTableRow } from '../vigencies-table-row';
import { VigenciesTableToolbar } from '../vigencies-table-toolbar';
import { VigenciesTableFiltersResult } from '../vigencies-table-filters-results';

// ----------------------------------------------------------------------

export function VigenciesView() {
  const { t } = useTranslate('organization');
  const table = useTable();

  const [tableData, setTableData] = useState<IVigency[]>([]);
  const [totalItems, setTotalItems] = useState(0);

  const TABLE_HEAD: TableHeadCellProps[] = useMemo(() => [
    { id: 'actions', label: '', width: 88 },
    { id: 'name', label: t('vigencies.table.columns.name'), sortField: 'vigency.name' },
    { id: 'startDate', label: t('vigencies.table.columns.startDate'), width: 150, sortField: 'vigency.startDate' },
    { id: 'endDate', label: t('vigencies.table.columns.endDate'), width: 150, sortField: 'vigency.endDate' },
    { id: 'periods', label: t('vigencies.table.columns.periods'), width: 200 },
    { id: 'status', label: t('vigencies.table.columns.status'), width: 120 },
  ], [t]);

  const filters = useSetState<IVigencyTableFilters>({
    name: '',
    isActive: '',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const [serverOrderBy, setServerOrderBy] = useState<string>('');
  const [serverOrder, setServerOrder] = useState<'asc' | 'desc'>('asc');

  const handleServerSort = useCallback((sortField: string, direction: 'asc' | 'desc') => {
    table.onResetPage();
    setServerOrderBy(sortField);
    setServerOrder(direction);
  }, [table]);

  const debouncedSearch = useDebounce(currentFilters.name, 300);

  const loadData = useCallback(async () => {
    try {
      const params = {
        page: table.page + 1,
        perPage: table.rowsPerPage,
        search: debouncedSearch,
        order: serverOrderBy ? `${serverOrderBy}:${serverOrder}` : undefined,
        isActive: currentFilters.isActive ? currentFilters.isActive === 'true' : undefined,
      };

      const response = await GetVigenciesPaginationService(params);
      if (response.data) {
        setTableData(response.data.data.data || []);
        setTotalItems(response.data.data.meta?.itemCount || 0);
      }
    } catch (error) {
      console.error('Error loading vigencies:', error);
      toast.error(t('vigencies.messages.error.loading'));
      setTableData([]);
      setTotalItems(0);
    }
  }, [table.page, table.rowsPerPage, debouncedSearch, currentFilters.isActive, serverOrderBy, serverOrder, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const dataFiltered = tableData;

  const canReset = !!currentFilters.name || !!currentFilters.isActive;
  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        const response = await DeleteVigenciesService(id);

        if (response.data?.statusCode === 200 || response.status === 200) {
          toast.success(t('vigencies.messages.success.deleted'));
          loadData();
        }
      } catch (error) {
        console.error('Error deleting vigency:', error);
        toast.error(t('vigencies.messages.error.deleting'));
      }
    },
    [loadData, t]
  );

  const handleResetFilters = useCallback(() => {
    table.onResetPage();
    updateFilters({
      name: '',
      isActive: '',
    });
  }, [updateFilters, table]);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('vigencies.title')}
        links={[
          { name: t('vigencies.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('vigencies.breadcrumbs.vigencies'), href: paths.dashboard.organizations.vigencies },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.organizations.vigenciesCreate}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            {t('vigencies.actions.add')}
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <VigenciesTableToolbar
          filters={currentFilters}
          onFilters={(name, value) => {
            table.onResetPage();
            updateFilters({ [name]: value });
          }}
          onResetFilters={handleResetFilters}
        />

        {canReset && (
          <VigenciesTableFiltersResult
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
          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
              <TableHeadCustom
                headCells={TABLE_HEAD}
                serverOrderBy={serverOrderBy}
                serverOrder={serverOrder}
                onServerSort={handleServerSort}
              />

              <TableBody>
                {dataFiltered.map((row) => (
                  <VigenciesTableRow
                    key={row.id}
                    row={row}
                    onDeleteRow={() => handleDeleteRow(row.id)}
                    editHref={`${paths.dashboard.organizations.vigenciesEdit(row.id)}`}
                  />
                ))}

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
  );
}
