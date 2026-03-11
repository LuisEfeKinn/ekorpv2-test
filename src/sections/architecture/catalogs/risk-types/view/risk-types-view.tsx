'use client';

import type { TableHeadCellProps } from 'src/components/table';

import { varAlpha } from 'minimal-shared/utils';
import { useBoolean, useSetState } from 'minimal-shared/hooks';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  DeleteRiskTypeService,
  GetRiskTypesPaginationService
} from 'src/services/architecture/catalogs/riskTypes.service';

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

import { RiskTypesTableRow } from '../risk-types-table-row';
import { RiskTypesTableModal } from '../risk-types-table-modal';
import { RiskTypesTableToolbar } from '../risk-types-table-toolbar';
import { RiskTypesConfigureModal } from '../risk-types-configure-modal';
import { RiskTypesTableFiltersResult } from '../risk-types-table-filters-result';

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export function RiskTypesView() {
  const { t, currentLang } = useTranslate('catalogs');
  const table = useTable();
  const confirmDialog = useBoolean();
  const modalDialog = useBoolean();
  const configureDialog = useBoolean();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const openedFromQueryRef = useRef(false);

  const [tableData, setTableData] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedDataId, setSelectedDataId] = useState<string | undefined>(undefined);
  const [configureDataId, setConfigureDataId] = useState<string | undefined>(undefined);

  const tf = useCallback((key: string, en: string, es?: string) => {
    const v = t(key);
    if (v && v !== key) return v;
    return currentLang?.value === 'es' ? (es ?? en) : en;
  }, [t, currentLang?.value]);

  const STATUS_OPTIONS = useMemo(() => [
    { value: 'all', label: tf('risk-types.filters.all', 'All', 'Todas') },
  ], [tf]);

  const TABLE_HEAD: TableHeadCellProps[] = useMemo(() => [
    { id: '', width: 88 },
    { id: 'name', label: tf('risk-types.columns.name', 'Name', 'Nombre') },
  ], [tf]);

  const filters = useSetState<any>({
    name: '',
    status: 'all',
  });
  const { state: currentFilters, setState: updateFilters } = filters;


  // Función para cargar datos
  const loadData = useCallback(async () => {
    try {
      const params = {
        page: table.page + 1,
        perPage: table.rowsPerPage,
        search: currentFilters.name,
      };

      const response = await GetRiskTypesPaginationService(params);
      // Verificar la estructura de la respuesta
      const data = response.data[0] || response.data?.data || response.data || [];

      setTableData(Array.isArray(data) ? data : []);
      setTotalItems(response.data?.totalItems || data.length || 0);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error(t('risk-types.messages.error.loading'));
      setTableData([]);
      setTotalItems(0);
    }
  }, [table.page, table.rowsPerPage, currentFilters.name, t]);

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

  const canReset = !!currentFilters.name || (currentFilters.status !== 'all' && currentFilters.status !== undefined);
  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        const response = await DeleteRiskTypeService(id);

        if (response.data.statusCode === 200) {
          toast.success(t('risk-types.messages.success.deleted'));
          loadData(); // Recargar datos
        }
      } catch (error) {
        console.error('Error deleting data:', error);
        toast.error(t('risk-types.messages.error.deleting'));
      }
    },
    [loadData, t]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      // Eliminar múltiples elementos
      const deletePromises = table.selected.map(id => DeleteRiskTypeService(id));
      await Promise.all(deletePromises);

      toast.success(t('risk-types.messages.success.deletedMultiple'));
      table.setSelected([]);
      loadData(); // Recargar datos
    } catch (error) {
      console.error('Error deleting data:', error);
      toast.error(t('risk-types.messages.error.deletingMultiple'));
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

  const handleOpenModal = useCallback((dataId?: string) => {
    setSelectedDataId(dataId);
    modalDialog.onTrue();
  }, [modalDialog]);

  const handleCloseModal = useCallback(() => {
    setSelectedDataId(undefined);
    modalDialog.onFalse();
  }, [modalDialog]);

  const handleSaveModal = useCallback(() => {
    loadData(); // Recargar la tabla después de guardar
  }, [loadData]);

  const handleOpenConfigureModal = useCallback((dataId?: string) => {
    setConfigureDataId(dataId);
    configureDialog.onTrue();
  }, [configureDialog]);

  const handleCloseConfigureModal = useCallback(() => {
    setConfigureDataId(undefined);
    configureDialog.onFalse();
    try {
      const url = pathname || '/';
      router.replace(url);
    } catch {
      void 0;
    }
  }, [configureDialog, pathname, router]);

  useEffect(() => {
    const open = searchParams.get('open');
    const rt = searchParams.get('risktype');
    if (open === 'config' && rt && !openedFromQueryRef.current && !configureDialog.value) {
      handleOpenConfigureModal(rt);
      openedFromQueryRef.current = true;
    }
  }, [searchParams, handleOpenConfigureModal, configureDialog.value]);

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title={t('risk-types.dialogs.delete.title')}
      content={
        <>
          {t('risk-types.dialogs.delete.contentMultiple', { count: table.selected.length })}
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
          {t('risk-types.actions.delete')}
        </Button>
      }
    />
  );

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('risk-types.title')}
          links={[
            { name: t('risk-types.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('risk-types.breadcrumbs.catalogs'), href: paths.dashboard.architecture.catalogs.root },
            { name: t('risk-types.title') },
          ]}
          action={
            <Button
              onClick={() => handleOpenModal()}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              {t('risk-types.actions.add')}
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

          <RiskTypesTableToolbar
            filters={currentFilters}
            onFilters={(name, value) => {
              table.onResetPage();
              updateFilters({ [name]: value });
            }}
          />

          {canReset && (
            <RiskTypesTableFiltersResult
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
                  onSort={table.onSort}
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
                      <RiskTypesTableRow
                        key={row.id}
                        row={row}
                        mapHref={`${paths.dashboard.architecture.catalogs.riskTypesMap}?id=${row.id}`}
                        selected={table.selected.includes(row.id)}
                        onSelectRow={() => table.onSelectRow(row.id)}
                        onDeleteRow={() => handleDeleteRow(row.id)}
                        onEditRow={() => handleOpenModal(row.id)}
                        onConfigureRow={() => handleOpenConfigureModal(row.id)}
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

      <RiskTypesTableModal
        open={modalDialog.value}
        onClose={handleCloseModal}
        dataId={selectedDataId}
        onSave={handleSaveModal}
      />

      <RiskTypesConfigureModal
        open={configureDialog.value}
        onClose={handleCloseConfigureModal}
        dataId={configureDataId}
      />
    </>
  );
}

// ----------------------------------------------------------------------

type ApplyFilterProps = {
  inputData: any[];
  filters: any;
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
