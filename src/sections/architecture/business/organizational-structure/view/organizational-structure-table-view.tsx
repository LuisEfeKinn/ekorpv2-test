'use client';

import type { IOrganizationalUnit } from 'src/types/organization';

import { varAlpha } from 'minimal-shared/utils';
import { useBoolean, useSetState } from 'minimal-shared/hooks';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetOrganizationalUnitTypesPaginationService } from 'src/services/architecture/catalogs/organizationalUnitTypes.service';
import {
  DeleteOrganizationalUnitService,
  type OrganizationalUnitFlowNode,
  UploadOrganizationalUnitService,
  GetOrganizationalUnitFlowService,
  DownloadOrganizationalUnitExcelService,
  DownloadOrganizationalUnitTemplateService,
} from 'src/services/organization/organizationalUnit.service';

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

import { OrganizationalStructureTableRow } from 'src/sections/architecture/business/organizational-structure/view/organizational-structure-table-row';
import {
  OrganizationalStructureTableToolbar,
  type OrganizationalStructureFlowFilters,
} from 'src/sections/architecture/business/organizational-structure/view/organizational-structure-table-toolbar';

import { ALL_COLUMNS, DEFAULT_COLUMNS } from './organizational-structure-table-config';
import { OrganizationalStructureCreateEditDrawer } from '../organizational-structure-create-form';

// ----------------------------------------------------------------------

type Filters = {
  name: string;
  status: string;
};

type FlowResponse = { data?: unknown };

type FlattenedOrganizationalUnitRow = Omit<IOrganizationalUnit, 'children'> & {
  label: string;
  level: number;
  parentId?: string;
  hasChildren: boolean;
};

type OrgUnitType = {
  id: number | string;
  name: string;
};

type OrgUnitTypeOption = {
  value: number;
  label: string;
};

const normalizeFlowData = (raw: unknown): OrganizationalUnitFlowNode[] => {
  if (Array.isArray(raw)) {
    return raw as OrganizationalUnitFlowNode[];
  }
  if (raw && typeof raw === 'object' && Array.isArray((raw as FlowResponse).data)) {
    return (raw as FlowResponse).data as OrganizationalUnitFlowNode[];
  }
  return [];
};

export function OrganizationalStructureTableView() {
  const { t, currentLang } = useTranslate('organization');
  const table = useTable();
  const confirmDialog = useBoolean();
  const openDrawer = useBoolean();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [flowFilters, setFlowFilters] = useState<OrganizationalStructureFlowFilters>({
    type: null,
  });
  const [orgUnitTypeOptions, setOrgUnitTypeOptions] = useState<OrgUnitTypeOption[]>([]);
  const [tableData, setTableData] = useState<OrganizationalUnitFlowNode[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentUnit, setCurrentUnit] = useState<IOrganizationalUnit | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_COLUMNS);

  useEffect(() => {
    const isOrgUnitType = (value: unknown): value is OrgUnitType => {
      if (!value || typeof value !== 'object') return false;
      const record = value as Record<string, unknown>;
      const id = record.id;
      return (typeof id === 'number' || typeof id === 'string') && typeof record.name === 'string';
    };

    const normalizeOrgUnitTypes = (raw: unknown): OrgUnitType[] => {
      if (Array.isArray(raw)) {
        if (raw.length === 2 && Array.isArray(raw[0])) {
          return raw[0].filter(isOrgUnitType);
        }
        return raw.filter(isOrgUnitType);
      }

      if (raw && typeof raw === 'object') {
        const record = raw as Record<string, unknown>;
        if (Array.isArray(record.data)) {
          return record.data.filter(isOrgUnitType);
        }
      }

      return [];
    };

    const loadOrgUnitTypes = async () => {
      try {
        const res = await GetOrganizationalUnitTypesPaginationService({ page: 1, perPage: 1000 });
        const list = normalizeOrgUnitTypes(res?.data);
        setOrgUnitTypeOptions(
          list
            .map((it) => ({ value: Number(it.id), label: it.name }))
            .filter((opt) => Number.isFinite(opt.value) && opt.label.trim().length > 0)
        );
      } catch {
        setOrgUnitTypeOptions([]);
      }
    };

    loadOrgUnitTypes();
  }, []);

  const handleToggleColumn = useCallback((columnId: string) => {
    setVisibleColumns((prev) => {
      if (prev.includes(columnId)) {
        return prev.filter((id) => id !== columnId);
      }
      return [...prev, columnId];
    });
  }, []);

  const STATUS_OPTIONS = useMemo(() => [{ value: 'all', label: t('organization.table.filters.all') }], [t]);

  const TABLE_HEAD = useMemo(() => {
    const dynamicColumns = ALL_COLUMNS.filter((col) => visibleColumns.includes(col.id)).map((col) => ({
      ...col,
      label: t(col.label),
    }));
    return [
      { id: '', width: 88 },
      ...dynamicColumns,
    ];
  }, [visibleColumns, t]);

  const filters = useSetState<Filters>({ name: '', status: 'all' });
  const { state: currentFilters, setState: updateFilters } = filters;

  const flowParams = useMemo(() => {
    const params: Record<string, string | number | boolean | undefined> = {};

    const name = currentFilters.name.trim();
    if (name) params.name = name;
    if (flowFilters.type) params.orgUnitTypeId = flowFilters.type;

    return Object.keys(params).length ? params : undefined;
  }, [currentFilters.name, flowFilters.type]);

  const handleFlowFilters = useCallback(
    (next: Partial<OrganizationalStructureFlowFilters>) => {
      table.onResetPage();
      setFlowFilters((prev) => ({ ...prev, ...next }));
    },
    [table]
  );

  const flattenDataWithHierarchy = useCallback(
    (data: OrganizationalUnitFlowNode[], level = 0, parentId?: string): FlattenedOrganizationalUnitRow[] => {
      const flattened: FlattenedOrganizationalUnitRow[] = [];

      const comparator = getComparator(table.order, table.orderBy);
      const sortedData = [...data].sort((a, b) => comparator(a.data as any, b.data as any));

      sortedData.forEach((item) => {
        if (!item) return;

        const dataNode = item.data as IOrganizationalUnit;
        const flatItem: FlattenedOrganizationalUnitRow = {
          ...dataNode,
          id: String(item.id ?? dataNode?.id ?? ''),
          label: item.label,
          level,
          parentId,
          hasChildren: (item.children?.length ?? 0) > 0,
        };

        flattened.push(flatItem);

        if (expandedRows.has(String(item.id)) && Array.isArray(item.children)) {
          flattened.push(...flattenDataWithHierarchy(item.children, level + 1, String(item.id)));
        }
      });

      return flattened;
    },
    [expandedRows, table.order, table.orderBy]
  );

  const loadData = useCallback(async () => {
    try {
      const response = await GetOrganizationalUnitFlowService(flowParams);
      const list = normalizeFlowData(response?.data);

      setTableData(list);
    } catch {
      toast.error(t('organization.actions.loadError'));
      setTableData([]);
    }
  }, [flowParams, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const flattenedData = useMemo(
    () => flattenDataWithHierarchy(tableData),
    [flattenDataWithHierarchy, tableData]
  );

  const dataFiltered = applyFilter({
    inputData: flattenedData,
    filters: currentFilters,
    flowFilters,
  });

  useEffect(() => {
    setTotalItems(dataFiltered.length);
  }, [dataFiltered.length]);

  const canReset = !!currentFilters.name || currentFilters.status !== 'all';
  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        await DeleteOrganizationalUnitService(id);
        toast.success(t('organization.actions.deleteSuccess'));
        loadData();
      } catch {
        toast.error(t('organization.actions.deleteError'));
      }
    },
    [loadData, t]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      const deletePromises = table.selected.map((id) => DeleteOrganizationalUnitService(id));
      await Promise.all(deletePromises);
      toast.success(t('organization.actions.deleteSuccess'));
      table.setSelected([]);
      loadData();
    } catch {
      toast.error(t('organization.actions.deleteError'));
    }
  }, [loadData, table, t]);

  const handleFilterStatus = useCallback(
    (_event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      updateFilters({ status: newValue });
    },
    [table, updateFilters]
  );

  const handleResetFilters = useCallback(() => {
    table.onResetPage();
    updateFilters({ name: '', status: 'all' });
  }, [table, updateFilters]);

  const handleDownloadTemplate = useCallback(
    async () => {
      try {
        const response = await DownloadOrganizationalUnitTemplateService();
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'organizational_unit_template.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (error) {
        console.error(error);
        toast.error(t('organization.actions.downloadError'));
      }
    },
    [t]
  );

  const handleDownloadExcel = useCallback(async () => {
    try {
      setDownloading(true);
      const name = currentFilters.name.trim();
      const params: Record<string, string | number | boolean> = {
        columns: visibleColumns.join(','),
        lang: currentLang.value,
      };

      if (name) params.name = name;
      if (flowFilters.type) params.orgUnitTypeId = flowFilters.type;

      const response = await DownloadOrganizationalUnitExcelService(params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'organizational_units.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(error);
      toast.error(t('organization.actions.downloadError'));
    } finally {
      setDownloading(false);
    }
  }, [currentLang.value, flowFilters.type, t, currentFilters.name, visibleColumns]);

  const handleUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        setUploading(true);
        await UploadOrganizationalUnitService(file);
        toast.success(t('organization.actions.uploadSuccess'));
        loadData();
      } catch (error) {
        console.error(error);
        toast.error(t('organization.actions.uploadError'));
      } finally {
        setUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [loadData, t]
  );

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title={t('organization.dialogs.delete.title')}
      content={t('organization.dialogs.delete.contentMultiple', { count: table.selected.length })}
      action={
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            handleDeleteRows();
            confirmDialog.onFalse();
          }}
        >
          {t('organization.dialogs.delete.confirm')}
        </Button>
      }
    />
  );

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('organization.view.tableTitle')}
          links={[
            { name: t('organization.view.dashboard'), href: paths.dashboard.root },
            { name: t('organization.view.list') },
          ]}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleUpload}
                accept=".xlsx, .xls"
              />

              <Button
                component={RouterLink}
                href={paths.dashboard.architecture.organizationalStructureMap}
                variant="outlined"
                startIcon={<Iconify icon="solar:map-point-bold" />}
              >
                {t('organization.view.organigram')}
              </Button>

              <Button
                variant="outlined"
                startIcon={<Iconify icon="eva:cloud-download-fill" />}
                onClick={handleDownloadTemplate}
              >
                {t('organization.actions.downloadTemplate')}
              </Button>

              <LoadingButton
                variant="outlined"
                loading={uploading}
                startIcon={<Iconify icon="eva:cloud-upload-fill" />}
                onClick={() => fileInputRef.current?.click()}
              >
                {t('organization.actions.upload')}
              </LoadingButton>

              <LoadingButton
                variant="outlined"
                loading={downloading}
                startIcon={<Iconify icon="solar:download-bold" />}
                onClick={handleDownloadExcel}
              >
                {t('organization.actions.download')}
              </LoadingButton>

              <Button
                onClick={() => {
                  setCurrentUnit(null);
                  openDrawer.onTrue();
                }}
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
              >
                {t('organization.actions.create')}
              </Button>
            </Box>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          <Tabs
            value={currentFilters.status}
            onChange={handleFilterStatus}
            sx={(theme) => ({
              px: { md: 2.5 },
              boxShadow: `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
            })}
          >
            {STATUS_OPTIONS.map((tabItem) => (
              <Tab
                key={tabItem.value}
                iconPosition="end"
                value={tabItem.value}
                label={tabItem.label}
                icon={
                  <Label
                    variant={
                      ((tabItem.value === 'all' || tabItem.value === currentFilters.status) && 'filled') ||
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

          <OrganizationalStructureTableToolbar
            filters={currentFilters}
            onFilters={(name: 'name', value: string) => {
              table.onResetPage();
              updateFilters({ [name]: value } as Partial<Filters>);
            }}
            onResetFilters={handleResetFilters}
            canReset={canReset}
            visibleColumns={visibleColumns}
            onChangeColumns={handleToggleColumn}
            flowFilters={flowFilters}
            onFlowFilters={handleFlowFilters}
            orgUnitTypeOptions={orgUnitTypeOptions}
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
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 720 }}>
                <TableHeadCustom
                  order={table.order}
                  orderBy={table.orderBy}
                  headCells={TABLE_HEAD}
                  rowCount={dataFiltered.length}
                  numSelected={table.selected.length}
                  onSort={table.onSort}
                />

                <TableBody>
                  {dataFiltered
                    .slice(table.page * table.rowsPerPage, table.page * table.rowsPerPage + table.rowsPerPage)
                    .map((row) => (
                      <OrganizationalStructureTableRow
                        key={String(row.id)}
                        row={row}
                        selected={table.selected.includes(String(row.id))}
                        onSelectRow={() => table.onSelectRow(String(row.id))}
                        onDeleteRow={() => handleDeleteRow(String(row.id))}
                        onEditRow={() => {
                          setCurrentUnit(row);
                          openDrawer.onTrue();
                        }}
                        onToggleExpand={() => handleToggleExpand(String(row.id))}
                        expanded={expandedRows.has(String(row.id))}
                        visibleColumns={visibleColumns}
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

      <OrganizationalStructureCreateEditDrawer
        open={openDrawer.value}
        onClose={openDrawer.onFalse}
        onSuccess={loadData}
        currentOrganizationalUnit={currentUnit}
      />

      {renderConfirmDialog()}
    </>
  );
}

// ----------------------------------------------------------------------

type ApplyFilterProps = {
  inputData: FlattenedOrganizationalUnitRow[];
  filters: Filters;
  flowFilters: OrganizationalStructureFlowFilters;
};

function applyFilter({ inputData, filters, flowFilters }: ApplyFilterProps) {
  let data = inputData;

  if (flowFilters.type) {
    data = data.filter((item) => {
      const record = item as Record<string, unknown>;
      const fromId = record.orgUnitTypeId;
      const fromObj =
        record.orgUnitType && typeof record.orgUnitType === 'object'
          ? (record.orgUnitType as { id?: unknown }).id
          : undefined;

      const parsed = Number(fromId ?? fromObj);
      if (!Number.isFinite(parsed)) return true;
      return parsed === flowFilters.type;
    });
  }

  if (filters.name) {
    const query = filters.name.toLowerCase();
    data = data.filter((item) => {
      const directValues = [
        item.name,
        item.code,
        item.description,
        item.expectedResults,
        item.label,
        item.parent?.name,
      ];

      const byDirectValue = directValues.some((value) => String(value ?? '').toLowerCase().includes(query));
      if (byDirectValue) return true;

      const record = item as Record<string, unknown>;
      return ALL_COLUMNS.some(({ id }) => {
        const value = record[id];
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          return String(value).toLowerCase().includes(query);
        }
        if (value && typeof value === 'object' && 'name' in value) {
          const name = (value as { name?: unknown }).name;
          return String(name ?? '').toLowerCase().includes(query);
        }
        return false;
      });
    });
  }

  return data;
}
