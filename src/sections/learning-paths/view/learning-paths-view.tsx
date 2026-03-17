'use client';

import type { ILearningPath, ILearningPathTableFilters } from 'src/types/learning';

import { varAlpha } from 'minimal-shared/utils';
import { useBoolean, useSetState } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Menu from '@mui/material/Menu';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  DeleteLearningPathsService,
  GetLearningPathsPaginationService
} from 'src/services/learning/learningPaths.service';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, TablePaginationCustom } from 'src/components/table';

import { LearningPathCard } from '../learning-paths-card';
import { LearningPathTableToolbar } from '../learning-paths-table-toolbar';
import { LearningPathTableFiltersResult } from '../learning-paths-table-filters-result';

// ----------------------------------------------------------------------

export function LearningPathsView() {
  const { t } = useTranslate('learning');
  const table = useTable({ defaultRowsPerPage: 10 });
  const confirmDialog = useBoolean();
  const router = useRouter();

  const [learningPaths, setLearningPaths] = useState<ILearningPath[]>([]);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [aiMenuAnchorEl, setAiMenuAnchorEl] = useState<null | HTMLElement>(null);

  const isAiMenuOpen = Boolean(aiMenuAnchorEl);

  const STATUS_OPTIONS = useMemo(() => [
    { value: 'all', label: t('learning-paths.table.filters.all') },
  ], [t]);

  const filters = useSetState<ILearningPathTableFilters>({
    name: '',
    status: 'all',
    order: 'learningPath.name:asc',
    positionId: '',
    isAIGenerated: '',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  // Función para cargar datos
  const loadData = useCallback(async () => {
    try {
      const params = {
        page: table.page + 1, // API usa páginas basadas en 1, table.page basado en 0
        perPage: table.rowsPerPage,
        search: currentFilters.name || undefined,
        order: currentFilters.order || undefined,
        positionId: currentFilters.positionId || undefined,
        isAIGenerated: currentFilters.isAIGenerated || undefined,
      };

      const response = await GetLearningPathsPaginationService(params);

      // Validación segura de la respuesta
      const data = response?.data?.data || [];
      const meta = response?.data?.meta;

      setLearningPaths(data);
      setTotalItems(meta?.itemCount || 0);

    } catch (error) {
      console.error('Error loading learning paths:', error);
      toast.error(t('learning-paths.messages.error.loading'));
      setLearningPaths([]);
      setTotalItems(0);
    }
  }, [table.page, table.rowsPerPage, currentFilters.name, currentFilters.order, currentFilters.positionId, currentFilters.isAIGenerated, t]);

  // Cargar datos cuando cambian los parámetros
  useEffect(() => {
    loadData();
  }, [loadData]);

  const canReset =
    !!currentFilters.name ||
    currentFilters.status !== 'all' ||
    currentFilters.order !== 'learningPath.name:asc' ||
    !!currentFilters.positionId ||
    !!currentFilters.isAIGenerated;
  const notFound = !learningPaths.length;

  const handleResetFilters = useCallback(() => {
    table.onResetPage();
    updateFilters({
      order: 'learningPath.name:asc',
      positionId: '',
      isAIGenerated: '',
    });
  }, [table, updateFilters]);

  const handleOpenDeleteDialog = useCallback((id: string) => {
    setItemToDelete(id);
    confirmDialog.onTrue();
  }, [confirmDialog]);

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

  const handleOpenAiMenu = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAiMenuAnchorEl(event.currentTarget);
  }, []);

  const handleCloseAiMenu = useCallback(() => {
    setAiMenuAnchorEl(null);
  }, []);

  const handleNavigateAiOption = useCallback(
    (destination: string) => {
      handleCloseAiMenu();
      router.push(destination);
    },
    [handleCloseAiMenu, router]
  );

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('learning-paths.title')}
          links={[
            { name: t('learning-paths.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('learning-paths.breadcrumbs.learningPaths') },
          ]}
          action={
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                component={RouterLink}
                href={paths.dashboard.learning.learningPathsCreate}
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
              >
                {t('learning-paths.actions.add')}
              </Button>
              <Button
                variant="contained"
                color="warning"
                startIcon={<Iconify icon="solar:star-bold-duotone" />}
                endIcon={<Iconify icon="eva:chevron-down-fill" />}
                onClick={handleOpenAiMenu}
                sx={{ color: 'warning.contrastText' }}
              >
                {t('learning-paths.actions.addWithAI')}
              </Button>

              <Menu
                anchorEl={aiMenuAnchorEl}
                open={isAiMenuOpen}
                onClose={handleCloseAiMenu}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem
                  onClick={() => handleNavigateAiOption(paths.dashboard.learning.aiLearningPaths)}
                  sx={{ gap: 1 }}
                >
                  <Iconify icon="solar:star-bold" width={18} />
                  {t('learning-paths.actions.addWithAI')}
                </MenuItem>
                <MenuItem
                  onClick={() =>
                    handleNavigateAiOption(paths.dashboard.learning.allAiLearningPaths)
                  }
                  sx={{ gap: 1 }}
                >
                  <Iconify icon="solar:documents-bold-duotone" width={18} />
                  {t('learning-paths.actions.addAllWithAI')}
                </MenuItem>
              </Menu>
            </Box>

          }
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
            onResetFilters={handleResetFilters}
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
                {learningPaths.map((learningPath) => (
                  <Grid key={learningPath.id} size={{ xs: 12, sm: 6, md: 4 }}>
                    <LearningPathCard
                      row={learningPath}
                      onEdit={() => {
                        router.push(paths.dashboard.learning.learningPathsEdit(learningPath.id));
                      }}
                      onDelete={() => handleOpenDeleteDialog(learningPath.id)}
                      onViewDetails={() => {
                        router.push(paths.dashboard.learning.learningPathsDetails(learningPath.id));
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
