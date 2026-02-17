'use client';

import type { IEvaluationResponse, IEvaluationResponseTableFilters } from 'src/types/performance';

import { useState, useEffect, useCallback } from 'react';
import { useSetState, useDebounce } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetEvaluationResponsesPaginationService } from 'src/services/performance/evaluation-responses.service';

import { toast } from 'src/components/snackbar';
import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, TablePaginationCustom } from 'src/components/table';

import { EvaluationResponsesCard } from '../evaluation-responses-card';
import { EvaluationResponsesTableToolbar } from '../evaluation-responses-table-toolbar';
import { EvaluationResponsesTableFiltersResult } from '../evaluation-responses-table-filters-results';

// ----------------------------------------------------------------------

export function EvaluationResponsesView() {
  const { t } = useTranslate('performance');
  const table = useTable();

  const [tableData, setTableData] = useState<IEvaluationResponse[]>([]);
  const [totalItems, setTotalItems] = useState(0);

  const filters = useSetState<IEvaluationResponseTableFilters>({
    search: '',
    status: '',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const debouncedSearch = useDebounce(currentFilters.search, 300);

  const loadData = useCallback(async () => {
    try {
      const params = {
        page: table.page + 1,
        perPage: table.rowsPerPage,
        search: debouncedSearch,
        status: currentFilters.status || undefined,
      };

      const response = await GetEvaluationResponsesPaginationService(params);
      if (response.data) {
        setTableData(response.data.data || []);
        setTotalItems(response.data.meta?.itemCount || 0);
      }
    } catch (error) {
      console.error('Error loading evaluation responses:', error);
      toast.error(t('evaluation-responses.messages.error.loading'));
      setTableData([]);
      setTotalItems(0);
    }
  }, [table.page, table.rowsPerPage, debouncedSearch, currentFilters.status, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const dataFiltered = tableData;

  const canReset = !!currentFilters.search || !!currentFilters.status;
  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleResetFilters = useCallback(() => {
    table.onResetPage();
    updateFilters({
      search: '',
      status: '',
    });
  }, [updateFilters, table]);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('evaluation-responses.title')}
        links={[
          { name: t('evaluation-responses.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('evaluation-responses.breadcrumbs.evaluationResponses') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <EvaluationResponsesTableToolbar
          filters={currentFilters}
          onFilters={(name, value) => {
            table.onResetPage();
            updateFilters({ [name]: value });
          }}
          onResetFilters={handleResetFilters}
        />

        {canReset && (
          <EvaluationResponsesTableFiltersResult
            filters={currentFilters}
            totalResults={totalItems}
            onFilters={(name, value) => {
              updateFilters({ [name]: value });
            }}
            onReset={handleResetFilters}
            sx={{ p: 2.5, pt: 0 }}
          />
        )}

        {notFound ? (
          <EmptyContent
            filled
            title={t('evaluation-responses.messages.noData')}
            sx={{ py: 10 }}
          />
        ) : (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {dataFiltered.map((row) => (
                <Grid key={row.assignmentId} size={{ xs: 12, sm: 6, md: 4 }}>
                  <EvaluationResponsesCard row={row} />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        <TablePaginationCustom
          page={table.page}
          dense={table.dense}
          count={totalItems}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onChangeDense={table.onChangeDense}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>
    </DashboardContent>
  );
}
