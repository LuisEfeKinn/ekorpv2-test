'use client';

import type { IProductCourse, IProductCourseTableFilters } from 'src/types/learning';

import { varAlpha } from 'minimal-shared/utils';
import { useBoolean, useSetState } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  DeleteCoursesService,
  GetLCoursesPaginationService
} from 'src/services/learning/courses.service';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
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
  const confirmDialog = useBoolean();
  const router = useRouter();

  const [productCourses, setProductCourses] = useState<IProductCourse[]>([]);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);

  const filters = useSetState<IProductCourseTableFilters>({
    name: '',
    status: 'all',
    categoryId: '',
    difficultyLevelId: '',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  // Calcular contadores dinámicamente basados en los datos cargados
  const statusCounts = useMemo(() => {
    const active = productCourses.filter(course => course.isActive === true).length;
    const inactive = productCourses.filter(course => course.isActive === false).length;
    const all = productCourses.length;

    return { all, active, inactive };
  }, [productCourses]);

  const STATUS_OPTIONS = useMemo(() => [
    { value: 'all', label: t('product-courses.table.filters.all'), count: statusCounts.all },
    { value: 'active', label: t('product-courses.table.filters.active', { defaultValue: 'Activos' }), count: statusCounts.active },
    { value: 'inactive', label: t('product-courses.table.filters.inactive', { defaultValue: 'Inactivos' }), count: statusCounts.inactive },
  ], [t, statusCounts]);


  // Función para cargar datos
  const loadData = useCallback(async () => {
    try {
      const params = {
        page: table.page + 1, // API usa páginas basadas en 1, table.page basado en 0
        perPage: table.rowsPerPage,
        search: currentFilters.name || undefined,
        isActive: currentFilters.status === 'active' ? true : currentFilters.status === 'inactive' ? false : undefined,
        categoryId: currentFilters.categoryId || undefined,
        difficultyLevelId: currentFilters.difficultyLevelId || undefined,
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
  }, [table.page, table.rowsPerPage, currentFilters.name, currentFilters.status, currentFilters.categoryId, currentFilters.difficultyLevelId, t]);

  // Cargar datos cuando cambian los parámetros
  useEffect(() => {
    loadData();
  }, [loadData]);

  const canReset = !!currentFilters.name || currentFilters.status !== 'all' || !!currentFilters.categoryId || !!currentFilters.difficultyLevelId;
  const notFound = !productCourses.length;

  const handleOpenDeleteDialog = useCallback((id: string) => {
    setItemToDelete(id);
    confirmDialog.onTrue();
  }, [confirmDialog]);

  const handleConfirmDelete = useCallback(async () => {
    if (!itemToDelete) return;

    try {
      const response = await DeleteCoursesService(itemToDelete);

      if (response.data.statusCode === 200) {
        toast.success(t('product-courses.messages.success.deleted'));
        loadData(); // Recargar datos
      }
    } catch (error) {
      console.error('Error deleting learning object:', error);
      toast.error(t('product-courses.messages.error.deleting'));
    } finally {
      confirmDialog.onFalse();
      setItemToDelete(null);
    }
  }, [itemToDelete, loadData, t, confirmDialog]);

  const handleFilterStatus = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      updateFilters({ status: newValue });
    },
    [updateFilters, table]
  );

  const handleResetFilters = useCallback(() => {
    table.onResetPage();
    updateFilters({ name: '', status: 'all', categoryId: '', difficultyLevelId: '' });
  }, [updateFilters, table]);

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('product-courses.title')}
          links={[
            { name: t('product-courses.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('product-courses.title') },
          ]}
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.learning.productCoursesCreate}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              {t('product-courses.actions.add')}
            </Button>
          }
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
                    {tab.count}
                  </Label>
                }
              />
            ))}
          </Tabs>

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
                      onEdit={() => {
                        router.push(paths.dashboard.learning.productCoursesEdit(productCourse.id));
                      }}
                      onDelete={() => handleOpenDeleteDialog(productCourse.id)}
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

      <ConfirmDialog
        open={confirmDialog.value}
        onClose={confirmDialog.onFalse}
        title={t('product-courses.dialogs.delete.title')}
        content={t('product-courses.dialogs.delete.content')}
        action={
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
          >
            {t('product-courses.actions.delete')}
          </Button>
        }
      />
    </>
  );
}


