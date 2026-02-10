'use client';

import type { TableHeadCellProps } from 'src/components/table';
import type {
  ICourse,
  ICourseTableFilters,
  IIntegrationInstance,
  ICoursePaginationParams,
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
import {
  GetCoursesByCategoryLmsIdService,
  GetIntegrationsPaginationService,
} from 'src/services/settings/integrations.service';

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

import { CoursesTableRow } from '../courses-table-row';
import { CoursesTableToolbar } from '../courses-table-toolbar';
import { CoursesTableFiltersResult } from '../courses-table-filters-result';

// ----------------------------------------------------------------------

type Props = {
  instanceId: string;
  categoryLmsId: string;
};

export function IntegrationsCourseView({ instanceId, categoryLmsId }: Props) {
  const { t } = useTranslate('settings');
  const table = useTable();

  const [tableData, setTableData] = useState<ICourse[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [integrations, setIntegrations] = useState<IIntegrationInstance[]>([]);
  const [loadingIntegrations, setLoadingIntegrations] = useState(false);

  const TABLE_HEAD: TableHeadCellProps[] = useMemo(
    () => [
      { id: 'fullName', label: t('courses.table.columns.fullName') },
      { id: 'displayName', label: t('courses.table.columns.displayName'), width: 250 },
      { id: 'description', label: t('courses.table.columns.description'), width: 300 },
      { id: 'status', label: t('courses.table.columns.status'), width: 140 },
    ],
    [t]
  );

  const filters = useSetState<ICourseTableFilters>({
    search: '',
    includeInactive: false,
    integrationId: '',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const debouncedSearch = useDebounce(currentFilters.search, 300);

  // Cargar integraciones para el autocomplete
  const loadIntegrations = useCallback(async (searchValue: string = '') => {
    try {
      setLoadingIntegrations(true);
      const params = {
        page: 1,
        perPage: 20,
        search: searchValue,
      };

      const response = await GetIntegrationsPaginationService(params);

      if (response.data) {
        setIntegrations(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading integrations:', error);
    } finally {
      setLoadingIntegrations(false);
    }
  }, []);

  // Cargar integraciones al montar
  useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  // Función para cargar datos
  const loadData = useCallback(async () => {
    if (!instanceId || !categoryLmsId) return;

    try {
      setLoading(true);
      const params: ICoursePaginationParams = {
        page: table.page + 1,
        perPage: table.rowsPerPage,
        search: debouncedSearch,
        includeInactive: currentFilters.includeInactive,
        integrationId: currentFilters.integrationId,
      };

      const response = await GetCoursesByCategoryLmsIdService(
        instanceId as string,
        categoryLmsId as string,
        params
      );

      if (response.data) {
        setTableData(response.data.data || []);
        setTotalItems(response.data.meta?.itemCount || 0);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error(t('courses.messages.error.loading'));
      setTableData([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [
    instanceId,
    categoryLmsId,
    table.page,
    table.rowsPerPage,
    debouncedSearch,
    currentFilters.includeInactive,
    currentFilters.integrationId,
    t,
  ]);

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

  const canReset =
    !!currentFilters.search || currentFilters.includeInactive || !!currentFilters.integrationId;
  const notFound = !dataFiltered.length;

  const handleResetFilters = useCallback(() => {
    table.onResetPage();
    updateFilters({
      search: '',
      includeInactive: false,
      integrationId: '',
    });
  }, [updateFilters, table]);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('courses.title')}
        links={[
          { name: t('courses.breadcrumbs.dashboard'), href: paths.dashboard.root },
          {
            name: t('courses.breadcrumbs.integrations'),
            href: paths.dashboard.settings.integrations,
          },
          {
            name: t('courses.breadcrumbs.categories'),
            href: paths.dashboard.settings.categoryList(instanceId as string),
          },
          { name: t('courses.title') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <CoursesTableToolbar
          filters={currentFilters}
          onFilters={(name, value) => {
            updateFilters({ [name]: value });
          }}
          integrations={integrations}
          loadingIntegrations={loadingIntegrations}
          onSearchIntegrations={loadIntegrations}
        />

        {canReset && (
          <CoursesTableFiltersResult
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
                      <CoursesTableRow key={row.id} row={row} />
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
  inputData: ICourse[];
  filters: ICourseTableFilters;
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
        item.fullName.toLowerCase().includes(search.toLowerCase()) ||
        item.displayName.toLowerCase().includes(search.toLowerCase()) ||
        item.codeCourse.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (!includeInactive) {
    inputData = inputData.filter((item) => item.isActive);
  }

  return inputData;
}

