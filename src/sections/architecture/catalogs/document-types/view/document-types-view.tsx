'use client';

import type { TableHeadCellProps } from 'src/components/table';
import type { DocumentType, DocumentTypeFilters } from 'src/types/architecture/catalogs/document-types';

import { varAlpha } from 'minimal-shared/utils';
import { useBoolean, useSetState } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  DeleteDocumentTypeService,
  GetDocumentTypesPaginationService,
} from 'src/services/architecture/catalogs/documentTypes.service';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { useTable, TableNoData, getComparator, TableHeadCustom, TableSelectedAction } from 'src/components/table';

import { DocumentTypesTableRow } from '../document-types-table-row';
import { DocumentTypesTableDrawer } from '../document-types-table-drawer';
import { DocumentTypesTableToolbar } from '../document-types-table-toolbar';

type Comparator<T> = (a: T, b: T) => number;

export function DocumentTypesView() {
  const { t } = useTranslate('catalogs');
  const table = useTable();
  const confirmDialog = useBoolean();
  const drawer = useBoolean();

  const [tableData, setTableData] = useState<DocumentType[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedDataId, setSelectedDataId] = useState<string | number | undefined>(undefined);

  const STATUS_OPTIONS = useMemo(() => [{ value: 'all', label: t('document-types.filters.all') }], [t]);

  const TABLE_HEAD: TableHeadCellProps[] = useMemo(
    () => [
      { id: '', width: 88 },
      { id: 'name', label: t('document-types.columns.name') },
      { id: 'documentCode', label: t('document-types.columns.documentCode') },
    ],
    [t]
  );

  const filters = useSetState<DocumentTypeFilters>({ name: '', status: 'all' });
  const { state: currentFilters, setState: updateFilters } = filters;

  const loadData = useCallback(async () => {
    try {
      const params: Record<string, unknown> = {
        page: 1,
        perPage: 10000,
        pageSize: 10000,
        limit: 10000,
        size: 10000,
        _t: new Date().getTime(),
      };

      const response = await GetDocumentTypesPaginationService(params);
      const responseData = response.data;

      let data: DocumentType[] = [];

      if (Array.isArray(responseData)) {
        if (responseData.length >= 2 && Array.isArray(responseData[0])) {
          data = responseData[0] as DocumentType[];
        } else if (responseData.length === 1 && Array.isArray(responseData[0])) {
          data = responseData[0] as DocumentType[];
        } else {
          data = responseData as DocumentType[];
        }
      } else if (responseData && typeof responseData === 'object' && 'data' in responseData) {
        const maybe = responseData as { data?: unknown };
        data = Array.isArray(maybe.data) ? (maybe.data as DocumentType[]) : [];
      }

      const nextData = Array.isArray(data) ? [...data] : [];
      setTableData(nextData);
      setTotalItems(nextData.length);
    } catch (error) {
      toast.error(t('document-types.messages.error.loading'));
      setTableData([]);
      setTotalItems(0);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy) as unknown as Comparator<DocumentType>,
    filters: currentFilters,
  });

  const canReset = currentFilters.name !== '' || currentFilters.status !== 'all';
  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRow = useCallback(
    async (id: string | number) => {
      try {
        await DeleteDocumentTypeService(id);
        toast.success(t('document-types.messages.success.deleted'));
        loadData();
      } catch (error) {
        toast.error(t('document-types.messages.error.deleting'));
      }
    },
    [loadData, t]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      const deletePromises = table.selected.map((id) => DeleteDocumentTypeService(id));
      await Promise.all(deletePromises);
      toast.success(t('document-types.messages.success.deletedMultiple', { count: table.selected.length }));
      table.setSelected([]);
      loadData();
    } catch (error) {
      toast.error(t('document-types.messages.error.deletingMultiple'));
    }
  }, [loadData, t, table]);

  const handleFilterStatus = useCallback(
    (_event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      updateFilters({ status: 'all' });
      if (newValue !== 'all') updateFilters({ status: 'all' });
    },
    [table, updateFilters]
  );

  const handleOpenDrawer = useCallback(
    (dataId?: string | number) => {
      setSelectedDataId(dataId);
      drawer.onTrue();
    },
    [drawer]
  );

  const handleCloseDrawer = useCallback(() => {
    setSelectedDataId(undefined);
    drawer.onFalse();
  }, [drawer]);

  const handleSaved = useCallback(() => {
    setTimeout(() => {
      loadData();
    }, 500);
  }, [loadData]);

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('document-types.title')}
          links={[
            { name: t('document-types.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('document-types.breadcrumbs.catalogs'), href: paths.dashboard.architecture.catalogs.root },
            { name: t('document-types.title') },
          ]}
          action={
            <Button onClick={() => handleOpenDrawer()} variant="contained" startIcon={<Iconify icon="mingcute:add-line" />}>
              {t('document-types.actions.add')}
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
            {STATUS_OPTIONS.map((tabItem) => (
              <Tab
                key={tabItem.value}
                iconPosition="end"
                value={tabItem.value}
                label={tabItem.label}
                icon={
                  <Label
                    variant={((tabItem.value === 'all' || tabItem.value === currentFilters.status) && 'filled') || 'soft'}
                    color="default"
                  >
                    {totalItems}
                  </Label>
                }
              />
            ))}
          </Tabs>

          <DocumentTypesTableToolbar
            filters={currentFilters}
            onFilters={(name, value) => {
              table.onResetPage();
              updateFilters({ [name]: value } as Partial<DocumentTypeFilters>);
            }}
          />

          <Box sx={{ position: 'relative' }}>
            <TableSelectedAction
              dense={table.dense}
              numSelected={table.selected.length}
              rowCount={dataFiltered.length}
              onSelectAllRows={(checked) =>
                table.onSelectAllRows(
                  checked,
                  dataFiltered.map((row) => String(row.id))
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
                />

                <TableBody>
                  {dataFiltered.map((row) => (
                    <DocumentTypesTableRow
                      key={row.id}
                      row={row}
                      selected={table.selected.includes(String(row.id))}
                      onSelectRow={() => table.onSelectRow(String(row.id))}
                      onDeleteRow={() => handleDeleteRow(String(row.id))}
                      onEditRow={() => handleOpenDrawer(String(row.id))}
                    />
                  ))}

                  <TableNoData notFound={notFound} />
                </TableBody>
              </Table>
            </Scrollbar>
          </Box>
        </Card>
      </DashboardContent>

      <ConfirmDialog
        open={confirmDialog.value}
        onClose={confirmDialog.onFalse}
        title={t('document-types.dialogs.delete.title')}
        content={t('document-types.dialogs.delete.contentMultiple', { count: table.selected.length })}
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              handleDeleteRows();
              confirmDialog.onFalse();
            }}
          >
            {t('document-types.actions.delete')}
          </Button>
        }
      />

      <DocumentTypesTableDrawer open={drawer.value} onClose={handleCloseDrawer} dataId={selectedDataId} onSave={handleSaved} />
    </>
  );
}

type ApplyFilterProps = {
  inputData: DocumentType[];
  filters: DocumentTypeFilters;
  comparator: Comparator<DocumentType>;
};

function applyFilter({ inputData, comparator, filters }: ApplyFilterProps) {
  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  let nextData = stabilizedThis.map((el) => el[0]);

  if (filters.name) {
    const query = filters.name.toLowerCase();
    nextData = nextData.filter(
      (item) => item.name.toLowerCase().includes(query) || item.documentCode.toLowerCase().includes(query)
    );
  }

  return nextData;
}
