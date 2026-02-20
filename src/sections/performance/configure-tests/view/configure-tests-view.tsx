'use client';

import type {
  IConfigureTest,
  IConfigureTestTableFilters,
} from 'src/types/performance';

import { useState, useEffect, useCallback } from 'react';
import { useBoolean, useSetState } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  DeleteConfigureTestsService,
  GetConfigureTestsPaginationService,
} from 'src/services/performance/configure-tests.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { TablePaginationCustom } from 'src/components/table';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ConfigureTestsCardView } from '../configure-tests-card-view';
import { ConfigureTestsTableToolbar } from '../configure-tests-table-toolbar';
import { ConfigureTestsTableFiltersResult } from '../configure-tests-table-filters-result';

// ----------------------------------------------------------------------

export function ConfigureTestsView() {
  const { t } = useTranslate('performance');
  const router = useRouter();
  const confirm = useBoolean();

  const [tableData, setTableData] = useState<IConfigureTest[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filters = useSetState<IConfigureTestTableFilters>({
    name: '',
    type: '',
  });

  const dataFiltered = applyFilter({
    inputData: tableData,
    filters: filters.state,
  });

  const canReset = !!filters.state.name || !!filters.state.type;

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

        const response = await GetConfigureTestsPaginationService(params);

        if (response?.data?.data) {
          setTableData(response.data.data);
          setTotalItems(response.data.meta?.itemCount || response.data.data.length);
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
  }, [page, rowsPerPage, filters.state.name, filters.state.type]);

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
        test.description.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }

  if (type) {
    inputData = inputData.filter((test) => test.type === type);
  }

  return inputData;
}
