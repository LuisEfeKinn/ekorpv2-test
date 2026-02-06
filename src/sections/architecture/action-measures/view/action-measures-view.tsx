'use client';

import type { TableHeadCellProps } from 'src/components/table';
import type { ActionMeasureRow, ActionMeasureApiItem } from 'src/types/architecture/action-measures';

import { varAlpha } from 'minimal-shared/utils';
import { useBoolean, useSetState } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { GetActionMeasuresService, DeleteActionMeasureService } from 'src/services/architecture/actionMeasures.service';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, emptyRows, TableNoData, TableSkeleton, getComparator, TableEmptyRows, TableHeadCustom } from 'src/components/table';

import { ActionMeasuresTableRow } from '../action-measures-table-row';
import { ActionMeasuresTableModal } from '../action-measures-table-modal';
import { ActionMeasuresTableToolbar } from '../action-measures-table-toolbar';

// ----------------------------------------------------------------------

function normalizeActionMeasuresResponse(payload: unknown): ActionMeasureRow[] {
  const list: ActionMeasureApiItem[] = Array.isArray(payload)
    ? (payload as ActionMeasureApiItem[])
    : (payload && typeof payload === 'object' && Array.isArray((payload as any).data)
        ? ((payload as any).data as ActionMeasureApiItem[])
        : []);

  return list.map((item, idx) => {
    const rawId = item?.id ?? idx;
    const id = String(rawId);
    const code = String(item?.code ?? '').trim();
    const name = String(item?.name ?? '').trim();

    return {
      id,
      code,
      name,
    };
  });
}

export function ActionMeasuresView() {
  const table = useTable();
  const modalDialog = useBoolean();
  const confirmDialog = useBoolean();

  const [tableData, setTableData] = useState<ActionMeasureRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filters = useSetState<any>({
    name: '',
    status: 'all',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const STATUS_OPTIONS = useMemo(() => [
    { value: 'all', label: 'Todos' },
  ], []);

  const TABLE_HEAD: TableHeadCellProps[] = useMemo(
    () => [
      { id: '', width: 64 },
      { id: 'code', label: 'Código/Nomenclatura' },
      { id: 'name', label: 'Nombre' },
    ],
    []
  );

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await GetActionMeasuresService();
      const nextRows = normalizeActionMeasuresResponse(response?.data);
      setTableData(nextRows);
    } catch (err) {
      const message =
        (typeof err === 'string' && err) ||
        (typeof err === 'object' && err && 'message' in err && (err as any).message) ||
        'No se pudo cargar Action Measures.';
      setError(String(message));
      setTableData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: currentFilters,
  });

  const notFound = (!dataFiltered.length && !!currentFilters.name) || !dataFiltered.length;

  const handleFilterStatus = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      updateFilters({ status: newValue });
    },
    [updateFilters, table]
  );

  const handleSaveModal = useCallback(() => {
    loadData();
  }, [loadData]);

  const handleEditRow = useCallback((id: string) => {
    setSelectedId(id);
    modalDialog.onTrue();
  }, [modalDialog]);

  const handleDeleteRow = useCallback((id: string) => {
    setDeleteId(id);
    confirmDialog.onTrue();
  }, [confirmDialog]);

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    
    try {
      await DeleteActionMeasureService(deleteId);
      toast.success('Eliminado correctamente');
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('No se pudo eliminar');
    } finally {
      confirmDialog.onFalse();
      setDeleteId(null);
    }
  };

  const handleCloseModal = () => {
    modalDialog.onFalse();
    setSelectedId(undefined);
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Action Measures"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Arquitectura', href: paths.dashboard.architecture.catalogs.root },
          { name: 'Action Measures' },
        ]}
        action={
          <Button
            onClick={() => {
              setSelectedId(undefined);
              modalDialog.onTrue();
            }}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            Agregar
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {error && (
        <Box sx={{ mb: 3 }}>
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={loadData}>
                Reintentar
              </Button>
            }
          >
            {error}
          </Alert>
        </Box>
      )}

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
                  {tableData.length}
                </Label>
              }
            />
          ))}
        </Tabs>

        <ActionMeasuresTableToolbar
          filters={currentFilters}
          onFilters={(name, value) => {
            table.onResetPage();
            updateFilters({ [name]: value });
          }}
        />

        <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 720 }}>
              <TableHeadCustom
                order={table.order}
                orderBy={table.orderBy}
                headCells={TABLE_HEAD}
                rowCount={tableData.length}
                numSelected={table.selected.length}
                onSort={table.onSort}
              />

              <TableBody>
                {isLoading ? (
                  <TableSkeleton rowCount={8} cellCount={3} />
                ) : (
                  dataFiltered
                    .slice(
                      table.page * table.rowsPerPage,
                      table.page * table.rowsPerPage + table.rowsPerPage
                    )
                    .map((row) => (
                      <ActionMeasuresTableRow
                        key={row.id}
                        row={row}
                        selected={table.selected.includes(row.id)}
                        onSelectRow={() => table.onSelectRow(row.id)}
                        onEditRow={() => handleEditRow(row.id)}
                        onDeleteRow={() => handleDeleteRow(row.id)}
                      />
                    ))
                )}

                <TableEmptyRows
                  height={table.dense ? 56 : 76}
                  emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
                />

                <TableNoData notFound={notFound} />
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>
      </Card>

      <ActionMeasuresTableModal
        open={modalDialog.value}
        onClose={handleCloseModal}
        onSave={handleSaveModal}
        dataId={selectedId}
      />

      <ConfirmDialog
        open={confirmDialog.value}
        onClose={confirmDialog.onFalse}
        title="Eliminar"
        content="¿Estás seguro de que deseas eliminar este elemento?"
        action={
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>
            Eliminar
          </Button>
        }
      />
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

type ApplyFilterProps = {
  inputData: ActionMeasureRow[];
  filters: any;
  comparator: (a: any, b: any) => number;
};

function applyFilter({ inputData, comparator, filters }: ApplyFilterProps) {
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
      (item) => item.name.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }

  if (status !== 'all') {
    // Implement status filtering if needed
  }

  return inputData;
}
