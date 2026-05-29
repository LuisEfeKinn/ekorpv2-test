'use client';

import type { TableHeadCellProps } from 'src/components/table';
import type { IPeriod, IPeriodTableFilters } from 'src/types/organization';

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
  DeletePeriodsService,
  GetPeriodsByVigencyIdService
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

import { PeriodsTableRow } from '../periods-table-row';
import { PeriodsTableToolbar } from '../periods-table-toolbar';
import { PeriodsTableFiltersResult } from '../periods-table-filters-results';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function PeriodsView({ id }: Props) {
  const { t } = useTranslate('organization');
  const table = useTable();

  const [tableData, setTableData] = useState<IPeriod[]>([]);
  const [totalItems, setTotalItems] = useState(0);

  const TABLE_HEAD: TableHeadCellProps[] = useMemo(() => [
    { id: 'actions', label: '', width: 88 },
    { id: 'name', label: t('periods.table.columns.name') },
    { id: 'abbreviation', label: t('periods.table.columns.abbreviation'), width: 150 },
    { id: 'startDate', label: t('periods.table.columns.startDate'), width: 150 },
    { id: 'endDate', label: t('periods.table.columns.endDate'), width: 150 },
    { id: 'percentage', label: t('periods.table.columns.percentage'), width: 120 },
    { id: 'status', label: t('periods.table.columns.status'), width: 120 },
  ], [t]);

  const filters = useSetState<IPeriodTableFilters>({
    name: '',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const debouncedSearch = useDebounce(currentFilters.name, 300);

  const loadData = useCallback(async () => {
    try {
    //   let orderParam: string | undefined;

    //   if (table.orderBy) {
    //     const direction = table.order === 'asc' ? 'asc' : 'desc';
    //     const fieldMapping: { [key: string]: string } = {
    //       name: 'name',
    //       abbreviation: 'abbreviation',
    //       startDate: 'startDate',
    //       endDate: 'endDate',
    //       percentage: 'percentage',
    //     };

    //     const backendField = fieldMapping[table.orderBy];
    //     if (backendField) {
    //       orderParam = `${backendField}:${direction}`;
    //     }
    //   }

      const params = {
        page: table.page + 1,
        perPage: table.rowsPerPage,
        search: debouncedSearch,
        // order: orderParam,
      };

      const response = await GetPeriodsByVigencyIdService(id, params);
      console.log('Periods response:', response);
      
      // La respuesta tiene estructura: { statusCode, data: { data: [...], meta: {...} }, message }
      if (response?.data?.data?.data) {
        const periodsData = Array.isArray(response.data.data.data) 
          ? response.data.data.data 
          : [];
        setTableData(periodsData);
        setTotalItems(response.data.data.meta?.itemCount || periodsData.length || 0);
      } else {
        setTableData([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('Error loading periods:', error);
      toast.error(t('periods.messages.error.loading'));
      setTableData([]);
      setTotalItems(0);
    }
  }, [table.page, table.rowsPerPage, debouncedSearch, id, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const dataFiltered = Array.isArray(tableData) ? tableData : [];

  const canReset = !!currentFilters.name;
  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleSort = useCallback(
    (idt: string) => {
      const sortableColumns = ['name', 'abbreviation', 'startDate', 'endDate', 'percentage'];
      if (sortableColumns.includes(idt)) {
        table.onSort(idt);
      }
    },
    [table]
  );

  const handleDeleteRow = useCallback(
    async (idD: string) => {
      try {
        const response = await DeletePeriodsService(idD);

        if (response.data?.statusCode === 200 || response.status === 200) {
          toast.success(t('periods.messages.success.deleted'));
          loadData();
        }
      } catch (error) {
        console.error('Error deleting period:', error);
        toast.error(t('periods.messages.error.deleting'));
      }
    },
    [loadData, t]
  );

  const handleResetFilters = useCallback(() => {
    table.onResetPage();
    updateFilters({
      name: '',
    });
  }, [updateFilters, table]);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('periods.title')}
        links={[
          { name: t('periods.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('periods.breadcrumbs.vigencies'), href: paths.dashboard.organizations.vigencies },
          { name: t('vigencies.breadcrumbs.edit'), href: paths.dashboard.organizations.vigenciesEdit(id) },
          { name: t('periods.breadcrumbs.periods') },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.organizations.vigenciesPeriodsCreate(id)}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            {t('periods.actions.add')}
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <PeriodsTableToolbar
          filters={currentFilters}
          onFilters={(name, value) => {
            table.onResetPage();
            updateFilters({ [name]: value });
          }}
          onResetFilters={handleResetFilters}
        />

        {canReset && (
          <PeriodsTableFiltersResult
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
                order={table.order}
                orderBy={table.orderBy}
                headCells={TABLE_HEAD}
                onSort={handleSort}
              />

              <TableBody>
                {dataFiltered.map((row) => (
                  <PeriodsTableRow
                    key={row.id}
                    row={row}
                    onDeleteRow={() => handleDeleteRow(row.id)}
                    editHref={paths.dashboard.organizations.vigenciesPeriodsEdit(id, row.id)}
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
