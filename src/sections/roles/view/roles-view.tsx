'use client';

import type { TableHeadCellProps } from 'src/components/table';
import type { IRole, IRoleTableFilters } from 'src/types/roles';

import { varAlpha } from 'minimal-shared/utils';
import { useSetState, useDebounce} from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  DeleteRoleService,
  GetRolesPaginationService
} from 'src/services/security/roles.service';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { RoleTableRow } from '../roles-table-row';
import { RoleTableToolbar } from '../roles-table-toolbar';
import { RoleTableFiltersResult } from '../roles-table-filters-result';

// ----------------------------------------------------------------------

export function RolesView() {
  const { t } = useTranslate('security');
  const table = useTable();

  const [tableData, setTableData] = useState<IRole[]>([]);
  const [totalItems, setTotalItems] = useState(0);

  const STATUS_OPTIONS = useMemo(() => [
    { value: 'all', label: t('roles.table.filters.all') },
  ], [t]);

  const TABLE_HEAD: TableHeadCellProps[] = useMemo(() => [
    { id: 'actions', width: 88 },
    { id: 'name', label: t('roles.table.columns.name') },
    { id: 'description', label: t('roles.table.columns.description') },
    { id: 'isDefault', label: t('roles.table.columns.isDefault'), width: 120 },
  ], [t]);

  const filters = useSetState<IRoleTableFilters>({
    name: '',
    //status: 'all'
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  // Aplica debounce al filtro de búsqueda
  const debouncedSearch = useDebounce(currentFilters.name, 300);

  // Función para cargar datos
  const loadData = useCallback(async () => {
    try {
      const params = {
        page: table.page + 1,
        perPage: table.rowsPerPage,
        search: debouncedSearch,
      };

      const response = await GetRolesPaginationService(params);
      const normalized = normalizeRolesListResponse(response.data as unknown);
      setTableData(normalized.data);
      setTotalItems(normalized.total);
    } catch (error) {
      console.error('Error loading roles:', error);
      toast.error(t('roles.messages.error.loading'));
      setTableData([]);
      setTotalItems(0);
    }
  }, [table.page, table.rowsPerPage, debouncedSearch, t]);

  // Cargar datos cuando cambian los parámetros
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Aplicar filtros
  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: currentFilters,
  });

  const canReset = !!currentFilters.name;
  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        const response = await DeleteRoleService(id);

        if (response.data.statusCode === 200) {
          toast.success(t('roles.messages.success.deleted'));
          loadData();
        }
      } catch (error) {
        console.error('Error deleting role:', error);
        toast.error(t('roles.messages.error.deleting'));
      }
    },
    [loadData, t]
  );

  const handleResetFilters = useCallback(() => {
    table.onResetPage();
    updateFilters({ name: '' });
  }, [updateFilters, table]);

  return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('roles.title')}
          links={[
            { name: t('roles.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('roles.title') },
          ]}
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.security.rolesCreate}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              {t('roles.actions.add')}
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          <Tabs
            value="all"
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
                  <Label variant="filled" color="default">
                    {totalItems}
                  </Label>
                }
              />
            ))}
          </Tabs>

          <RoleTableToolbar
            filters={currentFilters}
            onFilters={(name, value) => {
              table.onResetPage();
              updateFilters({ [name]: value });
            }}
          />

          {canReset && (
            <RoleTableFiltersResult
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
                  onSort={table.onSort}
                />

                <TableBody>
                  {dataFiltered
                    .slice(
                      table.page * table.rowsPerPage,
                      table.page * table.rowsPerPage + table.rowsPerPage
                    )
                    .map((row) => (
                      <RoleTableRow
                        key={row.id}
                        row={row}
                        selected={table.selected.includes(row.id)}
                        onSelectRow={() => table.onSelectRow(row.id)}
                        onDeleteRow={() => handleDeleteRow(row.id)}
                        editHref={`${paths.dashboard.security.rolesEdit(row.id)}`}
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

  );
}

// ----------------------------------------------------------------------

type ApplyFilterProps = {
  inputData: IRole[];
  filters: IRoleTableFilters;
  comparator: (a: any, b: any) => number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseRole(value: unknown): IRole | null {
  if (!isRecord(value)) return null;
  const idRaw = value.id;
  const id = typeof idRaw === 'string' || typeof idRaw === 'number' ? String(idRaw) : '';
  const name = typeof value.name === 'string' ? value.name : '';
  if (!id || !name) return null;
  const description = typeof value.description === 'string' ? value.description : '';
  const slug = typeof value.slug === 'string' || value.slug === null ? value.slug : null;
  const isDefaultRaw = value.isDefault;
  const isDefault = typeof isDefaultRaw === 'number' ? isDefaultRaw : Number(isDefaultRaw);

  return {
    id,
    name,
    description,
    slug,
    isDefault: Number.isFinite(isDefault) ? isDefault : 0,
    createdAt: value.createdAt as unknown as Date,
    updatedAt: value.updatedAt as unknown as Date,
    deletedAt: value.deletedAt as unknown as Date | null,
  };
}

function normalizeRolesListResponse(raw: unknown): { data: IRole[]; total: number } {
  const listSource = (() => {
    if (Array.isArray(raw)) return raw;
    if (isRecord(raw) && Array.isArray(raw.data)) return raw.data;
    if (isRecord(raw) && isRecord(raw.data) && Array.isArray(raw.data.data)) return raw.data.data;
    return [];
  })();

  const data = listSource.map(parseRole).filter((item): item is IRole => item !== null);

  const total = (() => {
    if (isRecord(raw) && isRecord(raw.meta) && typeof raw.meta.itemCount === 'number') return raw.meta.itemCount;
    if (isRecord(raw) && isRecord(raw.data) && isRecord(raw.data.meta) && typeof raw.data.meta.itemCount === 'number') {
      return raw.data.meta.itemCount;
    }
    return data.length;
  })();

  return { data, total };
}

function applyFilter({ inputData, comparator, filters }: ApplyFilterProps) {
  const { name } = filters;

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

  return inputData;
}
