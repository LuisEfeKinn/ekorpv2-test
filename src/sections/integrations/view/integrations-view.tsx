'use client';

import type { IIntegrationInstance, IIntegrationTableFilters } from 'src/types/settings';

import { useState, useEffect, useCallback } from 'react';
import { useBoolean, useSetState, useDebounce } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  DeleteIntegrationsService,
  GetSyncCoursePlatformByIdService,
  GetIntegrationsPaginationService,
} from 'src/services/settings/integrations.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, TablePaginationCustom } from 'src/components/table';

import { IntegrationsPlatformCard } from '../integrations-platform-card';

// ----------------------------------------------------------------------

type ViewMode = 'grid' | 'list';

// ----------------------------------------------------------------------

export function IntegrationsView() {
  const { t } = useTranslate('settings');
  const router = useRouter();
  const table = useTable();
  const deleteConfirm = useBoolean();

  const STATUS_OPTIONS = [
    { value: 'all', label: t('integrations.filters.all') },
    { value: 'active', label: t('integrations.filters.active') },
    { value: 'inactive', label: t('integrations.filters.inactive') },
  ];

  const [tableData, setTableData] = useState<IIntegrationInstance[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const filters = useSetState<IIntegrationTableFilters>({
    search: '',
    status: 'all',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const debouncedSearch = useDebounce(currentFilters.search, 300);

  // Función para cargar datos
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: table.page + 1,
        perPage: table.rowsPerPage,
        search: debouncedSearch,
      };

      const response = await GetIntegrationsPaginationService(params);

      if (response.data) {
        setTableData(response.data.data || []);
        setTotalItems(response.data.meta?.itemCount || 0);
      }
    } catch (error) {
      console.error('Error loading integrations:', error);
      toast.error(t('integrations.messages.error.loading'));
      setTableData([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [table.page, table.rowsPerPage, debouncedSearch, t]);

  // Cargar datos cuando cambian los filtros
  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSyncRow = useCallback(
    async (id: string) => {
      try {
        await GetSyncCoursePlatformByIdService(id);
        toast.success(t('courseListing.messages.success.synced'));
        loadData(); // Recargar datos
      } catch (error) {
        console.error('Error syncing course Listing:', error);
        toast.error(t('courseListing.messages.error.syncing'));
      }
    },
    [loadData, t]
  );

  const dataFiltered = applyFilter({
    inputData: Array.isArray(tableData) ? tableData : [],
    filters: currentFilters,
  });

  const canReset = !!currentFilters.search || currentFilters.status !== 'all';
  const notFound = !dataFiltered.length;

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        const response = await DeleteIntegrationsService(id);

        if (response.status === 200) {
          toast.success(t('integrations.messages.success.deleted'));
          loadData(); // Recargar datos
        }
      } catch (error) {
        console.error('Error deleting integration:', error);
        toast.error(t('integrations.messages.error.deleting'));
      }
    },
    [loadData, t]
  );

  const handleViewCourses = useCallback(
    (id: string) => {
      router.push(paths.dashboard.settings.categoryList(id));
    },
    [router]
  );

  const handleEdit = useCallback(
    (id: string) => {
      router.push(paths.dashboard.settings.integrationsEdit(id));
    },
    [router]
  );

  const handleDeleteConfirm = useCallback(
    (id: string) => {
      setSelectedId(id);
      deleteConfirm.onTrue();
    },
    [deleteConfirm]
  );

  const handleResetFilters = useCallback(() => {
    table.onResetPage();
    updateFilters({
      search: '',
      status: 'all',
    });
  }, [updateFilters, table]);

  const renderFilters = (
    <Card sx={{ p: 3, mb: 3 }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            fullWidth
            value={currentFilters.search}
            onChange={(e) => {
              table.onResetPage();
              updateFilters({ search: e.target.value });
            }}
            placeholder={t('integrations.filters.searchPlaceholder')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1 }}
          />

          <TextField
            select
            value={currentFilters.status}
            onChange={(e) => {
              table.onResetPage();
              updateFilters({ status: e.target.value });
            }}
            sx={{ minWidth: 160 }}
          >
            {STATUS_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <ToggleButtonGroup
            exclusive
            value={viewMode}
            onChange={(_, newMode) => {
              if (newMode) setViewMode(newMode);
            }}
            size="small"
          >
            <ToggleButton value="grid">
              <Iconify icon="solar:gallery-add-bold" />
            </ToggleButton>
            <ToggleButton value="list">
              <Iconify icon="solar:list-bold" />
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            <strong>{totalItems}</strong>{' '}
            {t('integrations.results.count', {
              defaultValue: totalItems === 1 ? 'integración encontrada' : 'integraciones encontradas',
              count: totalItems
            })}
          </Typography>

          {canReset && (
            <Button
              color="error"
              onClick={handleResetFilters}
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
            >
              {t('integrations.actions.clearFilters')}
            </Button>
          )}
        </Stack>
      </Stack>
    </Card>
  );

  const renderGrid = (
    <Box
      gap={3}
      display="grid"
      gridTemplateColumns={{
        xs: 'repeat(1, 1fr)',
        sm: 'repeat(2, 1fr)',
        md: 'repeat(4, 1fr)',
      }}
    >
      {dataFiltered.map((integration) => (
        <IntegrationsPlatformCard
          key={integration.id}
          integration={integration}
          onView={handleViewCourses}
          onSync={handleSyncRow}
          onEdit={handleEdit}
          onDelete={handleDeleteConfirm}
        />
      ))}
    </Box>
  );

  const renderList = (
    <Stack spacing={2}>
      {dataFiltered.map((integration) => (
        <IntegrationsPlatformCard
          key={integration.id}
          integration={integration}
          onView={handleViewCourses}
          onSync={handleSyncRow}
          onEdit={handleEdit}
          onDelete={handleDeleteConfirm}
        />
      ))}
    </Stack>
  );

  const renderDeleteDialog = (
    <ConfirmDialog
      open={deleteConfirm.value}
      onClose={deleteConfirm.onFalse}
      title={t('integrations.dialogs.delete.title')}
      content={t('integrations.dialogs.delete.content')}
      action={
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            if (selectedId) {
              handleDeleteRow(selectedId);
            }
            deleteConfirm.onFalse();
          }}
        >
          {t('integrations.actions.delete')}
        </Button>
      }
    />
  );

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('integrations.title')}
          links={[
            { name: t('integrations.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('integrations.title') },
          ]}
          action={
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={() => router.push(paths.dashboard.settings.integrationsCreate)}
            >
              {t('integrations.actions.add')}
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        {renderFilters}

        {loading ? (
          <Box sx={{ py: 10, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress color="inherit" size={80} />
          </Box>
        ) : notFound ? (
          <EmptyContent
            filled
            title={t('integrations.empty.title')}
            description={t('integrations.empty.description')}
            sx={{ py: 10 }}
          />
        ) : (
          <Box>
            {viewMode === 'grid' ? renderGrid : renderList}
            <TablePaginationCustom
              page={table.page}
              dense={table.dense}
              count={totalItems}
              rowsPerPage={table.rowsPerPage}
              onPageChange={table.onChangePage}
              onChangeDense={table.onChangeDense}
              onRowsPerPageChange={table.onChangeRowsPerPage}
              sx={{ mt: 3 }}
            />
          </Box>
        )}
      </DashboardContent>

      {renderDeleteDialog}
    </>
  );
}

// ----------------------------------------------------------------------

type ApplyFilterProps = {
  inputData: IIntegrationInstance[];
  filters: IIntegrationTableFilters;
};

function applyFilter({ inputData, filters }: ApplyFilterProps) {
  // Asegurar que inputData es un array válido
  if (!Array.isArray(inputData)) {
    console.warn('applyFilter: inputData is not an array, returning empty array');
    return [];
  }

  const { search, status } = filters;

  let filteredData = [...inputData];

  if (search) {
    filteredData = filteredData.filter(
      (integration) =>
        integration?.instanceName?.toLowerCase().includes(search.toLowerCase()) ||
        integration?.integration?.name?.toLowerCase().includes(search.toLowerCase()) ||
        integration?.integration?.integrationTypeName?.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (status !== 'all') {
    filteredData = filteredData.filter((integration) => {
      if (status === 'active') return integration.isActive;
      if (status === 'inactive') return !integration.isActive;
      return true;
    });
  }

  return filteredData;
}
