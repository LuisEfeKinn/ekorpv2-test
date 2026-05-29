'use client';

// ----------------------------------------------------------------------
// AI Programs View - Main listing view
// ----------------------------------------------------------------------

import type { IAiProgram, IAiProgramTableFilters } from 'src/types/ai-program-generation';

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
  DeleteAiProgramService,
  GetAiProgramsPaginationService,
} from 'src/services/ai/SaveOrUpdateAiProgram.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, TablePaginationCustom } from 'src/components/table';

import { AiProgramCard } from '../ai-program-card';

// ----------------------------------------------------------------------

export function AiProgramsView() {
  const { t } = useTranslate('ai');
  const router = useRouter();
  const table = useTable({ defaultRowsPerPage: 12 });
  const confirmDialog = useBoolean();

  const [programs, setPrograms] = useState<IAiProgram[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const filters = useSetState<IAiProgramTableFilters>({
    name: '',
    status: 'all',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const STATUS_OPTIONS = [
    { value: 'all', label: t('ai-program-generation.filters.all') },
    { value: 'active', label: t('ai-program-generation.status.active') },
    { value: 'inactive', label: t('ai-program-generation.status.inactive') },
  ];

  // Load data
  const loadData = useCallback(async () => {
    try {
      const params: any = {
        page: table.page + 1,
        perPage: table.rowsPerPage,
        search: currentFilters.name || undefined,
      };

      if (currentFilters.status === 'active') {
        params.isActive = true;
      } else if (currentFilters.status === 'inactive') {
        params.isActive = false;
      }

      const response = await GetAiProgramsPaginationService(params);

      setPrograms(response?.data?.data || []);
      setTotalItems(response?.data?.meta?.itemCount || 0);
    } catch (error) {
      console.error('Error loading AI programs:', error);
      toast.error(t('ai-program-generation.messages.error.loading'));
      setPrograms([]);
      setTotalItems(0);
    }
  }, [t, table.page, table.rowsPerPage, currentFilters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const notFound = !programs.length;

  const handleView = useCallback(
    (id: string) => {
      router.push(paths.dashboard.ai.programGenerator.view(id));
    },
    [router]
  );

  const handleEdit = useCallback(
    (id: string) => {
      router.push(paths.dashboard.ai.programGenerator.edit(id));
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
      const response = await DeleteAiProgramService(itemToDelete);

      if (response.data.statusCode === 200) {
        toast.success(t('ai-program-generation.messages.success.deleted'));
        loadData();
      }
    } catch (error) {
      console.error('Error deleting program:', error);
      toast.error(t('ai-program-generation.messages.error.deleting'));
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
          heading={t('ai-program-generation.title')}
          links={[
            { name: t('ai-program-generation.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('ai-program-generation.breadcrumbs.aiPrograms') },
          ]}
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.ai.programGenerator.create}
              variant="contained"
              startIcon={<Iconify icon="solar:book-bold" />}
            >
              {t('ai-program-generation.actions.generateWithAi')}
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
            placeholder={t('ai-program-generation.search.placeholder')}
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
            <EmptyContent title={t('ai-program-generation.noResults')} sx={{ py: 10 }} />
          ) : (
            <Grid container spacing={3} sx={{ p: 3 }}>
              {programs.map((program) => (
                <Grid key={program.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                  <AiProgramCard
                    row={program}
                    onView={() => handleView(program.id)}
                    onEdit={() => handleEdit(program.id)}
                    onDelete={() => handleOpenDeleteDialog(program.id)}
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
        title={t('ai-program-generation.dialogs.delete.title')}
        content={t('ai-program-generation.dialogs.delete.content')}
        action={
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>
            {t('ai-program-generation.actions.delete')}
          </Button>
        }
      />
    </>
  );
}
