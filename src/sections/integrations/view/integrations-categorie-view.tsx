'use client';

import type { TableHeadCellProps } from 'src/components/table';
import type {
  ICategory,
  ICategoryTableFilters,
  ICategoryPaginationParams,
} from 'src/types/settings';

import { useSetState, useDebounce } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetCategoriesByInstanceIdService } from 'src/services/settings/integrations.service';

import { toast } from 'src/components/snackbar';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  rowInPage,
  TableNoData,
  getComparator,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { CategoriesTableRow } from '../categories-table-row';
import { CategoriesTableToolbar } from '../categories-table-toolbar';
import { CategoriesTableFiltersResult } from '../categories-table-filters-result';

// ----------------------------------------------------------------------

type Props = {
  instanceId: string;
};

export function IntegrationsCategorieView({ instanceId }: Props) {
  const { t } = useTranslate('settings');
  const table = useTable();

  const [tableData, setTableData] = useState<ICategory[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);

  const TABLE_HEAD: TableHeadCellProps[] = useMemo(
    () => [
      { id: '', width: 48 },
      { id: 'name', label: t('categories.table.columns.name') },
      { id: 'description', label: t('categories.table.columns.description'), width: 250 },
      { id: 'status', label: t('categories.table.columns.status'), width: 140 },
      { id: 'createdAt', label: t('categories.table.columns.createdAt'), width: 180 },
    ],
    [t]
  );

  const filters = useSetState<ICategoryTableFilters>({
    search: '',
    includeInactive: false,
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const debouncedSearch = useDebounce(currentFilters.search, 300);

  // Función para cargar datos
  const loadData = useCallback(async () => {
    if (!instanceId) return;

    try {
      setLoading(true);
      const params: ICategoryPaginationParams = {
        page: table.page + 1,
        perPage: table.rowsPerPage,
        search: debouncedSearch,
        includeInactive: currentFilters.includeInactive,
      };

      // const response = await GetCategoriesByInstanceIdService(instanceId as string);
      const response = await GetCategoriesByInstanceIdService(instanceId as string, params);

      if (response.data) {
        setTableData(response.data.data || []);
        setTotalItems(response.data.meta?.itemCount || 0);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error(t('categories.messages.error.loading'));
      setTableData([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [instanceId, table.page, table.rowsPerPage, debouncedSearch, currentFilters.includeInactive, t]);

  // Cargar datos cuando cambian los filtros
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Aplicar filtros y ordenamiento
  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: currentFilters,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const canReset = !!currentFilters.search || currentFilters.includeInactive;
  const notFound = !dataFiltered.length;

  const handleResetFilters = useCallback(() => {
    table.onResetPage();
    updateFilters({
      search: '',
      includeInactive: false,
    });
  }, [updateFilters, table]);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('categories.title')}
        links={[
          { name: t('categories.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('categories.breadcrumbs.integrations'), href: paths.dashboard.settings.integrations },
          { name: t('categories.title') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <CategoriesTableToolbar 
          filters={currentFilters} 
          onFilters={(name, value) => {
            updateFilters({ [name]: value });
          }} 
        />

        {canReset && (
          <CategoriesTableFiltersResult
            filters={currentFilters}
            onFilters={(name, value) => {
              updateFilters({ [name]: value });
            }}
            onReset={handleResetFilters}
            totalResults={dataFiltered.length}
            sx={{ p: 2.5, pt: 0 }}
          />
        )}

        <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
          <Scrollbar sx={{ minHeight: 444 }}>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 800 }}>
              <TableHeadCustom
                order={table.order}
                orderBy={table.orderBy}
                headCells={TABLE_HEAD}
                rowCount={dataFiltered.length}
                onSort={table.onSort}
              />

              <TableBody>
                {loading ? (
                  <TableNoData notFound={false} />
                ) : (
                  <>
                    {dataInPage.map((row) => (
                      <CategoriesTableRow key={row.id} row={row} instanceId={instanceId as string} />
                    ))}

                    <TableNoData 
                      notFound={notFound} 
                      sx={{
                        '& .MuiTableCell-root': {
                          borderBottom: 'none',
                        },
                      }}
                    />
                  </>
                )}
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

// ----------------------------------------------------------------------

type ApplyFilterProps = {
  inputData: ICategory[];
  filters: ICategoryTableFilters;
  comparator: (a: any, b: any) => number;
};

function applyFilter({ inputData, comparator, filters }: ApplyFilterProps) {
  const { search, includeInactive } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (search) {
    inputData = inputData.filter(
      (item) =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (!includeInactive) {
    inputData = inputData.filter((item) => item.isActive);
  }

  return inputData;
}
