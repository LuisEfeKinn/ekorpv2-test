'use client';

import type { TableHeadCellProps } from 'src/components/table';
import type { IAiModelSetting, IAiModelSettingTableFilters } from 'src/types/ai-model-settings';

import { useMemo, useState, useEffect, useCallback } from 'react';
import {
  useBoolean,
  useSetState,
  useDebounce,
} from 'minimal-shared/hooks';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import { TableRow, TableCell, TableContainer } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  DeleteAIModelSettingService,
  GetAIModelsSettingsPaginationService,
} from 'src/services/ai/AiModelsSettings.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, TableHeadCustom, TablePaginationCustom } from 'src/components/table';

import { AiModelSettingsTableRow } from '../ai-model-settings-table-row';
import { AiModelSettingsTableToolbar } from '../ai-model-settings-table-toolbar';

// ----------------------------------------------------------------------

type Props = {
  providerId: string;
  providerName?: string;
};

export function AiModelSettingsView({ providerId, providerName }: Props) {
  const { t } = useTranslate('ai');
  const router = useRouter();
  const table = useTable();
  const confirmDialog = useBoolean();

  const [tableData, setTableData] = useState<IAiModelSetting[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const TABLE_HEAD: TableHeadCellProps[] = useMemo(
    () => [
      { id: 'actions', label: '', width: 88 },
      { id: 'name', label: t('models.table.columns.name'), width: 200 },
      { id: 'description', label: t('models.table.columns.description'), width: 200 },
      { id: 'maxTokens', label: t('models.table.columns.maxTokens'), width: 120, align: 'center' },
      { id: 'contextWindow', label: t('models.table.columns.contextWindow'), width: 140, align: 'center' },
      { id: 'capabilities', label: t('models.table.columns.capabilities'), width: 180 },
      { id: 'isDefault', label: t('models.table.columns.default'), width: 100, align: 'center' },
    ],
    [t]
  );

  const filters = useSetState<IAiModelSettingTableFilters>({
    name: '',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const debouncedSearch = useDebounce(currentFilters.name, 300);

  const loadData = useCallback(async () => {
    try {
      const params: any = {
        page: table.page + 1,
        perPage: table.rowsPerPage,
        providerId,
        search: debouncedSearch || undefined,
      };

      const response = await GetAIModelsSettingsPaginationService(params);
      if (response.data) {
        setTableData(response.data.data || []);
        setTotalItems(response.data.meta?.itemCount || response.data.data?.length || 0);
      }
    } catch (error) {
      console.error('Error loading AI models:', error);
      toast.error(t('models.messages.error.loading'));
      setTableData([]);
      setTotalItems(0);
    }
  }, [table.page, table.rowsPerPage, providerId, debouncedSearch, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilters = useCallback(
    (name: string, value: any) => {
      updateFilters({ [name]: value });
      table.onResetPage();
    },
    [updateFilters, table]
  );

  const handleEditRow = useCallback(
    (id: string) => {
      router.push(paths.dashboard.ai.modelsSettings.edit(providerId, id));
    },
    [router, providerId]
  );

  const handleDeleteRow = useCallback((id: string) => {
    setSelectedId(id);
    confirmDialog.onTrue();
  }, [confirmDialog]);

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedId) return;

    try {
      const response = await DeleteAIModelSettingService(selectedId);
      if (response.data.statusCode === 200) {
        toast.success(t('models.messages.success.deleted'));
        loadData();
      }
    } catch (error) {
      console.error('Error deleting model:', error);
      toast.error(t('models.messages.error.deleting'));
    } finally {
      confirmDialog.onFalse();
      setSelectedId(null);
    }
  }, [selectedId, confirmDialog, t, loadData]);

  const notFound = !tableData.length;

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('models.title')}
          links={[
            { name: t('models.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('models.breadcrumbs.ai') },
            { name: t('models.breadcrumbs.providers'), href: paths.dashboard.ai.providerSettings.root },
            { name: providerName || t('models.breadcrumbs.provider'), href: paths.dashboard.ai.providerSettings.edit(providerId) },
            { name: t('models.title') },
          ]}
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.ai.modelsSettings.create(providerId)}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              {t('models.actions.add')}
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          <AiModelSettingsTableToolbar filters={currentFilters} onFilters={handleFilters} />

          <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
            <Scrollbar sx={{ minHeight: 444 }}>
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                <TableHeadCustom
                  order={table.order}
                  orderBy={table.orderBy}
                  headCells={TABLE_HEAD}
                  rowCount={tableData.length}
                  onSort={table.onSort}
                />

                <TableBody>
                  {tableData.map((row) => (
                    <AiModelSettingsTableRow
                      key={row.id}
                      row={row}
                      onEditRow={() => handleEditRow(row.id)}
                      onDeleteRow={() => handleDeleteRow(row.id)}
                    />
                  ))}

                  {notFound && (
                    <TableRow>
                      <TableCell colSpan={TABLE_HEAD.length + 1} align="center">
                        {t('models.table.noModels')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Scrollbar>
          </TableContainer>

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

      <ConfirmDialog
        open={confirmDialog.value}
        onClose={confirmDialog.onFalse}
        title={t('models.dialogs.delete.title')}
        content={t('models.dialogs.delete.content')}
        action={
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>
            {t('models.actions.delete')}
          </Button>
        }
      />
    </>
  );
}
