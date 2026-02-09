'use client';

import { varAlpha } from 'minimal-shared/utils';
import { useSetState } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';

import { useTranslate } from 'src/locales';
import { GetOrganizationalUnitFeedbacksService, DeleteOrganizationalUnitFeedbackService } from 'src/services/architecture/business/organizational-unit-feedbacks.service';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Scrollbar } from 'src/components/scrollbar';
import {
  useTable,
  TableNoData,
  TableSkeleton,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { OrganizationalUnitFeedbacksTableRow } from './organizational-unit-feedbacks-table-row';
import { OrganizationalUnitFeedbacksTableToolbar } from './organizational-unit-feedbacks-table-toolbar';

// ----------------------------------------------------------------------

type Props = {
    orgUnitId: string;
};

export function OrganizationalUnitFeedbacksTableView({ orgUnitId }: Props) {
  const table = useTable();

  const [tableData, setTableData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  const TABS = useMemo(() => [
    { value: 'all', label: 'Todos' },
    { value: 'lesson', label: 'Lecciones Aprendidas' },
    { value: 'proposal', label: 'Propuestas de Mejora' },
  ], []);

  const TABLE_HEAD = useMemo(() => [
    { id: '', width: 88 },
    { id: 'name', label: 'Nombre' },
    { id: 'description', label: 'Descripción' },
    { id: 'type', label: 'Tipo' },
  ], []);

  const filters = useSetState<{ name: string; type: string }>({
    name: '',
    type: 'all',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const loadData = useCallback(async () => {
    if (!orgUnitId) return;
    setIsLoading(true);
    try {
      const response = await GetOrganizationalUnitFeedbacksService(orgUnitId, {
        page: table.page + 1,
        perPage: table.rowsPerPage,
      });

      const raw = response?.data;
      const list = (raw && typeof raw === 'object' && Array.isArray((raw as any).data))
        ? ((raw as any).data as any[])
        : (Array.isArray(raw) ? raw : []);
      const count = (raw && typeof raw === 'object')
        ? Number((raw as any)?.meta?.itemCount ?? list.length)
        : list.length;

      setTableData(list);
      setTotalItems(count);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar feedbacks');
      setTableData([]);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  }, [orgUnitId, table.page, table.rowsPerPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterType = useCallback(
    (_event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      updateFilters({ type: newValue });
    },
    [table, updateFilters]
  );

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        await DeleteOrganizationalUnitFeedbackService(id);
        toast.success('Eliminado correctamente');
        loadData();
      } catch (error) {
        console.error(error);
        toast.error('Error al eliminar');
      }
    },
    [loadData]
  );

  const handleEditRow = useCallback(() => {
    toast.info('Editar pendiente');
  }, []);

  const dataFiltered = useMemo(() => {
    let filtered = tableData;

    if (currentFilters.type !== 'all') {
        filtered = filtered.filter((item) => item.type === currentFilters.type || item.feedbackType === currentFilters.type);
    }

    if (currentFilters.name) {
        const name = currentFilters.name.toLowerCase().trim();
        filtered = filtered.filter((item) => item.name?.toLowerCase().includes(name));
    }

    return filtered;
  }, [currentFilters.name, currentFilters.type, tableData]);

  const notFound = !dataFiltered.length && !!currentFilters.name;

  return (
    <Card>
      <Tabs
        value={currentFilters.type}
        onChange={handleFilterType}
        sx={[
          (theme) => ({
            px: { md: 2.5 },
            boxShadow: `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
          }),
        ]}
      >
        {TABS.map((tab) => (
          <Tab
            key={tab.value}
            iconPosition="end"
            value={tab.value}
            label={tab.label}
            icon={
              <Label
                variant={
                  ((tab.value === 'all' || tab.value === currentFilters.type) && 'filled') ||
                  'soft'
                }
                color="default"
              >
                 {tab.value === 'all' ? totalItems : dataFiltered.length} 
              </Label>
            }
          />
        ))}
      </Tabs>

      <OrganizationalUnitFeedbacksTableToolbar
        filters={{ name: currentFilters.name }}
        onFilters={(name, value) => {
          table.onResetPage();
          updateFilters({ [name]: value });
        }}
      />

      <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
        <Scrollbar>
          <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
            <TableHeadCustom
              headCells={TABLE_HEAD}
              rowCount={dataFiltered.length}
              numSelected={table.selected.length}
            />

            <TableBody>
              {isLoading ? (
                <TableSkeleton rowCount={8} cellCount={4} />
              ) : (
                dataFiltered.map((row) => (
                  <OrganizationalUnitFeedbacksTableRow
                    key={row.id}
                    row={row}
                    selected={table.selected.includes(String(row.id))}
                    onSelectRow={() => table.onSelectRow(String(row.id))}
                    onDeleteRow={() => handleDeleteRow(String(row.id))}
                    onEditRow={() => handleEditRow()}
                  />
                ))
              )}

              <TableNoData notFound={notFound} />
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
  );
}
