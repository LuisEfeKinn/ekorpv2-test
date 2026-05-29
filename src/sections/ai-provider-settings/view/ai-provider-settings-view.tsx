'use client';

import type { IAiProviderSetting, IAiProviderSettingTableFilters } from 'src/types/ai-provider-settings';

import { useBoolean } from 'minimal-shared/hooks';
import { useState, useEffect, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Pagination from '@mui/material/Pagination';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  DeleteAIProviderSettingService,
  GetAIProviderSettingsPaginationService,
} from 'src/services/ai/AiProviderSettings.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { AiProviderSettingsCard } from '../ai-provider-settings-card';
import { AiProviderSettingsTableToolbar } from '../ai-provider-settings-table-toolbar';
import { AiProviderSettingsTableFiltersResult } from '../ai-provider-settings-table-filters-result';

// ----------------------------------------------------------------------

const defaultFilters: IAiProviderSettingTableFilters = {
  name: '',
  status: 'all',
  order: 'ASC',
};

// ----------------------------------------------------------------------

export function AiProviderSettingsView() {
  const { t } = useTranslate('ai');

  const confirmDialog = useBoolean();

  const [providerSettings, setProviderSettings] = useState<IAiProviderSetting[]>([]);
  const [filters, setFilters] = useState<IAiProviderSettingTableFilters>(defaultFilters);
  const [, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(12);
  const [totalItems, setTotalItems] = useState(0);

  // Filter by status
  const STATUS_OPTIONS = [
    { value: 'all', label: t('settings.table.filters.all') },
    { value: 'active', label: t('settings.table.filters.active') },
    { value: 'inactive', label: t('settings.table.filters.inactive') },
  ];

  const canReset = filters.name !== '' || filters.order !== 'ASC';

  const dataFiltered = applyFilter({
    inputData: providerSettings,
    filters,
  });

  const totalPages = Math.ceil(totalItems / perPage);
  const notFound = !dataFiltered.length && canReset;

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        perPage,
        search: filters.name || undefined,
        order: filters.order,
      };

      const response = await GetAIProviderSettingsPaginationService(params);

      if (response.data.statusCode === 200) {
        setProviderSettings(response.data.data);
        setTotalItems(response.data.meta?.itemCount || response.data.data.length);
      }
    } catch (error) {
      console.error('Error loading AI provider settings:', error);
      toast.error(t('settings.messages.error.loading'));
      setProviderSettings([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, filters.name, filters.order, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle filter change
  const handleFilters = useCallback((name: string, value: string) => {
    setFilters((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  }, []);

  // Handle pagination
  const handlePageChange = useCallback((_: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  }, []);

  // Handle reset page
  const handleResetPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  // Handle status tab change
  const handleFilterStatus = useCallback(
    (_: React.SyntheticEvent, newValue: string) => {
      handleResetPage();
      setFilters((prevState) => ({
        ...prevState,
        status: newValue,
      }));
    },
    [handleResetPage]
  );

  // Handle delete
  const handleDelete = useCallback((id: string) => {
    setSelectedId(id);
    confirmDialog.onTrue();
  }, [confirmDialog]);

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedId) return;

    try {
      const response = await DeleteAIProviderSettingService(selectedId);
      if (response.data.statusCode === 200) {
        toast.success(t('settings.messages.success.deleted'));
        loadData();
      }
    } catch (error) {
      console.error('Error deleting provider setting:', error);
      toast.error(t('settings.messages.error.deleting'));
    } finally {
      confirmDialog.onFalse();
      setSelectedId(null);
    }
  }, [selectedId, confirmDialog, t, loadData]);

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('settings.title')}
          links={[
            { name: t('settings.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('settings.breadcrumbs.ai') },
            { name: t('settings.title') },
          ]}
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.ai.providerSettings.create}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              {t('settings.actions.add')}
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          <Tabs
            value={filters.status}
            onChange={handleFilterStatus}
            sx={{
              px: 2.5,
              boxShadow: (theme) => `inset 0 -2px 0 0 ${theme.vars.palette.divider}`,
            }}
          >
            {STATUS_OPTIONS.map((tab) => (
              <Tab
                key={tab.value}
                iconPosition="end"
                value={tab.value}
                label={tab.label}
              />
            ))}
          </Tabs>

          <AiProviderSettingsTableToolbar
            filters={filters}
            onResetPage={handleResetPage}
            onFilters={handleFilters}
          />

          {canReset && (
            <AiProviderSettingsTableFiltersResult
              filters={filters}
              totalResults={totalItems}
              onResetPage={handleResetPage}
              onFilters={handleFilters}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          <Box sx={{ position: 'relative', p: 3 }}>
            {notFound ? (
              <EmptyContent
                filled
                title={t('settings.empty.title')}
                description={t('settings.empty.description')}
                sx={{ py: 10 }}
              />
            ) : (
              <Grid container spacing={3}>
                {dataFiltered.map((setting) => (
                  <Grid key={setting.id} size={{ xs: 12, sm: 6, md: 4 }}>
                    <AiProviderSettingsCard
                      setting={setting}
                      onView={(id) => window.location.href = paths.dashboard.ai.providerSettings.edit(id)}
                      onEdit={(id) => window.location.href = paths.dashboard.ai.providerSettings.edit(id)}
                      onDelete={handleDelete}
                    />
                  </Grid>
                ))}
              </Grid>
            )}

            {totalPages > 1 && (
              <Stack alignItems="center" sx={{ mt: 4 }}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Stack>
            )}
          </Box>
        </Card>
      </DashboardContent>

      <ConfirmDialog
        open={confirmDialog.value}
        onClose={confirmDialog.onFalse}
        title={t('settings.dialogs.delete.title')}
        content={t('settings.dialogs.delete.content')}
        action={
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
          >
            {t('settings.actions.delete')}
          </Button>
        }
      />
    </>
  );
}

// ----------------------------------------------------------------------

type ApplyFilterProps = {
  inputData: IAiProviderSetting[];
  filters: IAiProviderSettingTableFilters;
};

function applyFilter({ inputData, filters }: ApplyFilterProps) {
  const { status } = filters;

  if (status !== 'all') {
    inputData = inputData.filter((item) => {
      if (status === 'active') return item.isActive;
      if (status === 'inactive') return !item.isActive;
      return true;
    });
  }

  return inputData;
}
