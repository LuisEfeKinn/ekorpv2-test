'use client';

import type { ILearningObject, ILearningObjectTableFilters } from 'src/types/learning';

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
  DeleteLearningObjectsService,
  GetLearningObjectsPaginationService
} from 'src/services/learning/learningObjects.service';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, TablePaginationCustom } from 'src/components/table';

import { LearningObjectCard } from '../learning-objects-card';
import { LearningObjectTableToolbar } from '../learning-objects-table-toolbar';
import { LearningObjectTableFiltersResult } from '../learning-objects-table-filters-result';

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export function LearningObjectsView() {
  const { t } = useTranslate('learning');
  const table = useTable({ defaultRowsPerPage: 10 });
  const confirmDialog = useBoolean();
  const router = useRouter();

  const [learningObjects, setLearningObjects] = useState<ILearningObject[]>([]);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);

  const filters = useSetState<ILearningObjectTableFilters>({
    name: '',
    status: 'all',
    order: 'learningObject.name:asc'
  });
  const { state: currentFilters, setState: updateFilters } = filters;

    // Calcular contadores dinámicamente basados en los datos cargados
  const statusCounts = useMemo(() => {
    const active = learningObjects.filter(course => course.isActive === true).length;
    const inactive = learningObjects.filter(course => course.isActive === false).length;
    const all = learningObjects.length;

    return { all, active, inactive };
  }, [learningObjects]);

  const STATUS_OPTIONS = useMemo(() => [
    { value: 'all', label: t('learning-objects.table.filters.all'), count: statusCounts.all },
    { value: 'active', label: t('learning-objects.table.filters.active', { defaultValue: 'Activos' }), count: statusCounts.active },
    { value: 'inactive', label: t('learning-objects.table.filters.inactive', { defaultValue: 'Inactivos' }), count: statusCounts.inactive },
  ], [t, statusCounts]);

  // Función para cargar datos
  const loadData = useCallback(async () => {
    try {
      const params = {
        page: table.page + 1, // API usa páginas basadas en 1, table.page basado en 0
        perPage: table.rowsPerPage,
        search: currentFilters.name || undefined,
        isActive: currentFilters.status === 'active' ? true : currentFilters.status === 'inactive' ? false : undefined,
        order: currentFilters.order || 'learningObject.name:asc',
      };

      const response = await GetLearningObjectsPaginationService(params);

      // Validación segura de la respuesta
      const data = response?.data?.data || [];
      const meta = response?.data?.meta;

      setLearningObjects(data);
      setTotalItems(meta?.itemCount || 0);

    } catch (error) {
      console.error('Error loading learning objects:', error);
      toast.error(t('learning-objects.messages.error.loading'));
      setLearningObjects([]);
      setTotalItems(0);
    }
  }, [table.page, table.rowsPerPage, currentFilters.name, currentFilters.status, currentFilters.order, t]);

  // Cargar datos cuando cambian los parámetros
  useEffect(() => {
    loadData();
  }, [loadData]);

  const canReset = !!currentFilters.name || currentFilters.status !== 'all';
  const notFound = !learningObjects.length;

  const handleOpenDeleteDialog = useCallback((id: string) => {
    setItemToDelete(id);
    confirmDialog.onTrue();
  }, [confirmDialog]);

  const handleConfirmDelete = useCallback(async () => {
    if (!itemToDelete) return;

    try {
      const response = await DeleteLearningObjectsService(itemToDelete);

      if (response.data.statusCode === 200) {
        toast.success(t('learning-objects.messages.success.deleted'));
        loadData(); // Recargar datos
      }
    } catch (error) {
      console.error('Error deleting learning object:', error);
      toast.error(t('learning-objects.messages.error.deleting'));
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
    updateFilters({ name: '', status: 'all', order: 'learningObject.name:asc' });
  }, [updateFilters, table]);

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('learning-objects.title')}
          links={[
            { name: t('learning-objects.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('learning-objects.title') },
          ]}
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.learning.learningObjectsCreate}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              {t('learning-objects.actions.add')}
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

          <LearningObjectTableToolbar
            filters={currentFilters}
            onFilters={(name, value) => {
              table.onResetPage();
              updateFilters({ [name]: value });
            }}
            onResetFilters={handleResetFilters}
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
                {learningObjects.map((learningObject) => (
                  <Grid key={learningObject.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                    <LearningObjectCard
                      row={learningObject}
                      onView={() => {
                        router.push(paths.dashboard.learning.learningObjectsDetails(learningObject.id));
                      }}
                      onEdit={() => {
                        router.push(paths.dashboard.learning.learningObjectsEdit(learningObject.id));
                      }}
                      onDelete={() => handleOpenDeleteDialog(learningObject.id)}
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
        title={t('learning-objects.dialogs.delete.title')}
        content={t('learning-objects.dialogs.delete.content')}
        action={
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
          >
            {t('learning-objects.actions.delete')}
          </Button>
        }
      />
    </>
  );
}


