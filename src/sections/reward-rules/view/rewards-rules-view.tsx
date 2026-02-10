'use client';

import type { TableHeadCellProps } from 'src/components/table';
import type { IRewardsRule, IRewardsRuleTableFilters } from 'src/types/rewards';

import { useSetState, useDebounce } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  DeleteRewardRuleService,
  GetRewardRulePaginationService,
} from 'src/services/rewards/rules.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  TableNoData,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { RewardRulesTableRow } from '../rewards-rules-table-row';
import { RewardRulesTableToolbar } from '../rewards-rules-table-toolbar';
import { RewardRulesTableFiltersResult } from '../rewards-rules-table-filters-results';

// ----------------------------------------------------------------------

export function RewardRulesView() {
  const { t } = useTranslate('rewards');
  const table = useTable();

  const [tableData, setTableData] = useState<IRewardsRule[]>([]);
  const [totalItems, setTotalItems] = useState(0);

  const TABLE_HEAD: TableHeadCellProps[] = useMemo(() => [
    { id: 'actions', label: '', width: 88 },
    { id: 'name', label: t('reward-rules.table.columns.name') },
    { id: 'description', label: t('reward-rules.table.columns.description') },
    { id: 'typeRule', label: t('reward-rules.table.columns.typeRule'), width: 150 },
    { id: 'points', label: t('reward-rules.table.columns.points'), width: 120 },
    { id: 'status', label: t('reward-rules.table.columns.status'), width: 120 },
  ], [t]);

  const filters = useSetState<IRewardsRuleTableFilters>({
    name: '',
    typeRuleId: '',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const debouncedSearch = useDebounce(currentFilters.name, 300);

  const loadData = useCallback(async () => {
    try {
      // Construir el parámetro order basado en table.orderBy y table.order
      let orderParam: string | undefined;
      
      if (table.orderBy) {
        const direction = table.order === 'asc' ? 'asc' : 'desc';
        
        // Mapear los IDs de las columnas a los campos del backend
        const fieldMapping: { [key: string]: string } = {
          name: 'rule.name',
          typeRule: 'typeRule.name',
          points: 'rule.points',
        };
        
        const backendField = fieldMapping[table.orderBy];
        if (backendField) {
          orderParam = `${backendField}:${direction}`;
        }
      }

      const params = {
        page: table.page + 1,
        perPage: table.rowsPerPage,
        search: debouncedSearch,
        order: orderParam,
        typeRuleId: currentFilters.typeRuleId || undefined,
      };

      const response = await GetRewardRulePaginationService(params);
      if (response.data) {
        setTableData(response.data.data || []);
        setTotalItems(response.data.meta?.itemCount || 0);
      }
    } catch (error) {
      console.error('Error loading reward rules:', error);
      toast.error(t('reward-rules.messages.error.loading'));
      setTableData([]);
      setTotalItems(0);
    }
  }, [table.page, table.rowsPerPage, table.order, table.orderBy, debouncedSearch, currentFilters.typeRuleId, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const dataFiltered = tableData;

  const canReset = !!currentFilters.name || !!currentFilters.typeRuleId;
  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleSort = useCallback(
    (id: string) => {
      // Solo permitir ordenamiento para las columnas mapeadas
      const sortableColumns = ['name', 'typeRule', 'points'];
      if (sortableColumns.includes(id)) {
        table.onSort(id);
      }
    },
    [table]
  );

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        const response = await DeleteRewardRuleService(id);

        if (response.data?.statusCode === 200 || response.status === 200) {
          toast.success(t('reward-rules.messages.success.deleted'));
          loadData();
        }
      } catch (error) {
        console.error('Error deleting reward rule:', error);
        toast.error(t('reward-rules.messages.error.deleting'));
      }
    },
    [loadData, t]
  );

  const handleResetFilters = useCallback(() => {
    table.onResetPage();
    updateFilters({
      name: '',
      typeRuleId: '',
    });
  }, [updateFilters, table]);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('reward-rules.title')}
        links={[
          { name: t('reward-rules.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('reward-rules.breadcrumbs.reward-rules'), href: paths.dashboard.rewards.rewardsRules },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.rewards.rewardsRulesCreate}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            {t('reward-rules.actions.add')}
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <RewardRulesTableToolbar
          filters={currentFilters}
          onFilters={(name, value) => {
            table.onResetPage();
            updateFilters({ [name]: value });
          }}
          onResetFilters={handleResetFilters}
        />

        {canReset && (
          <RewardRulesTableFiltersResult
            filters={currentFilters}
            totalResults={totalItems}
            onFilters={(name, value) => {
              updateFilters({ [name]: value });
            }}
            onReset={handleResetFilters}
            sx={{ p: 2.5, pt: 0 }}
          />
        )}

        <Box sx={{ position: 'relative' }}>
          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
              <TableHeadCustom
                order={table.order}
                orderBy={table.orderBy}
                headCells={TABLE_HEAD}
                onSort={handleSort}
              />

              <TableBody>
                {dataFiltered.map((row) => (
                  <RewardRulesTableRow
                    key={row.id}
                    row={row}
                    onDeleteRow={() => handleDeleteRow(row.id)}
                    editHref={`${paths.dashboard.rewards.rewardsRulesEdit(row.id)}`}
                  />
                ))}

                <TableNoData notFound={notFound} />
              </TableBody>
            </Table>
          </Scrollbar>
        </Box>

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
