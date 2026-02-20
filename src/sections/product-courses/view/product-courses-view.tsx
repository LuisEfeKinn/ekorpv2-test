'use client';

import type { IProductCourse, IProductCourseTableFilters } from 'src/types/learning';

import { useSetState } from 'minimal-shared/hooks';
import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  GetLCoursesPaginationService
} from 'src/services/learning/courses.service';

import { toast } from 'src/components/snackbar';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  TableNoData,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { ProductCoursesTableRow } from '../product-courses-table-row';
import { ProductCoursesTableToolbar } from '../product-courses-table-toolbar';
import { ProductCoursesTableFiltersResult } from '../product-courses-table-filters-result';

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------
export function ProductCoursesView() {
  const { t } = useTranslate('learning');
  const table = useTable({ defaultRowsPerPage: 10 });

  const [productCourses, setProductCourses] = useState<IProductCourse[]>([]);
  const [totalItems, setTotalItems] = useState(0);

  const TABLE_HEAD = [
    { id: 'name', label: t('product-courses.table.columns.name'), width: 380 },
    { id: 'code', label: t('product-courses.table.columns.code'), width: 110 },
    { id: 'integration', label: t('product-courses.table.columns.integration'), width: 140 },
    { id: 'language', label: t('product-courses.table.columns.language'), width: 100 },
    { id: 'status', label: t('product-courses.table.columns.status'), width: 110 },
  ];

  const filters = useSetState<IProductCourseTableFilters>({
    search: '',
    includeInactive: false,
    order: 'course.displayName:asc',
    instanceId: null,
    instanceName: undefined,
  });
  const { state: currentFilters, setState: updateFilters } = filters;


  // Función para cargar datos
  const loadData = useCallback(async () => {
    try {
      const params = {
        page: table.page + 1, // API usa páginas basadas en 1, table.page basado en 0
        perPage: table.rowsPerPage,
        search: currentFilters.search || undefined,
        includeInactive: currentFilters.includeInactive,
        order: currentFilters.order || 'course.displayName:asc',
        instanceId: currentFilters.instanceId || undefined,
      };

      const response = await GetLCoursesPaginationService(params);

      // Validación segura de la respuesta - nuevo formato { data: [], meta: {} }
      const responseData = response?.data;
      const data = responseData?.data || [];
      const meta = responseData?.meta;

      setProductCourses(data);
      setTotalItems(meta?.itemCount || 0);

    } catch (error) {
      console.error('Error loading product courses:', error);
      toast.error(t('product-courses.messages.error.loading'));
      setProductCourses([]);
      setTotalItems(0);
    }
  }, [table.page, table.rowsPerPage, currentFilters.search, currentFilters.includeInactive, currentFilters.order, currentFilters.instanceId, t]);

  // Cargar datos cuando cambian los parámetros
  useEffect(() => {
    loadData();
  }, [loadData]);

  const canReset = !!currentFilters.search || currentFilters.includeInactive || currentFilters.order !== 'course.displayName:asc' || !!currentFilters.instanceId;
  const notFound = !productCourses.length;

  const handleResetFilters = useCallback(() => {
    table.onResetPage();
    updateFilters({ search: '', includeInactive: false, order: 'course.displayName:asc', instanceId: null, instanceName: undefined });
  }, [updateFilters, table]);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('product-courses.title')}
        links={[
          { name: t('product-courses.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('product-courses.title') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <ProductCoursesTableToolbar
          filters={currentFilters}
          onFilters={(name, value) => {
            table.onResetPage();
            updateFilters({ [name]: value });
          }}
        />

        {canReset && (
          <ProductCoursesTableFiltersResult
            filters={currentFilters}
            totalResults={totalItems}
            onFilters={(name, value) => {
              updateFilters({ [name]: value });
            }}
            onReset={handleResetFilters}
            sx={{ p: 2.5, pt: 0 }}
          />
        )}

        <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
          <Scrollbar>
            <Table size="medium" sx={{ minWidth: 960 }}>
              <TableHeadCustom headCells={TABLE_HEAD} />

              <TableBody>
                {productCourses.map((row) => (
                  <ProductCoursesTableRow
                    key={row.id}
                    row={row}
                    onViewRow={() => {}}
                  />
                ))}

                <TableNoData notFound={notFound} />
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>

        <TablePaginationCustom
          page={table.page}
          count={totalItems}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>
    </DashboardContent>
  );
}


