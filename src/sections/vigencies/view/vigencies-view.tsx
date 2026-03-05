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
    { id: 'name', label: t('vigencies.table.columns.name') },
    { id: 'startDate', label: t('vigencies.table.columns.startDate'), width: 150 },
    { id: 'endDate', label: t('vigencies.table.columns.endDate'), width: 150 },
    { id: 'periods', label: t('vigencies.table.columns.periods'), width: 200 },
    { id: 'status', label: t('vigencies.table.columns.status'), width: 120 },
  ], [t]);

  const filters = useSetState<IVigencyTableFilters>({
    name: '',
    isActive: '',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const debouncedSearch = useDebounce(currentFilters.name, 300);

  const loadData = useCallback(async () => {
    try {
      // let orderParam: string | undefined;

      // if (table.orderBy) {
      //   const direction = table.order === 'asc' ? 'asc' : 'desc';
      //   const fieldMapping: { [key: string]: string } = {
      //     name: 'name',
      //     startDate: 'startDate',
      //     endDate: 'endDate',
      //   };

      //   const backendField = fieldMapping[table.orderBy];
      //   if (backendField) {
      //     orderParam = `${backendField}:${direction}`;
      //   }
      // }

      const params = {
        page: table.page + 1,
        perPage: table.rowsPerPage,
        search: debouncedSearch,
        // order: orderParam,
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
  }, [table.page, table.rowsPerPage, debouncedSearch, currentFilters.isActive, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const dataFiltered = tableData;

  const canReset = !!currentFilters.name || !!currentFilters.isActive;
  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleSort = useCallback(
    (id: string) => {
      const sortableColumns = ['name', 'startDate', 'endDate'];
      if (sortableColumns.includes(id)) {
        table.onSort(id);
      }
    },
    [table]
  );

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
                order={table.order}
                orderBy={table.orderBy}
                headCells={TABLE_HEAD}
                onSort={handleSort}
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
