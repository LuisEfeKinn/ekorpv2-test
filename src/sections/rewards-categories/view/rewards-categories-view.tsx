'use client';

import type { TableHeadCellProps } from 'src/components/table';
import type { IRewardsCategories, IRewardsCategoriesTableFilters } from 'src/types/rewards';

import { varAlpha } from 'minimal-shared/utils';
import { useBoolean, useSetState } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  DeleteRewardCategoryService,
  GetRewardCategoryPaginationService
} from 'src/services/rewards/rewardCategory.service';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import { RewardsCategoriesTableRow } from '../rewards-categories-table-row';
import { RewardCategoriesTableToolbar } from '../rewards-categories-table-toolbar';
import { RewardsCategoriesFiltersResult } from '../rewards-categories-table-filters-result';

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export function RewardsCategoriesView() {
  const { t } = useTranslate('rewards');
  const table = useTable();
  const confirmDialog = useBoolean();

  const [tableData, setTableData] = useState<IRewardsCategories[]>([]);
  const [totalItems, setTotalItems] = useState(0);

  const STATUS_OPTIONS = useMemo(() => [
    { value: 'all', label: t('rewards-categories.table.filters.all') },
  ], [t]);

  const TABLE_HEAD: TableHeadCellProps[] = useMemo(() => [
    { id: '', width: 88 },
    { id: 'name', label: t('rewards-categories.table.columns.name') },
    { id: 'abreviation', label: t('rewards-categories.table.columns.abreviation'), align: 'center' }
  ], [t]);

  const filters = useSetState<IRewardsCategoriesTableFilters>({
    name: '',
    abreviation: '',
    status: 'all'
  });
  const { state: currentFilters, setState: updateFilters } = filters;


  // Función para cargar datos
  const loadData = useCallback(async () => {
    try {
      // Construir el parámetro order basado en table.orderBy y table.order
      let orderParam: string | undefined;
      
      if (table.orderBy) {
        const direction = table.order === 'asc' ? 'asc' : 'desc';
        
        // Mapear los IDs de las columnas a los campos del backend
        const fieldMapping: { [key: string]: string } = {
          name: 'category.name',
          abreviation: 'category.abreviation',
        };
        
        const backendField = fieldMapping[table.orderBy];
        if (backendField) {
          orderParam = `${backendField}:${direction}`;
        }
      }

      const params = {
        page: table.page + 1,
        perPage: table.rowsPerPage,
        search: currentFilters.name,
        order: orderParam,
      };

      const response = await GetRewardCategoryPaginationService(params);

      if (response.status === 200) {
        // Verificar la estructura de la respuesta
        const data = response.data?.data || response.data || [];

        setTableData(Array.isArray(data) ? data : []);
        setTotalItems(data.length || 0);
      }
    } catch (error) {
      console.error('Error loading rewards categories:', error);
      toast.error(t('rewards-categories.messages.error.loading'));
      setTableData([]);
      setTotalItems(0);
    }
  }, [table.page, table.rowsPerPage, table.order, table.orderBy, currentFilters.name, t]);

  // Cargar datos cuando cambian los parámetros
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Aplicar filtros
  const dataFiltered = applyFilter({
    inputData: Array.isArray(tableData) ? tableData : [],
    comparator: getComparator(table.order, table.orderBy),
    filters: currentFilters,
  });

  const canReset = !!currentFilters.name || currentFilters.status !== 'all';
  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        const response = await DeleteRewardCategoryService(id);

        if (response.data.statusCode === 200) {
          toast.success(t('rewards-categories.messages.success.deleted'));
          loadData(); // Recargar datos
        }
      } catch (error) {
        console.error('Error deleting rewards categories:', error);
        toast.error(t('rewards-categories.messages.error.deleting'));
      }
    },
    [loadData, t]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      // Eliminar múltiples elementos
      const deletePromises = table.selected.map(id => DeleteRewardCategoryService(id));
      await Promise.all(deletePromises);

      toast.success(t('rewards-categories.messages.success.deletedMultiple'));
      table.setSelected([]);
      loadData(); // Recargar datos
    } catch (error) {
      console.error('Error deleting rewards categories:', error);
      toast.error(t('rewards-categories.messages.error.deletingMultiple'));
    }
  }, [table, loadData, t]);

  const handleFilterStatus = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      updateFilters({ status: newValue });
    },
    [updateFilters, table]
  );

  const handleResetFilters = useCallback(() => {
    table.onResetPage();
    updateFilters({ name: '', status: 'all' });
  }, [updateFilters, table]);

  const handleSort = useCallback(
    (id: string) => {
      // Solo permitir ordenamiento para las columnas mapeadas
      const sortableColumns = ['name', 'abreviation'];
      if (sortableColumns.includes(id)) {
        table.onSort(id);
      }
    },
    [table]
  );

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title={t('rewards-categories.dialogs.delete.title')}
      content={
        <>
          {t('rewards-categories.dialogs.delete.contentMultiple', { count: table.selected.length })}
        </>
      }
      action={
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            handleDeleteRows();
            confirmDialog.onFalse();
          }}
        >
          Delete
        </Button>
      }
    />
  );

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('rewards-categories.title')}
          links={[
            { name: t('rewards-categories.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('rewards-categories.title') },
          ]}
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.rewards.rewardsCategoriesCreate}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              {t('rewards-categories.actions.add')}
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
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
                    {totalItems}
                  </Label>
                }
              />
            ))}
          </Tabs>

          <RewardCategoriesTableToolbar
            filters={currentFilters}
            onFilters={(name, value) => {
              table.onResetPage();
              updateFilters({ [name]: value });
            }}
          />

          {canReset && (
            <RewardsCategoriesFiltersResult
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
            <TableSelectedAction
              dense={table.dense}
              numSelected={table.selected.length}
              rowCount={dataFiltered.length}
              onSelectAllRows={(checked) =>
                table.onSelectAllRows(
                  checked,
                  dataFiltered.map((row) => row.id)
                )
              }
              action={
                <IconButton color="primary" onClick={confirmDialog.onTrue}>
                  <Iconify icon="solar:trash-bin-trash-bold" />
                </IconButton>
              }
            />

            <Scrollbar>
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                <TableHeadCustom
                  order={table.order}
                  orderBy={table.orderBy}
                  headCells={TABLE_HEAD}
                  rowCount={dataFiltered.length}
                  numSelected={table.selected.length}
                  onSort={handleSort}
                // onSelectAllRows={(checked) =>
                //   table.onSelectAllRows(
                //     checked,
                //     dataFiltered.map((row) => row.id)
                //   )
                // }
                />

                <TableBody>
                  {dataFiltered
                    .slice(
                      table.page * table.rowsPerPage,
                      table.page * table.rowsPerPage + table.rowsPerPage
                    )
                    .map((row) => (
                      <RewardsCategoriesTableRow
                        key={row.id}
                        row={row}
                        selected={table.selected.includes(row.id)}
                        onSelectRow={() => table.onSelectRow(row.id)}
                        onDeleteRow={() => handleDeleteRow(row.id)}
                        editHref={`${paths.dashboard.rewards.rewardsCategoriesEdit(row.id)}`}
                      />
                    ))}

                  <TableEmptyRows
                    height={table.dense ? 56 : 76}
                    emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
                  />

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

      {renderConfirmDialog()}
    </>
  );
}

// ----------------------------------------------------------------------

type ApplyFilterProps = {
  inputData: IRewardsCategories[];
  filters: IRewardsCategoriesTableFilters;
  comparator: (a: any, b: any) => number;
};

function applyFilter({ inputData, comparator, filters }: ApplyFilterProps) {
  // Asegurar que inputData es un array válido
  if (!Array.isArray(inputData)) {
    console.warn('applyFilter: inputData is not an array, returning empty array');
    return [];
  }

  const { name, status } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter(
      (item) => item?.name?.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }

  if (status !== 'all') {
    // TODO: Implement status filtering when the data model includes a status field
  }

  return inputData;
}
