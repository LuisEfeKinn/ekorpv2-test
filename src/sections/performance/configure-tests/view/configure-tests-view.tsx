'use client';

import type { IconifyName } from 'src/components/iconify/register-icons';
import type {
  IConfigureTest,
  IConfigureTestTableFilters,
} from 'src/types/performance';

import { varAlpha } from 'minimal-shared/utils';
import { useState, useEffect, useCallback } from 'react';
import { useBoolean, useSetState } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  DeleteConfigureTestsService,
  DuplicateConfigureTestsService,
  GetConfigureTestsPaginationService,
} from 'src/services/performance/configure-tests.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { SvgColor } from 'src/components/svg-color';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { TablePaginationCustom } from 'src/components/table';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ConfigureTestsCardView } from '../configure-tests-card-view';
import { ConfigureTestsTableToolbar } from '../configure-tests-table-toolbar';
import { ConfigureTestsTableFiltersResult } from '../configure-tests-table-filters-result';

// ----------------------------------------------------------------------

type StatsCardProps = {
  title: string;
  value: number;
  icon: IconifyName;
  color: 'primary' | 'success' | 'warning' | 'info' | 'error';
};

// ----------------------------------------------------------------------

export function ConfigureTestsView() {
  const { t } = useTranslate('performance');
  const router = useRouter();
  const confirm = useBoolean();

  const [tableData, setTableData] = useState<IConfigureTest[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [, setLoading] = useState(false);
  const [summary, setSummary] = useState({ total: 0, totalActive: 0, totalInactive: 0, totalInUse: 0 });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filters = useSetState<IConfigureTestTableFilters>({
    name: '',
    type: '',
    isActive: '',
  });

  const dataFiltered = applyFilter({
    inputData: tableData,
    filters: filters.state,
  });

  const canReset = !!filters.state.name || !!filters.state.type || filters.state.isActive !== '';

  const handleDeleteRows = useCallback(async () => {
    if (!selectedId) return;
    
    try {
      await DeleteConfigureTestsService(selectedId);
      const deleteRows = tableData.filter((row) => row.id !== selectedId);
      toast.success(t('configure-tests.messages.success.deleted'));
      setTableData(deleteRows);
      setTotalItems((prev) => prev - 1);
      setSelectedId(null);
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error(t('configure-tests.messages.error.delete'));
    }
  }, [selectedId, tableData, t]);

  const handleEditRow = useCallback(
    (id: string) => {
      router.push(paths.dashboard.performance.configureTestsEdit(id));
    },
    [router]
  );

  const handleDuplicateRow = useCallback(
    async (id: string) => {
      try {
        await DuplicateConfigureTestsService(id);
        toast.success(t('configure-tests.messages.success.duplicated'));
        // Refetch current page
        const params: any = { page: page + 1, perPage: rowsPerPage };
        if (filters.state.name) params.search = filters.state.name;
        if (filters.state.type) params.type = filters.state.type;
        if (filters.state.isActive !== '') params.isActive = filters.state.isActive;
        const response = await GetConfigureTestsPaginationService(params);
        if (response?.data?.data) {
          setTableData(response.data.data);
          setTotalItems(response.data.meta?.itemCount || response.data.data.length);
        }
      } catch (error) {
        console.error('Error duplicating template:', error);
        toast.error(t('configure-tests.messages.error.duplicate'));
      }
    },
    [page, rowsPerPage, filters.state, t]
  );

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params: any = {
          page: page + 1,
          perPage: rowsPerPage,
        };

        if (filters.state.name) {
          params.search = filters.state.name;
        }
        if (filters.state.type) {
          params.type = filters.state.type;
        }
        if (filters.state.isActive !== '') {
          params.isActive = filters.state.isActive;
        }

        const response = await GetConfigureTestsPaginationService(params);

        if (response?.data?.data) {
          setTableData(response.data.data);
          setTotalItems(response.data.meta?.itemCount || response.data.data.length);
          if (response.data.summary) setSummary(response.data.summary);
        }
      } catch (error) {
        console.error('Error loading templates:', error);
        toast.error(t('configure-tests.messages.error.loading'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, filters.state.name, filters.state.type, filters.state.isActive]);

  const statsCards: StatsCardProps[] = [
    {
      title: t('configure-tests.stats.total'),
      value: summary.total,
      icon: 'solar:documents-bold-duotone',
      color: 'primary',
    },
    {
      title: t('configure-tests.stats.active'),
      value: summary.totalActive,
      icon: 'solar:check-circle-bold-duotone',
      color: 'success',
    },
    {
      title: t('configure-tests.stats.inactive'),
      value: summary.totalInactive,
      icon: 'solar:pause-circle-bold-duotone',
      color: 'warning',
    },
    {
      title: t('configure-tests.stats.inUse'),
      value: summary.totalInUse,
      icon: 'solar:chart-2-bold-duotone',
      color: 'info',
    },
  ];

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('configure-tests.title')}
          links={[
            {
              name: t('configure-tests.breadcrumbs.dashboard'),
              href: paths.dashboard.root,
            },
            {
              name: t('configure-tests.breadcrumbs.configureTests'),
              href: paths.dashboard.performance.configureTests,
            },
          ]}
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.performance.configureTestsCreate}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              {t('configure-tests.actions.create')}
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {statsCards.map((stat) => (
            <Grid key={stat.title} size={{ xs: 12, sm: 6, md: 3 }}>
              <StatsCard {...stat} />
            </Grid>
          ))}
        </Grid>

        <Card>
          <ConfigureTestsTableToolbar filters={filters} onResetPage={() => setPage(0)} />

          {canReset && (
            <ConfigureTestsTableFiltersResult
              filters={filters}
              totalResults={dataFiltered.length}
              onResetPage={() => setPage(0)}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          <Box sx={{ p: 3 }}>
            <ConfigureTestsCardView
              tests={dataFiltered}
              onEdit={handleEditRow}
              onDuplicate={handleDuplicateRow}
              onDelete={(id) => {
                setSelectedId(id);
                confirm.onTrue();
              }}
            />
          </Box>

          <TablePaginationCustom
            page={page}
            dense={false}
            count={totalItems}
            rowsPerPage={rowsPerPage}
            onPageChange={(_, newPage) => setPage(newPage)}
            onChangeDense={() => {}}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
          />
        </Card>
      </DashboardContent>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title={t('configure-tests.dialogs.delete.title')}
        content={t('configure-tests.dialogs.delete.content')}
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              handleDeleteRows();
              confirm.onFalse();
            }}
          >
            {t('configure-tests.actions.delete')}
          </Button>
        }
      />
    </>
  );
}

// ----------------------------------------------------------------------

type ApplyFilterProps = {
  inputData: IConfigureTest[];
  filters: IConfigureTestTableFilters;
};

function applyFilter({ inputData, filters }: ApplyFilterProps) {
  const { name, type } = filters;

  if (name) {
    inputData = inputData.filter(
      (test) =>
        test.name.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        (test.description ?? '').toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }

  if (type) {
    inputData = inputData.filter((test) => test.type === type);
  }

  return inputData;
}

// ----------------------------------------------------------------------

function StatsCard({ title, value, icon, color }: StatsCardProps) {
  const theme = useTheme();

  return (
    <Card
      sx={{
        p: 3,
        overflow: 'hidden',
        position: 'relative',
        color: `${color}.darker`,
        backgroundImage: `linear-gradient(135deg, ${varAlpha(theme.vars.palette[color].lighterChannel, 0)}, ${varAlpha(theme.vars.palette[color].lightChannel, 0.15)})`,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Iconify icon={icon} width={44} sx={{ flexShrink: 0, color: `${color}.main` }} />

        <Box>
          <Typography variant="h3" sx={{ lineHeight: 1, mb: 0.5, color: 'inherit' }}>
            {value}
          </Typography>
          <Typography variant="subtitle2" sx={{ opacity: 0.72 }}>
            {title}
          </Typography>
        </Box>
      </Box>

      <SvgColor
        src={`${CONFIG.assetsDir}/assets/background/shape-square.svg`}
        sx={{
          top: -8,
          right: -40,
          width: 180,
          height: 180,
          zIndex: -1,
          opacity: 0.18,
          position: 'absolute',
          color: `${color}.main`,
        }}
      />
    </Card>
  );
}
