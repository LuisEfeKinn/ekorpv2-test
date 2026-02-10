'use client';

import type { ILearningObjectTableFilters } from 'src/types/learning';

import { varAlpha } from 'minimal-shared/utils';
import { useSetState } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetEmployeesEnrollmentPaginationService, GetLearningPathEmployeesPaginationService } from 'src/services/employees/employment-enroll.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, TablePaginationCustom } from 'src/components/table';

import { LearningObjectCard } from '../user-learning-objects-card';
import { LearningObjectTableToolbar } from '../user-learning-objects-table-toolbar';
import { LearningObjectTableFiltersResult } from '../user-learning-objects-table-filters-result';

// ----------------------------------------------------------------------

interface IEnrollment {
  enrollmentId: string;
  progress: string;
  isCompleted: boolean;
  enrolledAt: string;
  completedAt: string | null;
  certificateUrl: string | null;
  product: {
    id: string;
    name: string;
    imageUrl: string;
    duration: string;
    description: string;
    tags: string;
    bannerUrl: string;
    categoryName: string;
    difficultyLevelName: string;
  };
  courseLms: {
    id: string;
    lmsCourseId: string;
    fullName: string;
    displayName: string;
  };
  learningPath: {
    id: string;
    name: string;
  };
}

interface ILearningPath {
  id: string;
  name: string;
}

// ----------------------------------------------------------------------

export function UserLearningObjectsView() {
  const { t } = useTranslate('learning');
  const table = useTable({ defaultRowsPerPage: 10 });
  const router = useRouter();

  const [enrollments, setEnrollments] = useState<IEnrollment[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [learningPaths, setLearningPaths] = useState<ILearningPath[]>([]);

  const STATUS_OPTIONS = useMemo(() => [
    { value: 'in-progress', label: t('learning-objects.table.filters.inProgress'), icon: 'solar:notebook-bold-duotone' as const },
    { value: 'completed', label: t('learning-objects.table.filters.completed'), icon: 'solar:check-circle-bold' as const },
  ], [t]);

  const ORDER_OPTIONS = useMemo(() => [
    { value: 'productName:asc', label: t('learning-objects.table.order.productNameAsc') || 'Producto A-Z' },
    { value: 'productName:desc', label: t('learning-objects.table.order.productNameDesc') || 'Producto Z-A' },
    { value: 'learningPathName:asc', label: t('learning-objects.table.order.learningPathNameAsc') || 'Ruta de Aprendizaje A-Z' },
    { value: 'learningPathName:desc', label: t('learning-objects.table.order.learningPathNameDesc') || 'Ruta de Aprendizaje Z-A' },
    { value: 'progress:asc', label: t('learning-objects.table.order.progressAsc') || 'Progreso: Menor a Mayor' },
    { value: 'progress:desc', label: t('learning-objects.table.order.progressDesc') || 'Progreso: Mayor a Menor' },
    { value: 'enrolledAt:asc', label: t('learning-objects.table.order.enrolledAtAsc') || 'Fecha: Más antiguos' },
    { value: 'enrolledAt:desc', label: t('learning-objects.table.order.enrolledAtDesc') || 'Fecha: Más recientes' },
  ], [t]);

  const filters = useSetState<ILearningObjectTableFilters>({
    name: '',
    status: 'in-progress',
    order: 'productName:asc',
    learningPathId: null
  });
  const { state: currentFilters, setState: updateFilters } = filters;


  // Función para cargar learning paths (cargar todas las opciones)
  const loadLearningPaths = useCallback(async () => {
    try {
      const params = {
        page: 1,
        perPage: 20, // Cargar más opciones
      };

      const response = await GetLearningPathEmployeesPaginationService(params);
      const data = response?.data?.data || [];
      setLearningPaths(data);
    } catch (error) {
      console.error('Error loading learning paths:', error);
      setLearningPaths([]);
    }
  }, []);

  // Función para cargar datos
  const loadData = useCallback(async () => {
    try {
      const params: any = {
        page: table.page + 1,
        perPage: table.rowsPerPage,
        isCompleted: currentFilters.status === 'completed',
      };

      // Solo agregar parámetros opcionales si tienen valor
      if (currentFilters.name) {
        params.search = currentFilters.name;
      }

      if (currentFilters.order) {
        params.order = currentFilters.order;
      }

      if (currentFilters.learningPathId) {
        params.learningPathId = currentFilters.learningPathId;
      }

      const response = await GetEmployeesEnrollmentPaginationService(params);

      // Validación segura de la respuesta
      const data = response?.data?.data || [];
      const meta = response?.data?.meta;

      setEnrollments(data);
      setTotalItems(meta?.itemCount || 0);

    } catch (error) {
      console.error('Error loading enrollments:', error);
      toast.error(t('learning-objects.messages.error.loading'));
      setEnrollments([]);
      setTotalItems(0);
    }
  }, [table.page, table.rowsPerPage, currentFilters.name, currentFilters.status, currentFilters.order, currentFilters.learningPathId, t]);

  // Cargar datos cuando cambian los parámetros
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cargar learning paths al iniciar
  useEffect(() => {
    loadLearningPaths();
  }, [loadLearningPaths]);

  const canReset = !!currentFilters.name || !!currentFilters.learningPathId;
  const notFound = !enrollments.length;

  const handleFilterStatus = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      updateFilters({ status: newValue });
    },
    [updateFilters, table]
  );

  const handleResetFilters = useCallback(() => {
    table.onResetPage();
    updateFilters({ name: '', learningPathId: null });
  }, [updateFilters, table]);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('learning-objects.user-title')}
        links={[
          { name: t('learning-objects.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('learning-objects.user-title') },
        ]}
        action={
          <Button
            variant="contained"
            color="primary"
            startIcon={<Iconify icon="solar:download-bold" />}
            onClick={() => {
              toast.info(t('learning-objects.actions.downloadAllCertificates'));
            }}
          >
            {t('learning-objects.actions.downloadAllCertificates')}
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          sx={{
            px: { xs: 2, md: 3 },
            py: 2,
            borderBottom: (theme) => `solid 1px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.12)}`,
          }}
        >
          <Tabs
            value={currentFilters.status}
            onChange={handleFilterStatus}
            centered
            sx={{
              minHeight: 56,
              '& .MuiTabs-indicator': {
                height: 4,
              },
            }}
          >
            {STATUS_OPTIONS.map((tab) => (
              <Tab
                key={tab.value}
                iconPosition="start"
                value={tab.value}
                label={tab.label}
                icon={<Iconify icon={tab.icon} width={28} />}
                sx={{
                  minHeight: 56,
                  fontWeight: 700,
                  fontSize: '1rem',
                  px: 3,
                  '&.Mui-selected': {
                    color: 'primary.main',
                  },
                }}
              />
            ))}
          </Tabs>
        </Stack>

        <LearningObjectTableToolbar
          filters={currentFilters}
          onFilters={(name, value) => {
            table.onResetPage();
            updateFilters({ [name]: value });
          }}
          learningPaths={learningPaths}
          orderOptions={ORDER_OPTIONS}
        />

        {canReset && (
          <LearningObjectTableFiltersResult
            filters={currentFilters}
            totalResults={totalItems}
            onFilters={(name, value) => {
              updateFilters({ [name]: value });
            }}
            onReset={handleResetFilters}
            sx={{ p: 2.5, pt: 0 }}
            learningPaths={learningPaths}
          />
        )}

        {/* Grid de tarjetas */}
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {notFound ? (
            <EmptyContent
              filled
              title={t('learning-objects.empty.title')}
              description={t('learning-objects.empty.description')}
              sx={{ py: 10 }}
            />
          ) : (
            <Grid container spacing={3}>
              {enrollments.map((enrollment) => {
                // Convertir el progreso del string a número
                const progress = parseFloat(enrollment.progress) || 0;

                // Mapear la estructura de enrollment a la estructura esperada por LearningObjectCard
                const learningObjectData = {
                  id: enrollment.product.id,
                  name: enrollment.product.name,
                  imageUrl: enrollment.product.imageUrl,
                  duration: enrollment.product.duration,
                  description: enrollment.product.description,
                  tags: enrollment.product.tags,
                  bannerUrl: enrollment.product.bannerUrl,
                  categoryName: enrollment.product.categoryName,
                  difficultyLevelName: enrollment.product.difficultyLevelName,
                  isActive: true,
                };

                return (
                  <Grid key={enrollment.enrollmentId} size={{ xs: 12, sm: 6, md: 3 }}>
                    <LearningObjectCard
                      row={learningObjectData as any}
                      progress={progress}
                      isCertified={!!enrollment.certificateUrl}
                      onView={() => {
                        router.push(paths.dashboard.userLearning.myLearningDetails(enrollment.product.id));
                      }}
                    />
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>          <TablePaginationCustom
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


