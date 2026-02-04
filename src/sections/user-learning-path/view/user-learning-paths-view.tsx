'use client';

import type { ILearningPathAssignment, ILearningPathTableFilters } from 'src/types/learning';

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

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  DeleteLearningPathsService,
} from 'src/services/learning/learningPaths.service';
import {
  GetLearningPathsByUserManagementIdService
} from 'src/services/employees/user-managment.service';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, TablePaginationCustom } from 'src/components/table';

import { LearningPathCard } from '../user-learning-paths-card';
import { LearningPathTableToolbar } from '../user-learning-paths-table-toolbar';
import { LearningPathTableFiltersResult } from '../user-learning-paths-table-filters-result';

// ----------------------------------------------------------------------

export function UserLearningPathsView() {
  const { t } = useTranslate('learning');
  const table = useTable({ defaultRowsPerPage: 10 });
  const confirmDialog = useBoolean();
  const router = useRouter();

  const [learningPathAssignments, setLearningPathAssignments] = useState<ILearningPathAssignment[]>([]);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);

  const STATUS_OPTIONS = useMemo(() => [
    { value: 'all', label: t('learning-paths.table.filters.all') },
  ], [t]);

  const filters = useSetState<ILearningPathTableFilters>({
    name: '',
    status: 'all'
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  // Función para cargar datos
  const loadData = useCallback(async () => {
    try {
      const params = {
        page: table.page + 1, // API usa páginas basadas en 1, table.page basado en 0
        perPage: table.rowsPerPage,
        search: currentFilters.name || undefined,
      };

      const response = await GetLearningPathsByUserManagementIdService('11', params); // ID de ejemplo

      // Validación segura de la respuesta
      const data = response?.data?.data || [];
      const meta:any = response?.data?.meta || {};
      console.log('Loaded learning paths data:', data);

      setLearningPathAssignments(data);
      setTotalItems(meta?.itemCount || data.length || 0);

    } catch (error) {
      console.error('Error loading learning paths:', error);
      toast.error(t('learning-paths.messages.error.loading'));
      setLearningPathAssignments([]);
      setTotalItems(0);
    }
  }, [table.page, table.rowsPerPage, currentFilters.name, t]);

  // Cargar datos cuando cambian los parámetros
  useEffect(() => {
    loadData();
  }, [loadData]);

  const canReset = !!currentFilters.name || currentFilters.status !== 'all';
  const notFound = !learningPathAssignments.length;

  // const handleOpenDeleteDialog = useCallback((id: string) => {
  //   setItemToDelete(id);
  //   confirmDialog.onTrue();
  // }, [confirmDialog]);

  const handleConfirmDelete = useCallback(async () => {
    if (!itemToDelete) return;

    try {
      const response = await DeleteLearningPathsService(itemToDelete);

      if (response.data.statusCode === 200) {
        toast.success(t('learning-paths.messages.success.deleted'));
        loadData(); // Recargar datos
      }
    } catch (error) {
      console.error('Error deleting learning path:', error);
      toast.error(t('learning-paths.messages.error.deleting'));
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

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('learning-paths.user-title')}
          links={[
            { name: t('learning-paths.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('learning-paths.breadcrumbs.user-learningPaths') },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          <Tabs
            value={currentFilters.status}
            onChange={handleFilterStatus}
            sx={{
              px: 2.5,
              boxShadow: (theme) =>
                `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
            }}
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
                    {tab.value === 'all' && totalItems}
                  </Label>
                }
              />
            ))}
          </Tabs>

          <LearningPathTableToolbar
            filters={filters}
            onResetPage={table.onResetPage}
          />

          {canReset && (
            <LearningPathTableFiltersResult
              filters={filters}
              totalResults={totalItems}
              onResetPage={table.onResetPage}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          <Box sx={{ p: 3 }}>
            {notFound ? (
              <EmptyContent
                filled
                title={t('learning-paths.empty.title')}
                description={t('learning-paths.empty.description')}
                sx={{ py: 10 }}
              />
            ) : (
              <Grid container spacing={3}>
                {learningPathAssignments.map((assignment) => (
                  <Grid key={assignment.assignmentId} size={{ xs: 12, sm: 6, md: 4 }}>
                    <LearningPathCard
                      row={assignment.learningPath}
                      assignment={assignment}
                      onViewDetails={() => {
                        router.push(paths.dashboard.userLearning.myLearningPathsDetails(assignment.learningPath.id));
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

      <ConfirmDialog
        open={confirmDialog.value}
        onClose={confirmDialog.onFalse}
        title={t('learning-paths.dialogs.delete.title')}
        content={t('learning-paths.dialogs.delete.content')}
        action={
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>
            {t('learning-paths.dialogs.delete.confirm')}
          </Button>
        }
      />
    </>
  );
}
