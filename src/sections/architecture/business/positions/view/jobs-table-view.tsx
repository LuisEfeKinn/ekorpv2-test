'use client';

import type { JobFlowNode } from 'src/types/job-flow';
import type { IJob } from 'src/types/architecture/jobs';
import type { JobTypeOption, JobFlowFilters } from '../jobs-table-toolbar';

import { varAlpha } from 'minimal-shared/utils';
import { useBoolean, useSetState } from 'minimal-shared/hooks';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { JobFlowService } from 'src/services/architecture/business/job-flow.service';
import {
  DeleteJobsService,
  UploadJobsService,
  DownloadJobsExcelService,
  DownloadJobsTemplateService,
  GetJobTypesPaginationService,
} from 'src/services/architecture/business/jobs.service';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  TableNoData,
  TableSkeleton,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { JobsTableRow } from '../jobs-table-row';
import { JobsTableToolbar } from '../jobs-table-toolbar';
import { JobsCreateEditDrawer } from '../jobs-create-edit-drawer';
import { ALL_COLUMNS, DEFAULT_COLUMNS } from '../jobs-table-config';

// ----------------------------------------------------------------------

export function JobsTableView() {
  const { t, i18n } = useTranslate('business');
  const table = useTable();
  const openDrawer = useBoolean();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [treeData, setTreeData] = useState<JobFlowNode[]>([]);
  const [currentJob, setCurrentJob] = useState<IJob | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_COLUMNS);
  const [jobTypeOptions, setJobTypeOptions] = useState<JobTypeOption[]>([]);
  const [flowFilters, setFlowFilters] = useState<JobFlowFilters>({
    headquarters: '',
    jobTypeId: null,
    actorStatus: null,
    supervises: '',
  });

  const handleToggleColumn = useCallback((columnId: string) => {
    setVisibleColumns((prev) => {
      if (prev.includes(columnId)) {
        return prev.filter((id) => id !== columnId);
      }
      return [...prev, columnId];
    });
  }, []);

  const STATUS_OPTIONS = useMemo(() => [
    { value: 'all', label: t('positions.table.all') },
  ], [t]);

  const TABLE_HEAD = useMemo(() => {
    const dynamicColumns = ALL_COLUMNS.filter((col) => visibleColumns.includes(col.id));
    return [
      { id: '', width: 88 },
      ...dynamicColumns,
    ];
  }, [visibleColumns]);

  const filters = useSetState<{ name: string; status: string }>({
    name: '',
    status: 'all',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const handleFlowFilters = useCallback((next: Partial<JobFlowFilters>) => {
    setFlowFilters((prev) => ({ ...prev, ...next }));
  }, []);

  const flowParams = useMemo(() => {
    const params: Record<string, string | number | boolean | undefined> = {};

    const name = currentFilters.name?.trim();
    if (name) params.name = name;

    const headquarters = flowFilters.headquarters?.trim();
    if (headquarters) params.headquarters = headquarters;

    const supervises = flowFilters.supervises?.trim();
    if (supervises) params.supervises = supervises;

    if (flowFilters.jobTypeId) params.jobTypeId = flowFilters.jobTypeId;
    if (flowFilters.actorStatus) params.actorStatus = flowFilters.actorStatus;

    return Object.keys(params).length ? params : undefined;
  }, [
    currentFilters.name,
    flowFilters.actorStatus,
    flowFilters.headquarters,
    flowFilters.jobTypeId,
    flowFilters.supervises,
  ]);

  // Aplanar jerarquía para mostrar niveles y expansión
  const flattenDataWithHierarchy = useCallback(
    (data: JobFlowNode[], level = 0, parentId?: string): any[] => {
      const flattened: any[] = [];

      data.forEach((item) => {
        const rawData = item.data ?? item;
        const itemData: Record<string, unknown> =
          rawData && typeof rawData === 'object'
            ? (rawData as unknown as Record<string, unknown>)
            : {};
        const itemId = String(item.id || itemData.id || '');

        const flatItem = {
          ...itemData,
          id: itemId,
          code: typeof itemData.code === 'string' ? itemData.code : '',
          name: typeof itemData.name === 'string' && itemData.name ? itemData.name : item.label || '',
          createdAt:
            (typeof itemData.createdAt === 'string' && itemData.createdAt) ||
            (typeof itemData.createdDate === 'string' && itemData.createdDate) ||
            '',
          level,
          parentId,
          hasChildren: Array.isArray(item.children) && item.children.length > 0,
          isExpanded: expandedRows.has(itemId),
          children: item.children || [],
        };

        flattened.push(flatItem);

        if (expandedRows.has(itemId) && Array.isArray(item.children) && item.children.length > 0) {
          const childrenFlattened = flattenDataWithHierarchy(item.children, level + 1, itemId);
          flattened.push(...childrenFlattened);
        }
      });

      return flattened;
    },
    [expandedRows]
  );

  const flattenedData = useMemo(() => flattenDataWithHierarchy(treeData), [flattenDataWithHierarchy, treeData]);

  const countNodes = useCallback((nodes: JobFlowNode[]): number => {
    let count = 0;
    nodes.forEach((n) => {
      count += 1;
      if (Array.isArray(n.children) && n.children.length > 0) {
        count += countNodes(n.children);
      }
    });
    return count;
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await JobFlowService.getFlow(flowParams);
      const data = response.data || [];
      setTreeData(data);
      setExpandedRows(new Set());
      setTotalItems(countNodes(data));
    } catch (error) {
      const message =
        (typeof error === 'string' && error) ||
        (typeof error === 'object' && error && 'message' in error && (error as any).message) ||
        t('positions.table.messages.loadError');
      toast.error(String(message));
      setTreeData([]);
      setExpandedRows(new Set());
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  }, [countNodes, flowParams, t]);

  // Manejar expandir/contraer
  const handleToggleExpand = useCallback((rowId: string, isExpanded: boolean) => {
    if (!isExpanded) {
      setExpandedRows(prev => {
        const next = new Set(prev);
        next.delete(rowId);
        return next;
      });
    } else {
      setExpandedRows(prev => new Set(prev).add(rowId));
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadJobTypes = useCallback(async () => {
    try {
      const res = await GetJobTypesPaginationService({ page: 1, perPage: 1000 });
      const raw = res?.data as unknown;

      let list: unknown[] = [];
      if (Array.isArray(raw)) {
        list = Array.isArray(raw[0]) ? (raw[0] as unknown[]) : raw;
      } else if (raw && typeof raw === 'object' && 'data' in raw) {
        const data = (raw as { data?: unknown }).data;
        list = Array.isArray(data) ? data : [];
      }

      const opts = (Array.isArray(list) ? list : [])
        .map((it) => {
          if (!it || typeof it !== 'object') return null;
          const obj = it as Record<string, unknown>;
          const id = Number(obj.id);
          const label = String(obj.name ?? obj.code ?? `#${obj.id ?? ''}`);
          if (!Number.isFinite(id) || id <= 0) return null;
          return { value: id, label };
        })
        .filter((it): it is JobTypeOption => !!it);

      setJobTypeOptions(opts);
    } catch {
      setJobTypeOptions([]);
    }
  }, []);

  useEffect(() => {
    loadJobTypes();
  }, [loadJobTypes]);

  const handleDownloadTemplate = useCallback(
    async () => {
      try {
        const response = await DownloadJobsTemplateService();
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'jobs_template.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (error) {
        console.error(error);
        toast.error(t('positions.table.messages.downloadError') || 'Error downloading template');
      }
    },
    [t]
  );

  const handleDownloadExcel = useCallback(async () => {
    try {
      setDownloading(true);
      const currentLang = i18n.language || 'es';
      const params: Record<string, string | number | boolean> = {
        ...currentFilters,
        columns: visibleColumns.join(','),
        lang: currentLang,
      };

      const name = currentFilters.name?.trim();
      if (name) params.name = name;

      const headquarters = flowFilters.headquarters?.trim();
      if (headquarters) params.headquarters = headquarters;

      const supervises = flowFilters.supervises?.trim();
      if (supervises) params.supervises = supervises;

      if (flowFilters.jobTypeId) params.jobTypeId = flowFilters.jobTypeId;
      if (flowFilters.actorStatus) params.actorStatus = flowFilters.actorStatus;

      const response = await DownloadJobsExcelService(params);
      const blob = new Blob([response?.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'jobs.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      toast.error(t('positions.table.messages.downloadError') || 'Error downloading excel');
    } finally {
      setDownloading(false);
    }
  }, [t, currentFilters, visibleColumns, i18n.language, flowFilters]);

  const handleUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        setUploading(true);
        await UploadJobsService(file);
        toast.success(t('positions.table.messages.uploadSuccess') || 'Upload success');
        loadData();
      } catch (error) {
        console.error(error);
        toast.error(t('positions.table.messages.uploadError') || 'Error uploading file');
      } finally {
        setUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [loadData, t]
  );

  const handleFilterStatus = useCallback(
    (_event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      updateFilters({ status: newValue });
    },
    [table, updateFilters]
  );

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        await DeleteJobsService(id);
        toast.success(t('positions.table.messages.deleteSuccess'));
        loadData();
      } catch (error) {
        const message =
          (typeof error === 'string' && error) ||
          (typeof error === 'object' && error && 'message' in error && (error as any).message) ||
          t('positions.table.messages.deleteError');
        toast.error(String(message));
      }
    },
    [loadData, t]
  );

  const handleEditRow = useCallback((row: IJob) => {
    setCurrentJob(row);
    openDrawer.onTrue();
  }, [openDrawer]);

  const hasAnyFilter = !!currentFilters.name?.trim() || !!flowFilters.headquarters?.trim() || !!flowFilters.supervises?.trim() || !!flowFilters.jobTypeId || !!flowFilters.actorStatus;
  const notFound = !flattenedData.length && hasAnyFilter;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('positions.table.title')}
        links={[
          { name: t('positions.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('positions.breadcrumbs.architecture'), href: paths.dashboard.architecture.positionsTable },
          { name: t('positions.breadcrumbs.positions') },
        ]}
        action={
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleUpload}
              accept=".xlsx, .xls"
            />

            <Button
              component={RouterLink}
              href={paths.dashboard.architecture.positionsMap}
              variant="outlined"
              startIcon={<Iconify icon="solar:map-point-bold" />}
            >
              {t('positions.table.actions.organigram', { defaultValue: 'Organigrama' })}
            </Button>

            <Button
              variant="outlined"
              startIcon={<Iconify icon="eva:cloud-download-fill" />}
              onClick={handleDownloadTemplate}
            >
              {t('positions.table.actions.downloadTemplate') || 'Descargar Plantilla'}
            </Button>

            <LoadingButton
              variant="outlined"
              loading={uploading}
              startIcon={<Iconify icon="eva:cloud-upload-fill" />}
              onClick={() => fileInputRef.current?.click()}
            >
              {t('positions.table.actions.upload', { defaultValue: 'Cargar Plantilla' })}
            </LoadingButton>

            <LoadingButton
              variant="outlined"
              loading={downloading}
              startIcon={<Iconify icon="solar:download-bold" />}
              onClick={handleDownloadExcel}
            >
              {t('positions.table.actions.download', { defaultValue: 'Exportar Excel' })}
            </LoadingButton>

            <Button
              component={RouterLink}
              href="#"
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={(e) => {
                e.preventDefault();
                setCurrentJob(undefined);
                openDrawer.onTrue();
              }}
            >
              {t('positions.table.actions.create', { defaultValue: 'Agregar Cargo' })}
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

        <JobsTableToolbar
          filters={{ name: currentFilters.name }}
          onFilters={(name, value) => {
            table.onResetPage();
            updateFilters({ [name]: value });
          }}
          visibleColumns={visibleColumns}
          onChangeColumns={handleToggleColumn}
          jobTypeOptions={jobTypeOptions}
          flowFilters={flowFilters}
          onFlowFilters={handleFlowFilters}
        />

        <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
              <TableHeadCustom
                headCells={TABLE_HEAD}
                rowCount={flattenedData.length}
                numSelected={table.selected.length}
              />

              <TableBody>
                {isLoading ? (
                  <TableSkeleton rowCount={8} cellCount={4} />
                ) : (
                  flattenedData
                    .slice(table.page * table.rowsPerPage, table.page * table.rowsPerPage + table.rowsPerPage)
                    .map((row) => (
                      <JobsTableRow
                        key={row.id}
                        row={row}
                        selected={table.selected.includes(String(row.id))}
                        onSelectRow={() => table.onSelectRow(String(row.id))}
                        onDeleteRow={() => handleDeleteRow(String(row.id))}
                        onEditRow={() => handleEditRow(row)}
                        onToggleExpand={handleToggleExpand}
                        visibleColumns={visibleColumns}
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
          count={flattenedData.length}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onChangeDense={table.onChangeDense}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>

      <JobsCreateEditDrawer
        open={openDrawer.value}
        onClose={openDrawer.onFalse}
        currentJob={currentJob}
        onLoadData={loadData}
      />
    </DashboardContent>
  );
}
