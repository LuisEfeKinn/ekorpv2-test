'use client';

import type { IJob } from 'src/types/architecture/jobs';

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

  const [tableData, setTableData] = useState<any[]>([]);
  const [currentJob, setCurrentJob] = useState<IJob | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_COLUMNS);
  const [searchColumn, setSearchColumn] = useState<string>('name');

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

  // Aplanar jerarquía para mostrar niveles y expansión
  const flattenDataWithHierarchy = useCallback((data: any[], level = 0, parentId?: string): any[] => {
    const flattened: any[] = [];

    data.forEach((item) => {
      // Handle both API response formats (node with data property or direct properties)
      const itemData = item.data || item;
      const itemId = String(item.id || itemData.id);
      
      const flatItem = {
        ...itemData,
        id: itemId,
        code: itemData.code || '',
        name: itemData.name || item.label || '',
        level,
        parentId,
        hasChildren: item.children && item.children.length > 0,
        isExpanded: expandedRows.has(itemId),
        children: item.children || []
      };

      flattened.push(flatItem);

      if (expandedRows.has(itemId) && item.children && item.children.length > 0) {
        const childrenFlattened = flattenDataWithHierarchy(item.children, level + 1, itemId);
        flattened.push(...childrenFlattened);
      }
    });

    return flattened;
  }, [expandedRows]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Use the flow service to get hierarchical data
      const response = await JobFlowService.getFlow();
      const data = response.data || [];
      const flattened = flattenDataWithHierarchy(data);
      setTableData(flattened);
      setTotalItems(flattened.length);
    } catch (error) {
      const message =
        (typeof error === 'string' && error) ||
        (typeof error === 'object' && error && 'message' in error && (error as any).message) ||
        t('positions.table.messages.loadError');
      toast.error(String(message));
      setTableData([]);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  }, [flattenDataWithHierarchy, t]);

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
      const params = {
        ...currentFilters,
        columns: visibleColumns.join(','),
        lang: currentLang,
      };
      const response = await DownloadJobsExcelService(params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'jobs.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(error);
      toast.error(t('positions.table.messages.downloadError') || 'Error downloading excel');
    } finally {
      setDownloading(false);
    }
  }, [t, currentFilters, visibleColumns, i18n.language]);

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

  const dataFiltered = useMemo(() => {
    const name = currentFilters.name?.toLowerCase().trim();
    if (!name) return tableData;
    return tableData.filter((item) => {
      const value = item[searchColumn as keyof typeof item];
      return String(value || '').toLowerCase().includes(name);
    });
  }, [currentFilters.name, tableData, searchColumn]);

  const notFound = !dataFiltered.length && !!currentFilters.name;

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
              href={paths.dashboard.architecture.positionsMap}
              variant="outlined"
              startIcon={<Iconify icon="solar:map-point-bold" />}
            >
              {t('Organigrama') || 'Organigrama'}
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
              {t('positions.table.actions.upload') || 'Cargar'}
            </LoadingButton>

            <LoadingButton
              variant="outlined"
              loading={downloading}
              startIcon={<Iconify icon="solar:download-bold" />}
              onClick={handleDownloadExcel}
            >
              {t('positions.table.actions.download') || 'Descargar'}
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
              {t('positions.table.actions.create') || 'Agregar Cargo'}
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
          searchColumn={searchColumn}
          onSearchColumnChange={setSearchColumn}
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
          count={totalItems}
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

