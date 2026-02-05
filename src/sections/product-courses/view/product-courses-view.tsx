'use client';

import type { IProductCourse, IProductCourseTableFilters } from 'src/types/learning';

import { useSetState } from 'minimal-shared/hooks';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  GetLCoursesPaginationService
} from 'src/services/learning/courses.service';

import { toast } from 'src/components/snackbar';
import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, TablePaginationCustom } from 'src/components/table';

import { ProductCoursesCard } from '../product-courses-card';
import { ProductCoursesTableToolbar } from '../product-courses-table-toolbar';
import { ProductCoursesTableFiltersResult } from '../product-courses-table-filters-result';

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------
export function ProductCoursesView() {
  const { t } = useTranslate('learning');
  const table = useTable({ defaultRowsPerPage: 10 });
  const router = useRouter();

  const [productCourses, setProductCourses] = useState<IProductCourse[]>([]);
  const [totalItems, setTotalItems] = useState(0);

  const filters = useSetState<IProductCourseTableFilters>({
    search: '',
    includeInactive: false,
    order: 'course.displayName:asc',
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
  }, [table.page, table.rowsPerPage, currentFilters.search, currentFilters.includeInactive, currentFilters.order, t]);

  // Cargar datos cuando cambian los parámetros
  useEffect(() => {
    loadData();
  }, [loadData]);

  const canReset = !!currentFilters.search || currentFilters.includeInactive || currentFilters.order !== 'course.displayName:asc';
  const notFound = !productCourses.length;

  const handleResetFilters = useCallback(() => {
    table.onResetPage();
    updateFilters({ search: '', includeInactive: false, order: 'course.displayName:asc' });
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

        {/* Grid de tarjetas */}
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {notFound ? (
            <EmptyContent
              filled
              title={t('product-courses.empty.title')}
              description={t('product-courses.empty.description')}
              sx={{ py: 10 }}
            />
          ) : (
            <Grid container spacing={3}>
              {productCourses.map((productCourse) => (
                <Grid key={productCourse.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                  <ProductCoursesCard
                    row={productCourse}
                    onView={() => {
                      router.push(paths.dashboard.learning.productCoursesDetails(productCourse.id));
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

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


