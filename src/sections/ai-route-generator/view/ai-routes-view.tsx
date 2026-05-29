'use client';

// ----------------------------------------------------------------------
// AI Routes View - Main listing view
// ----------------------------------------------------------------------

import type { IAiRoute, IAiRouteTableFilters } from 'src/types/ai-route-generation';

import { varAlpha } from 'minimal-shared/utils';
import { useState, useEffect, useCallback } from 'react';
import { useBoolean, useSetState } from 'minimal-shared/hooks';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  DeleteAiRouteService,
  GetAiRoutesPaginationService,
} from 'src/services/ai/SaveOrUpdateAiRouteGeneration.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, TablePaginationCustom } from 'src/components/table';

import { AiRouteCard } from '../ai-route-card';

// ----------------------------------------------------------------------

export function AiRoutesView() {
  const { t } = useTranslate('ai');
  const router = useRouter();
  const table = useTable({ defaultRowsPerPage: 12 });
  const confirmDialog = useBoolean();

  const [routes, setRoutes] = useState<IAiRoute[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const filters = useSetState<IAiRouteTableFilters>({
    name: '',
    status: 'all',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const STATUS_OPTIONS = [
    { value: 'all', label: t('ai-route-generation.filters.all') },
    { value: 'draft', label: t('ai-route-generation.status.draft') },
    { value: 'completed', label: t('ai-route-generation.status.completed') },
    { value: 'published', label: t('ai-route-generation.status.published') },
    { value: 'archived', label: t('ai-route-generation.status.archived') },
  ];

  // Load data
  const loadData = useCallback(async () => {
    try {
      const params = {
        page: table.page + 1,
        perPage: table.rowsPerPage,
        search: currentFilters.name || undefined,
        status: currentFilters.status !== 'all' ? currentFilters.status : undefined,
      };

      const response = await GetAiRoutesPaginationService(params as any);

      setRoutes(response?.data?.data || []);
      setTotalItems(response?.data?.meta?.itemCount || 0);
    } catch (error) {
      console.error('Error loading AI routes:', error);
      toast.error(t('ai-route-generation.messages.error.loading'));
      setRoutes([]);
      setTotalItems(0);
    }
  }, [t, table.page, table.rowsPerPage, currentFilters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const notFound = !routes.length;

  const handleView = useCallback(
    (id: string) => {
      router.push(paths.dashboard.ai.routeGenerator.view(id));
    },
    [router]
  );

  const handleEdit = useCallback(
    (id: string) => {
      router.push(paths.dashboard.ai.routeGenerator.edit(id));
    },
    [router]
  );

  const handleOpenDeleteDialog = useCallback(
    (id: string) => {
      setItemToDelete(id);
      confirmDialog.onTrue();
    },
    [confirmDialog]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!itemToDelete) return;

    try {
      const response = await DeleteAiRouteService(itemToDelete);

      if (response.data.statusCode === 200) {
        toast.success(t('ai-route-generation.messages.success.deleted'));
        loadData();
      }
    } catch (error) {
      console.error('Error deleting route:', error);
      toast.error(t('ai-route-generation.messages.error.deleting'));
    } finally {
      confirmDialog.onFalse();
      setItemToDelete(null);
    }
  }, [t, itemToDelete, loadData, confirmDialog]);

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
          heading={t('ai-route-generation.title')}
          links={[
            { name: t('ai-route-generation.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('ai-route-generation.breadcrumbs.aiRoutes') },
          ]}
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.ai.routeGenerator.create}
              variant="contained"
              startIcon={<Iconify icon="solar:map-point-bold" />}
            >
              {t('ai-route-generation.actions.generateWithAi')}
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          {/* Status Tabs */}
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
              <Tab key={tab.value} value={tab.value} label={tab.label} />
            ))}
          </Tabs>

          {/* Search */}
          <TextField
            fullWidth
            value={currentFilters.name}
            onChange={(e) => {
              table.onResetPage();
              updateFilters({ name: e.target.value });
            }}
            placeholder={t('ai-route-generation.search.placeholder')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="solar:magnifer-zoom-in-bold" width={20} />
                </InputAdornment>
              ),
            }}
            sx={{ p: 2.5 }}
          />

          {/* Cards Grid */}
          {notFound ? (
            <EmptyContent title={t('ai-route-generation.noResults')} sx={{ py: 10 }} />
          ) : (
            <Grid container spacing={3} sx={{ p: 3 }}>
              {routes.map((route) => (
                <Grid key={route.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                  <AiRouteCard
                    row={route}
                    onView={() => handleView(route.id)}
                    onEdit={() => handleEdit(route.id)}
                    onDelete={() => handleOpenDeleteDialog(route.id)}
                  />
                </Grid>
              ))}
            </Grid>
          )}

          <TablePaginationCustom
            page={table.page}
            count={totalItems}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </Card>
      </DashboardContent>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDialog.value}
        onClose={confirmDialog.onFalse}
        title={t('ai-route-generation.dialogs.delete.title')}
        content={t('ai-route-generation.dialogs.delete.content')}
        action={
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>
            {t('ai-route-generation.actions.delete')}
          </Button>
        }
      />
    </>
  );
}
