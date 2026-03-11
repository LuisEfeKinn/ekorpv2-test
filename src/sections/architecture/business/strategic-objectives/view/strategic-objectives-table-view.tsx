'use client';

import type {
  IStrategicObjective,
  IStrategicObjectiveFilters,
  IStrategicObjectiveFlowNode,
} from 'src/types/architecture/strategic-objectives';

import dayjs from 'dayjs';
import { varAlpha } from 'minimal-shared/utils';
import { useBoolean , useSetState } from 'minimal-shared/hooks';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetObjectiveTypesPaginationService } from 'src/services/architecture/catalogs/objectiveTypes.service';
import {
  DeleteObjectivesService,
  GetObjectivesByIdService,
  GetObjectivesFlowService,
  UploadObjectivesExcelService,
  DownloadObjectivesExcelService,
  DownloadObjectivesTemplateService,
} from 'src/services/architecture/business/objectives.service';

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

import { StrategicObjectivesTableRow } from '../strategic-objectives-table-row';
import { StrategicObjectivesCreateForm } from '../strategic-objectives-create-form';
import { ALL_COLUMNS, DEFAULT_COLUMNS } from '../strategic-objectives-table-config';
import {
  type ObjectiveTypeOption,
  type ObjectiveFlowFilters,
  StrategicObjectivesTableToolbar,
} from '../strategic-objectives-table-toolbar';

// ----------------------------------------------------------------------

type FlowResponse = { data?: unknown };

const normalizeObjective = (raw: unknown): IStrategicObjective | null => {
  if (!raw) return null;
  if (raw && typeof raw === 'object' && 'data' in (raw as { data?: unknown })) {
    const nested = (raw as { data?: unknown }).data;
    if (nested && typeof nested === 'object') return nested as IStrategicObjective;
  }
  if (raw && typeof raw === 'object') return raw as IStrategicObjective;
  return null;
};

const normalizeFlowData = (raw: unknown): IStrategicObjectiveFlowNode[] => {
  if (Array.isArray(raw)) {
    return raw as IStrategicObjectiveFlowNode[];
  }
  if (raw && typeof raw === 'object' && Array.isArray((raw as FlowResponse).data)) {
    return (raw as FlowResponse).data as IStrategicObjectiveFlowNode[];
  }
  return [];
};

export function StrategicObjectivesTableView() {
  const { t } = useTranslate('architecture');
  const table = useTable();
  const openDrawer = useBoolean();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentObjective, setCurrentObjective] = useState<IStrategicObjective | null>(null);

  const [tableData, setTableData] = useState<IStrategicObjectiveFlowNode[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_COLUMNS);
  const [objectiveTypeOptions, setObjectiveTypeOptions] = useState<ObjectiveTypeOption[]>([]);
  const [flowFilters, setFlowFilters] = useState<ObjectiveFlowFilters>({
    type: null,
    objectiveLevel: null,
    startDate: null,
    endDate: null,
  });

  const handleFlowFilters = useCallback(
    (next: Partial<ObjectiveFlowFilters>) => {
      setFlowFilters((prev) => {
        const merged: ObjectiveFlowFilters = { ...prev, ...next };

        if (merged.startDate && merged.endDate && merged.endDate.isBefore(merged.startDate, 'day')) {
          toast.error('La fecha de fin no puede ser menor a la fecha de inicio');
          return { ...merged, endDate: null };
        }

        return merged;
      });
    },
    []
  );

  const flowParams = useMemo(() => {
    const params: Record<string, string | number | boolean | undefined> = {};

    if (flowFilters.type) params.type = flowFilters.type;
    if (flowFilters.objectiveLevel) params.objectiveLevel = flowFilters.objectiveLevel;
    if (flowFilters.startDate) params.startDate = dayjs(flowFilters.startDate).format('YYYY-MM-DD');
    if (flowFilters.endDate) params.endDate = dayjs(flowFilters.endDate).format('YYYY-MM-DD');

    return Object.keys(params).length ? params : undefined;
  }, [flowFilters.endDate, flowFilters.objectiveLevel, flowFilters.startDate, flowFilters.type]);

  const handleToggleColumn = useCallback((columnId: string) => {
    setVisibleColumns((prev) => {
      if (prev.includes(columnId)) {
        return prev.filter((id) => id !== columnId);
      }
      return [...prev, columnId];
    });
  }, []);

  const TABLE_HEAD = useMemo(() => {
    const dynamicColumns = ALL_COLUMNS.filter((col) => visibleColumns.includes(col.id));
    return [
      { id: '', width: 88 },
      ...dynamicColumns,
    ];
  }, [visibleColumns]);

  const STATUS_OPTIONS = useMemo(() => [
    { value: 'all', label: 'Todas' },
  ], []);

  const filters = useSetState<IStrategicObjectiveFilters & { status: string }>({
    name: '',
    status: 'all',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const handleFilterStatus = useCallback(
    (_event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      updateFilters({ status: newValue });
    },
    [table, updateFilters]
  );

  type FlattenedObjectiveRow = IStrategicObjective & {
    label: string;
    level: number;
    parentId?: number;
    hasChildren: boolean;
    children?: IStrategicObjectiveFlowNode[];
  };

  const flattenDataWithHierarchy = useCallback((data: IStrategicObjectiveFlowNode[], level = 0, parentId?: number): FlattenedObjectiveRow[] => {
    const flattened: FlattenedObjectiveRow[] = [];

    data.forEach((item) => {
      if (!item) return;
      
      const flatItem: FlattenedObjectiveRow = {
        ...item.data,
        id: item.id,
        label: item.label,
        level,
        parentId,
        hasChildren: (item.children?.length ?? 0) > 0,
        children: item.children
      };

      flattened.push(flatItem);

      if (expandedRows.has(Number(item.id)) && Array.isArray(item.children)) {
        flattened.push(...flattenDataWithHierarchy(item.children, level + 1, item.id));
      }
    });

    return flattened;
  }, [expandedRows]);

  const loadObjectiveTypes = useCallback(async () => {
    try {
      const res = await GetObjectiveTypesPaginationService({ page: 1, perPage: 1000 });
      const raw = res?.data;

      let list: unknown[] = [];
      if (Array.isArray(raw)) {
        list = raw.length > 0 && Array.isArray(raw[0]) ? raw[0] : raw;
      } else if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)) {
        list = (raw as { data: unknown[] }).data;
      }

      const opts: ObjectiveTypeOption[] = list
        .map((it) => {
          if (!it || typeof it !== 'object') return null;
          const obj = it as Record<string, unknown>;
          const id = Number(obj.id);
          const label = String(obj.typeName ?? obj.name ?? obj.code ?? `#${obj.id ?? ''}`);
          if (!Number.isFinite(id) || id <= 0) return null;
          return { value: id, label };
        })
        .filter((it): it is ObjectiveTypeOption => !!it);

      setObjectiveTypeOptions(opts);
    } catch {
      setObjectiveTypeOptions([]);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const response = await GetObjectivesFlowService(flowParams);

      const list = normalizeFlowData(response?.data);

      setTableData(list);
      setExpandedRows(new Set());
      setTotalItems(list.length); // Total root items or total items? For tree view, pagination is tricky.
    } catch (error) {
      console.error('Error loading objectives:', error);
      setTableData([]);
      setTotalItems(0);
    }
  }, [flowParams]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadObjectiveTypes();
  }, [loadObjectiveTypes]);

  const handleToggleExpand = (id: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleOpenCreate = useCallback(() => {
    setCurrentObjective(null);
    openDrawer.onTrue();
  }, [openDrawer]);

  const handleCloseDrawer = useCallback(() => {
    openDrawer.onFalse();
    setCurrentObjective(null);
  }, [openDrawer]);

  const handleEditRow = useCallback(
    async (id: number) => {
      setCurrentObjective(null);
      openDrawer.onTrue();

      try {
        const response = await GetObjectivesByIdService(id);
        const normalized = normalizeObjective(response?.data);
        if (normalized) {
          setCurrentObjective(normalized);
        } else {
          toast.error('No se pudo cargar el objetivo');
        }
      } catch (error) {
        console.error('Error loading objective:', error);
        toast.error('No se pudo cargar el objetivo');
      }
    },
    [openDrawer]
  );

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        await DeleteObjectivesService(id);
        loadData();
        toast.success('Objetivo estratégico eliminado con éxito');
      } catch (error) {
        console.error('Error deleting objective:', error);
        toast.error('No se pudo eliminar el objetivo');
      }
    },
    [loadData]
  );

  const handleDownloadExcel = useCallback(async () => {
    try {
      setDownloading(true);
      const params: Record<string, string | number | boolean> = {
        ...currentFilters,
        columns: visibleColumns.join(','),
      };

      if (flowFilters.type) params.objectiveTypeId = flowFilters.type;
      if (flowFilters.objectiveLevel) params.objectiveLevel = flowFilters.objectiveLevel;
      if (flowFilters.startDate) params.startDate = dayjs(flowFilters.startDate).format('YYYY-MM-DD');
      if (flowFilters.endDate) params.endDate = dayjs(flowFilters.endDate).format('YYYY-MM-DD');

      const response = await DownloadObjectivesExcelService(params);
      const blob = new Blob([response?.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'objectives.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading objectives excel:', error);
      toast.error(t('strategicObjectives.table.messages.downloadError', { defaultValue: 'Error al descargar el archivo' }));
    } finally {
      setDownloading(false);
    }
  }, [t, currentFilters, flowFilters.endDate, flowFilters.objectiveLevel, flowFilters.startDate, flowFilters.type, visibleColumns]);

  const handleDownloadTemplate = useCallback(async () => {
    try {
      const response = await DownloadObjectivesTemplateService();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'objectives_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error(t('strategicObjectives.table.messages.downloadError', { defaultValue: 'Error al descargar la plantilla' }));
    }
  }, [t]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleUploadFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (event.target) event.target.value = '';
    if (!file) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      const response: any = await UploadObjectivesExcelService(formData);
      const rawMessage = response?.data?.message ?? response?.data?.data?.message;
      const messageText = typeof rawMessage === 'string' ? rawMessage.toLowerCase() : '';

      if (messageText.includes('sin cambios') || messageText.includes('no changes')) {
        toast.info(t('strategicObjectives.table.messages.uploadNoChanges', { defaultValue: 'No hubo cambios en los objetivos' }));
      } else {
        toast.success(t('strategicObjectives.table.messages.uploadSuccess', { defaultValue: 'Archivo cargado exitosamente' }));
      }
      loadData();
    } catch (error) {
      console.error('Error uploading objectives excel:', error);
      toast.error(t('strategicObjectives.table.messages.uploadError', { defaultValue: 'Error al cargar el archivo' }));
    } finally {
      setUploading(false);
    }
  }, [loadData, t]);

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: currentFilters,
  });
  
  const flattenedData = flattenDataWithHierarchy(dataFiltered);

  const notFound = !dataFiltered.length && (!!currentFilters.name || currentFilters.status !== 'all');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Objetivos Estratégicos"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Arquitectura', href: paths.dashboard.architecture.strategicObjectivesTable },
          { name: 'Objetivos Estratégicos' },
        ]}
        action={
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.csv"
              style={{ display: 'none' }}
              onChange={handleUploadFileChange}
            />

            <Button
              onClick={handleDownloadTemplate}
              variant="outlined"
              startIcon={<Iconify icon="eva:cloud-download-fill" />}
            >
              {t('strategicObjectives.table.actions.downloadTemplate') || 'Descargar Plantilla'}
            </Button>

            <LoadingButton
              onClick={handleUploadClick}
              loading={uploading}
              variant="outlined"
              startIcon={<Iconify icon="eva:cloud-upload-fill" />}
            >
              {t('strategicObjectives.table.actions.upload', { defaultValue: 'Cargar' })}
            </LoadingButton>

            <LoadingButton
              onClick={handleDownloadExcel}
              loading={downloading}
              variant="outlined"
              startIcon={<Iconify icon="solar:download-bold" />}
            >
              {t('strategicObjectives.table.actions.download', { defaultValue: 'Descargar' })}
            </LoadingButton>

            <Button
              onClick={handleOpenCreate}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              {t('strategicObjectives.table.actions.create', { defaultValue: 'Crear' })}
            </Button>
          </Box>
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

        <StrategicObjectivesTableToolbar
          filters={currentFilters}
          onFilters={(name, value) => {
            table.onResetPage();
            updateFilters({ [name]: value });
          }}
          visibleColumns={visibleColumns}
          onChangeColumns={handleToggleColumn}
          objectiveTypeOptions={objectiveTypeOptions}
          flowFilters={flowFilters}
          onFlowFilters={handleFlowFilters}
        />

        <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 720 }}>
              <TableHeadCustom
                order={table.order}
                orderBy={table.orderBy}
                headCells={TABLE_HEAD}
                rowCount={flattenedData.length}
                numSelected={table.selected.length}
                onSort={table.onSort}
              />

              <TableBody>
                {flattenedData
                  .slice(
                    table.page * table.rowsPerPage,
                    table.page * table.rowsPerPage + table.rowsPerPage
                  )
                  .map((row) => (
                    <StrategicObjectivesTableRow
                      key={row.id}
                      row={row}
                      selected={table.selected.includes(String(row.id))}
                      onSelectRow={() => table.onSelectRow(String(row.id))}
                      onDeleteRow={() => handleDeleteRow(String(row.id))}
                      onEditRow={() => handleEditRow(row.id)}
                      onToggleExpand={() => handleToggleExpand(row.id)}
                      expanded={expandedRows.has(row.id)}
                      visibleColumns={visibleColumns}
                    />
                ))}

                <TableEmptyRows
                  height={table.dense ? 56 : 76}
                  emptyRows={emptyRows(table.page, table.rowsPerPage, flattenedData.length)}
                />

                <TableNoData notFound={notFound} />
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>

        <TablePaginationCustom
          page={table.page}
          dense={table.dense}
          count={flattenedData.length}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onChangeDense={table.onChangeDense}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>
      
      <Drawer
        open={openDrawer.value}
        onClose={handleCloseDrawer}
        anchor="right"
        PaperProps={{ sx: { width: { xs: 1, sm: 480, md: 640 } } }}
      >
        <StrategicObjectivesCreateForm
          currentObjective={currentObjective}
          onSuccess={() => {
            handleCloseDrawer();
            loadData();
          }}
          onCancel={handleCloseDrawer}
        />
      </Drawer>
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

type ApplyFilterProps = {
  inputData: IStrategicObjectiveFlowNode[];
  filters: IStrategicObjectiveFilters;
  comparator: (a: Record<string, string | number>, b: Record<string, string | number>) => number;
};

function applyFilter({ inputData, comparator, filters }: ApplyFilterProps) {
  const { name } = filters;

  const toComparable = (node: IStrategicObjectiveFlowNode): Record<string, string | number> => ({
    id: node.id,
    label: node.label,
    name: node.data.name,
    code: node.data.code,
  });

  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const aData = toComparable(a[0]);
    const bData = toComparable(b[0]);
    const order = comparator(aData, bData);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    const query = name.trim().toLowerCase();
    inputData = inputData.filter((item) => item.data.name.toLowerCase().includes(query));
  }

  return inputData;
}
