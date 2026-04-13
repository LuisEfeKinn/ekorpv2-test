'use client';

import type { TableHeadCellProps } from 'src/components/table';
import type { IUserManagement, IUserManagementTableFilters } from 'src/types/employees';

import { varAlpha } from 'minimal-shared/utils';
import { useBoolean, useSetState } from 'minimal-shared/hooks';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import AlertTitle from '@mui/material/AlertTitle';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  DeleteUserManagmentService,
  DownloadEmployeesExcelService,
  UploadEmployeesTemplateService,
  DownloadEmployeesTemplateService,
  GetUserManagmentPaginationService,
} from 'src/services/employees/user-managment.service';

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

import { UserManagmentTableRow } from '../user-managment-table-row';
import { UserManagmentTableToolbar } from '../user-managment-table-toolbar';
import { UserManagmentTableFiltersResult } from '../user-managment-table-filters-result';


// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export function UserManagmentView() {
  const { t: tUsers } = useTranslate('employees');
  const { t: tCommon } = useTranslate('common');
  const table = useTable();
  const confirmDialog = useBoolean();
  const uploadDrawer = useBoolean();
  const detailsDrawer = useBoolean();

  const [tableData, setTableData] = useState<IUserManagement[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [detailsRow, setDetailsRow] = useState<IUserManagement | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);

  const STATUS_OPTIONS = useMemo(() => [
    { value: 'all', label: tUsers('user-management.table.filters.all') },
  ], [tUsers]);

  const FIXED_COLUMNS = useMemo(
    () => [
      { id: '', width: 88 },
      { id: 'fullName', label: tUsers('user-management.table.columns.fullName'), sortField: 'employee.firstName' },
      { id: 'username', label: tUsers('user-management.table.columns.username'), width: 160 },
      { id: 'immediateSupervisor', label: tUsers('user-management.table.columns.immediateSupervisor'), width: 220 },
      { id: 'position', label: tUsers('user-management.table.columns.position'), width: 180 },
      { id: 'skill', label: tUsers('user-management.table.columns.skill'), width: 200 },
      { id: 'location', label: tUsers('user-management.table.columns.location'), width: 180, sortField: 'country.name' },
      { id: 'billingRate', label: tUsers('user-management.table.columns.billingRate'), width: 150 },
      { id: 'weeklyHours', label: tUsers('user-management.table.columns.weeklyHours'), width: 120 },
      { id: 'startedWorkOn', label: tUsers('user-management.table.columns.startedWorkOn'), width: 120, sortField: 'employee.startedWorkOn' },
      { id: 'language', label: tUsers('user-management.table.columns.language'), width: 120 },
      { id: 'timezone', label: tUsers('user-management.table.columns.timezone'), width: 180 },
    ],
    [tUsers]
  );

  const fixedColumnIds = useMemo(() => new Set(FIXED_COLUMNS.map((c) => c.id)), [FIXED_COLUMNS]);

  const availableExtraColumns = useMemo(() => {
    const seed: string[] = [
      'id',
      'userId',
      'documentId',
      'tel',
      'postalCode',
      'updatedAt',
      'address',
      'billingRatePerHour',
      'minimumBillingRatePerHour',
      'recurringWeeklyLimitHours',
      'organizationalUnitId',
      'municipalityId',
      'paymentPeriod',
      'coin',
      'employmentType',
      'skills',
      'competencyKm',
      'location',
    ];

    const dynamicKeys = tableData.length ? Object.keys(tableData[0] as Record<string, unknown>) : [];
    const merged = Array.from(new Set([...seed, ...dynamicKeys]));
    return merged
      .filter((key) => !fixedColumnIds.has(key) && key !== 'createdAt' && key !== 'deletedAt')
      .sort((a, b) => a.localeCompare(b));
  }, [fixedColumnIds, tableData]);

  const ALL_COLUMNS: Array<{ id: string; label: string }> = useMemo(() => {
    const fixed = FIXED_COLUMNS.filter((c) => c.id).map((c) => ({ id: c.id, label: c.label ?? c.id }));
    const extras = availableExtraColumns.map((id) => ({
      id,
      label: tUsers(`user-management.table.extraColumns.${id}`, { defaultValue: id }),
    }));
    return [...fixed, ...extras];
  }, [FIXED_COLUMNS, availableExtraColumns, tUsers]);

  const TABLE_HEAD: TableHeadCellProps[] = useMemo(() => {
    const extras: TableHeadCellProps[] = visibleColumns
      .filter((id) => !fixedColumnIds.has(id))
      .map((id) => ({ id, label: tUsers(`user-management.table.extraColumns.${id}`, { defaultValue: id }), width: 180 }));
    return [...FIXED_COLUMNS, ...extras];
  }, [FIXED_COLUMNS, fixedColumnIds, tUsers, visibleColumns]);

  const handleChangeColumns = useCallback((columnId: string) => {
    if (fixedColumnIds.has(columnId)) return;
    setVisibleColumns((prev) => (prev.includes(columnId) ? prev.filter((id) => id !== columnId) : [...prev, columnId]));
  }, [fixedColumnIds]);

  const handleOpenDetails = useCallback(
    (row: IUserManagement) => {
      setDetailsRow(row);
      detailsDrawer.onTrue();
    },
    [detailsDrawer]
  );

  const handleCloseDetails = useCallback(() => {
    detailsDrawer.onFalse();
    setDetailsRow(null);
  }, [detailsDrawer]);

  const filters = useSetState<IUserManagementTableFilters>({
    name: '',
    status: 'all',
    positionId: '',
    skillId: '',
    organizationalUnitId: '',
    countryId: '',
    regionId: ''
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const [serverOrderBy, setServerOrderBy] = useState<string>('');
  const [serverOrder, setServerOrder] = useState<'asc' | 'desc'>('asc');

  const handleServerSort = useCallback((sortField: string, direction: 'asc' | 'desc') => {
    table.onResetPage();
    setServerOrderBy(sortField);
    setServerOrder(direction);
  }, [table]);


  // Función para cargar datos
  const loadData = useCallback(async () => {
    try {
      const params = {
        page: table.page + 1, // Backend uses 1-based pagination
        perPage: table.rowsPerPage,
        search: currentFilters.name || undefined,
        positionId: currentFilters.positionId || undefined,
        skillId: currentFilters.skillId || undefined,
        organizationalUnitId: currentFilters.organizationalUnitId || undefined,
        countryId: currentFilters.countryId || undefined,
        regionId: currentFilters.regionId || undefined,
        order: serverOrderBy ? `${serverOrderBy}:${serverOrder}` : undefined,
      };

      const response = await GetUserManagmentPaginationService(params);
      // La respuesta tiene la estructura: { statusCode, data: IUserManagement[], meta: {}, message }
      const responseData = response.data;
      setTableData(responseData.data || []);
      setTotalItems(responseData.meta?.itemCount || 0);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error(tUsers('user-management.messages.error.loading'));
      setTableData([]);
      setTotalItems(0);
    }
  }, [table.page, table.rowsPerPage, currentFilters.name, currentFilters.positionId, currentFilters.skillId, currentFilters.organizationalUnitId, currentFilters.countryId, currentFilters.regionId, serverOrderBy, serverOrder, tUsers]);

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

  const canReset = !!currentFilters.name || currentFilters.status !== 'all' || !!currentFilters.positionId || !!currentFilters.skillId || !!currentFilters.organizationalUnitId || !!currentFilters.countryId || !!currentFilters.regionId;
  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        const response = await DeleteUserManagmentService(id);

        if (response.data.statusCode === 200) {
          toast.success(tUsers('user-management.messages.success.deleted'));
          loadData(); // Recargar datos
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error(tUsers('user-management.messages.error.deleting'));
      }
    },
    [loadData, tUsers]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      // Eliminar múltiples elementos
      const deletePromises = table.selected.map(id => DeleteUserManagmentService(id));
      await Promise.all(deletePromises);

      toast.success(tUsers('user-management.messages.success.deletedMultiple'));
      table.setSelected([]);
      loadData(); // Recargar datos
    } catch (error) {
      console.error('Error deleting users:', error);
      toast.error(tUsers('user-management.messages.error.deletingMultiple'));
    }
  }, [table, loadData, tUsers]);

  const handleFilterStatus = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      updateFilters({ status: newValue });
    },
    [updateFilters, table]
  );

  const handleResetFilters = useCallback(() => {
    table.onResetPage();
    updateFilters({ name: '', status: 'all', positionId: '', skillId: '', organizationalUnitId: '', countryId: '', regionId: '' });
  }, [updateFilters, table]);

  const handleDownloadExcel = useCallback(async () => {
    try {
      setDownloading(true);

      const activeColumnIds = Array.from(
        new Set([
          ...FIXED_COLUMNS.map((c) => c.id).filter(Boolean),
          ...visibleColumns.filter((id) => !fixedColumnIds.has(id)),
        ])
      );

      const columnMap: Record<string, string[]> = {
        fullName: ['id', 'userId', 'firstName', 'firstLastName', 'email'],
        username: ['username'],
        immediateSupervisor: ['immediateSupervisorId.name'],
        position: ['position.name'],
        skill: ['skillId'],
        location: ['location.country.name'],
        billingRate: ['minimumBillingRatePerHour'],
        weeklyHours: ['recurringWeeklyLimitHours'],
        startedWorkOn: ['startedWorkOn'],
        language: ['language'],
        timezone: ['timezone'],
        coin: ['coin.name'],
        paymentPeriod: ['paymentPeriod.name'],
        employmentType: ['employmentType.name'],
      };

      const columns = Array.from(
        new Set(
          activeColumnIds.flatMap((id) => {
            const mapped = columnMap[id];
            if (mapped) return mapped;
            return [id];
          })
        )
      ).join(',');

      const params: Record<string, string | number | boolean> = {
        ...(currentFilters.positionId ? { positionId: currentFilters.positionId } : {}),
        ...(currentFilters.skillId ? { skillId: currentFilters.skillId } : {}),
        ...(currentFilters.organizationalUnitId ? { organizationalUnitId: currentFilters.organizationalUnitId } : {}),
        ...(currentFilters.countryId ? { countryId: currentFilters.countryId } : {}),
        ...(currentFilters.regionId ? { regionId: currentFilters.regionId } : {}),
        ...(serverOrderBy ? { order: `${serverOrderBy}:${serverOrder}` } : {}),
        ...(currentFilters.name ? { search: currentFilters.name } : {}),
        ...(columns ? { columns } : {}),
      };

      const response = await DownloadEmployeesExcelService(params);
      const blob = new Blob([response?.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'employees.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading employees excel:', error);
      toast.error(tUsers('user-management.table.messages.downloadError'));
    } finally {
      setDownloading(false);
    }
  }, [FIXED_COLUMNS, currentFilters, fixedColumnIds, serverOrder, serverOrderBy, tUsers, visibleColumns]);

  const handleDownloadTemplate = useCallback(async () => {
    try {
      const response = await DownloadEmployeesTemplateService();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'employees_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error(tUsers('user-management.table.messages.downloadTemplateError'));
    }
  }, [tUsers]);

  const handleUploadTemplate = useCallback(
    async (file: File) => {
      try {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        await UploadEmployeesTemplateService(formData);
        toast.success(tUsers('user-management.table.messages.uploadSuccess'));
        loadData();
      } catch (error) {
        console.error('Error uploading template:', error);
        throw error;
      } finally {
        setUploading(false);
      }
    },
    [loadData, tUsers]
  );

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title={tUsers('user-management.dialogs.delete.title')}
      content={
        <>
          {tUsers('user-management.dialogs.delete.contentMultiple', { count: table.selected.length })}
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
          {tCommon('actions.delete')}
        </Button>
      }
    />
  );

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading={tUsers('user-management.title')}
          links={[
            { name: tUsers('user-management.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: tUsers('user-management.title') },
          ]}
          action={
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <LoadingButton
                onClick={uploadDrawer.onTrue}
                disabled={uploading}
                variant="outlined"
                startIcon={<Iconify icon="eva:cloud-upload-fill" />}
              >
                {tUsers('user-management.table.actions.uploadTemplate')}
              </LoadingButton>

              <LoadingButton
                onClick={handleDownloadExcel}
                loading={downloading}
                variant="outlined"
                startIcon={<Iconify icon="solar:download-bold" />}
              >
                {tUsers('user-management.table.actions.downloadExcel')}
              </LoadingButton>

              <Button
                component={RouterLink}
                href={paths.dashboard.employees.userManagmentCreate}
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
              >
                {tUsers('user-management.actions.add')}
              </Button>
            </Box>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <EmployeesUploadTemplateDrawer
          open={uploadDrawer.value}
          uploading={uploading}
          onClose={uploadDrawer.onFalse}
          onDownloadTemplate={handleDownloadTemplate}
          onUpload={handleUploadTemplate}
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

          <UserManagmentTableToolbar
            filters={currentFilters}
            allColumns={ALL_COLUMNS}
            fixedColumnIds={fixedColumnIds}
            visibleColumns={visibleColumns}
            onChangeColumns={handleChangeColumns}
            onFilters={(name, value) => {
              table.onResetPage();
              updateFilters({ [name]: value });
            }}
          />

          {canReset && (
            <UserManagmentTableFiltersResult
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
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 1440 }}>
                <TableHeadCustom
                  headCells={TABLE_HEAD}
                  rowCount={dataFiltered.length}
                  numSelected={table.selected.length}
                  serverOrderBy={serverOrderBy}
                  serverOrder={serverOrder}
                  onServerSort={handleServerSort}
                // onSelectAllRows={(checked) =>
                //   table.onSelectAllRows(
                //     checked,
                //     dataFiltered.map((row) => row.id)
                //   )
                // }
                />

                <TableBody>
                  {dataFiltered
                    .map((row) => (
                      <UserManagmentTableRow
                        key={row.id}
                        row={row}
                        extraColumns={visibleColumns}
                        selected={table.selected.includes(row.id)}
                        onSelectRow={() => table.onSelectRow(row.id)}
                        onDeleteRow={() => handleDeleteRow(row.id)}
                        onViewDetails={() => handleOpenDetails(row)}
                        editHref={`${paths.dashboard.employees.userManagmentEdit(row.id)}`}
                      />
                    ))}

                  <TableEmptyRows
                    height={table.dense ? 56 : 76}
                    emptyRows={emptyRows(0, table.rowsPerPage, dataFiltered.length)}
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

      <EmployeeDetailsDrawer
        open={detailsDrawer.value}
        row={detailsRow}
        onClose={handleCloseDetails}
      />
    </>
  );
}

// ----------------------------------------------------------------------

type EmployeesUploadTemplateDrawerProps = {
  open: boolean;
  uploading: boolean;
  onClose: () => void;
  onDownloadTemplate: () => void;
  onUpload: (file: File) => Promise<void>;
};

const MAX_UPLOAD_ERROR_ITEMS = 50;

function EmployeesUploadTemplateDrawer({
  open,
  uploading,
  onClose,
  onDownloadTemplate,
  onUpload,
}: EmployeesUploadTemplateDrawerProps) {
  const { t: tUsers } = useTranslate('employees');
  const [file, setFile] = useState<File | null>(null);
  const [drawerError, setDrawerError] = useState<EmployeesUploadDrawerError | null>(null);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setDrawerError(null);
    }
  }, [open]);

  const accept = useMemo(
    () => ({
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    }),
    []
  );

  const handleDropRejected = useCallback(
    (rejections: FileRejection[]) => {
      const first = rejections[0];
      const firstError = first?.errors?.[0];
      const code = firstError?.code;

      if (code === 'too-many-files') {
        const msg = tUsers('user-management.table.uploadDrawer.errors.tooManyFiles');
        setDrawerError({ kind: 'message', message: msg });
        toast.error(msg);
        return;
      }

      if (code === 'file-invalid-type') {
        const msg = tUsers('user-management.table.uploadDrawer.errors.invalidType');
        setDrawerError({ kind: 'message', message: msg });
        toast.error(msg);
        return;
      }

      const msg = tUsers('user-management.table.uploadDrawer.errors.generic');
      setDrawerError({ kind: 'message', message: msg });
      toast.error(msg);
    },
    [tUsers]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    multiple: false,
    maxFiles: 1,
    accept,
    disabled: uploading,
    onDropAccepted: (files) => {
      setFile(files[0] ?? null);
      setDrawerError(null);
    },
    onDropRejected: handleDropRejected,
  });

  const handleClose = useCallback(() => {
    if (!uploading) onClose();
  }, [onClose, uploading]);

  const handleConfirmUpload = useCallback(async () => {
    if (!file) {
      const msg = tUsers('user-management.table.uploadDrawer.errors.noFile');
      setDrawerError({ kind: 'message', message: msg });
      toast.error(msg);
      return;
    }
    try {
      await onUpload(file);
      onClose();
    } catch (uploadError) {
      const parsed = getEmployeesUploadError(uploadError, tUsers);
      setDrawerError(parsed);
      toast.error(parsed.kind === 'backend' ? parsed.title : parsed.message);
    }
  }, [file, onClose, onUpload, tUsers]);

  return (
    <Drawer
      open={open}
      anchor="right"
      onClose={handleClose}
      PaperProps={{ sx: { width: { xs: 1, sm: 520, md: 620 }, display: 'flex', flexDirection: 'column' } }}
    >
      <Box
        sx={{
          px: 3,
          py: 2,
          position: 'relative',
          borderBottom: (theme) => `1px solid ${theme.vars.palette.divider}`,
        }}
      >
        <Typography variant="h6">{tUsers('user-management.table.uploadDrawer.title')}</Typography>
        <IconButton
          aria-label={tUsers('user-management.table.uploadDrawer.actions.close')}
          onClick={handleClose}
          disabled={uploading}
          sx={{ position: 'absolute', right: 12, top: 12 }}
        >
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </Box>

      <Box sx={{ px: 3, py: 2.5, overflow: 'auto', flex: '1 1 auto' }}>
        <Box
          sx={[
            (theme) => ({
              display: 'grid',
              gap: 1,
              p: 2,
              borderRadius: 1.5,
              border: `1px solid ${varAlpha(theme.vars.palette.info.mainChannel, 0.28)}`,
              backgroundColor: varAlpha(theme.vars.palette.info.mainChannel, 0.1),
              color: theme.vars.palette.info.darker,
            }),
          ]}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Iconify icon="solar:info-circle-bold" />
            <Typography variant="subtitle2">{tUsers('user-management.table.uploadDrawer.instructions.title')}</Typography>
          </Stack>

          <Box
            component="ul"
            sx={{
              m: 0,
              pl: 2,
              display: 'grid',
              gap: 0.5,
              typography: 'body2',
              color: 'text.secondary',
            }}
          >
            <li>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                {tUsers('user-management.table.uploadDrawer.instructions.excelHeadersIntro')}
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                {tUsers('user-management.table.uploadDrawer.instructions.excelHeadersList')}
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                {tUsers('user-management.table.uploadDrawer.instructions.jobOrgUnitNote')}
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                {tUsers('user-management.table.uploadDrawer.instructions.downloadTemplate')}
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                {tUsers('user-management.table.uploadDrawer.instructions.fillAndSave')}
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                {tUsers('user-management.table.uploadDrawer.instructions.dragOrSelect')}
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                {tUsers('user-management.table.uploadDrawer.instructions.clickUpload')}
              </Typography>
            </li>
          </Box>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Box
            {...getRootProps()}
            sx={[
              (theme) => ({
                p: 4,
                borderRadius: 2,
                textAlign: 'center',
                outline: 'none',
                cursor: uploading ? 'default' : 'pointer',
                border: `dashed 1px ${theme.vars.palette.divider}`,
                backgroundColor: theme.vars.palette.background.neutral,
                transition: theme.transitions.create(['border-color', 'background-color'], {
                  duration: theme.transitions.duration.shorter,
                }),
                ...(isDragActive && {
                  borderColor: theme.vars.palette.primary.main,
                  backgroundColor: varAlpha(theme.vars.palette.primary.mainChannel, 0.08),
                }),
                ...((isDragReject || !!drawerError) && {
                  borderColor: theme.vars.palette.error.main,
                  backgroundColor: varAlpha(theme.vars.palette.error.mainChannel, 0.08),
                }),
              }),
            ]}
          >
            <input {...getInputProps()} />

            <Stack spacing={1.25} alignItems="center">
              <Iconify icon="eva:cloud-upload-fill" width={28} />

              <Typography variant="subtitle1">
                {file
                  ? tUsers('user-management.table.uploadDrawer.drop.selectedTitle')
                  : tUsers('user-management.table.uploadDrawer.drop.title')}
              </Typography>

              {file ? (
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ flexWrap: 'wrap', justifyContent: 'center' }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {file.name}
                  </Typography>
                  <Button
                    size="small"
                    variant="text"
                    onClick={(event) => {
                      event.stopPropagation();
                      setFile(null);
                      setDrawerError(null);
                    }}
                    disabled={uploading}
                    sx={{ textTransform: 'none' }}
                  >
                    {tUsers('user-management.table.uploadDrawer.actions.remove')}
                  </Button>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {tUsers('user-management.table.uploadDrawer.drop.subtitle')}
                </Typography>
              )}

              <Typography variant="caption" color="text.disabled">
                {tUsers('user-management.table.uploadDrawer.drop.formats')}
              </Typography>
            </Stack>
          </Box>

          {!!drawerError && (
            <Box sx={{ mt: 1.5 }}>
              {drawerError.kind === 'backend' ? (
                <Box sx={{ display: 'grid', gap: 1 }}>
                  <Alert severity="error" variant="outlined">
                    <AlertTitle>
                      {tUsers('user-management.table.uploadDrawer.validation.title', {
                        defaultValue: 'Errores de validación',
                      })}
                    </AlertTitle>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                      {drawerError.title}
                    </Typography>
                    {drawerError.truncated && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                        {tUsers('user-management.table.uploadDrawer.validation.backendTruncatedNotice')}
                      </Typography>
                    )}
                  </Alert>

                  <Box
                    sx={{
                      borderRadius: 1.5,
                      border: (theme) => `1px solid ${theme.vars.palette.divider}`,
                      overflow: 'hidden',
                    }}
                  >
                    <TableContainer sx={{ maxHeight: 260 }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ width: 88 }}>
                              {tUsers('user-management.table.uploadDrawer.validation.rowLabel')}
                            </TableCell>
                            <TableCell sx={{ width: 220 }}>
                              {tUsers('user-management.table.uploadDrawer.validation.fieldLabel', {
                                defaultValue: 'Campo',
                              })}
                            </TableCell>
                            <TableCell>
                              {tUsers('user-management.table.uploadDrawer.validation.messageLabel', {
                                defaultValue: 'Mensaje',
                              })}
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {drawerError.errors.slice(0, MAX_UPLOAD_ERROR_ITEMS).map((item) => (
                            <TableRow key={`${item.row}-${item.field}-${item.message}`}>
                              <TableCell>{item.row}</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>{item.field}</TableCell>
                              <TableCell>{item.message}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>

                  {drawerError.errors.length > MAX_UPLOAD_ERROR_ITEMS && (
                    <Typography variant="caption" color="text.secondary">
                      {tUsers('user-management.table.uploadDrawer.validation.truncatedListNotice', {
                        total: drawerError.errors.length,
                      })}
                    </Typography>
                  )}
                </Box>
              ) : (
                <Alert severity="error" variant="outlined">
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                    {drawerError.message}
                  </Typography>
                </Alert>
              )}
            </Box>
          )}

          <Button
            variant="outlined"
            startIcon={<Iconify icon="eva:cloud-download-fill" />}
            onClick={onDownloadTemplate}
            disabled={uploading}
            sx={{ mt: 1.5, width: 1 }}
          >
            {tUsers('user-management.table.actions.downloadTemplate')}
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          px: 3,
          py: 2,
          borderTop: (theme) => `1px solid ${theme.vars.palette.divider}`,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 1.25,
        }}
      >
        <Button onClick={handleClose} disabled={uploading} color="inherit" variant="outlined">
          {tUsers('user-management.table.uploadDrawer.actions.cancel')}
        </Button>
        <LoadingButton variant="contained" loading={uploading} onClick={handleConfirmUpload} disabled={!file}>
          {tUsers('user-management.table.uploadDrawer.actions.upload')}
        </LoadingButton>
      </Box>
    </Drawer>
  );
}

// ----------------------------------------------------------------------

type EmployeeDetailsDrawerProps = {
  open: boolean;
  row: IUserManagement | null;
  onClose: () => void;
};

function EmployeeDetailsDrawer({ open, row, onClose }: EmployeeDetailsDrawerProps) {
  const { t: tUsers } = useTranslate('employees');

  const fullName = useMemo(() => {
    if (!row) return '';
    return [row.firstName, row.secondName, row.firstLastName, row.secondLastName].filter(Boolean).join(' ');
  }, [row]);

  const json = useMemo(() => (row ? JSON.stringify(row, null, 2) : ''), [row]);

  return (
    <Drawer
      open={open}
      anchor="right"
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: 1, sm: 520, md: 620 }, display: 'flex', flexDirection: 'column' } }}
    >
      <Box
        sx={{
          px: 3,
          py: 2,
          position: 'relative',
          borderBottom: (theme) => `1px solid ${theme.vars.palette.divider}`,
        }}
      >
        <Typography variant="h6">
          {tUsers('user-management.detailsDrawer.title')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {fullName || row?.username || row?.email || ''}
        </Typography>
        <IconButton
          aria-label={tUsers('user-management.detailsDrawer.actions.close')}
          onClick={onClose}
          sx={{ position: 'absolute', right: 12, top: 12 }}
        >
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </Box>

      <Box sx={{ px: 3, py: 2.5, overflow: 'auto', flex: '1 1 auto' }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {tUsers('user-management.detailsDrawer.sections.raw')}
        </Typography>
        <Box
          component="pre"
          sx={{
            m: 0,
            p: 2,
            borderRadius: 1.5,
            typography: 'body2',
            bgcolor: 'background.neutral',
            overflow: 'auto',
          }}
        >
          {json}
        </Box>
      </Box>
    </Drawer>
  );
}

// ----------------------------------------------------------------------

type ApplyFilterProps = {
  inputData: IUserManagement[];
  filters: IUserManagementTableFilters;
  comparator: (a: any, b: any) => number;
};

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

type EmployeesUploadValidationErrorItem = {
  row: number;
  field: string;
  message: string;
};

type EmployeesUploadValidationErrorResponse = {
  statusCode?: number;
  message?: string;
  errors?: EmployeesUploadValidationErrorItem[];
  truncated?: boolean;
};

type EmployeesUploadDrawerError =
  | { kind: 'message'; message: string }
  | { kind: 'backend'; title: string; errors: EmployeesUploadValidationErrorItem[]; truncated: boolean };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getEmployeesUploadError(error: unknown, tUsers: TranslateFn): EmployeesUploadDrawerError {
  const fallback = tUsers('user-management.table.uploadDrawer.errors.uploadFailed');

  if (typeof error === 'string') {
    return { kind: 'message', message: error || fallback };
  }

  if (!isRecord(error)) {
    return { kind: 'message', message: fallback };
  }

  const payloadSource: Record<string, unknown> = (() => {
    if ('errors' in error || 'truncated' in error || 'statusCode' in error || 'message' in error) {
      return error;
    }

    const response = error.response;
    if (isRecord(response) && isRecord(response.data)) {
      return response.data;
    }

    return error;
  })();

  const payload: EmployeesUploadValidationErrorResponse = {
    statusCode: typeof payloadSource.statusCode === 'number' ? payloadSource.statusCode : undefined,
    message: typeof payloadSource.message === 'string' ? payloadSource.message : undefined,
    truncated: typeof payloadSource.truncated === 'boolean' ? payloadSource.truncated : undefined,
    errors: Array.isArray(payloadSource.errors)
      ? payloadSource.errors
          .map((item): EmployeesUploadValidationErrorItem | null => {
            if (!isRecord(item)) return null;
            const row = typeof item.row === 'number' ? item.row : Number(item.row);
            const field = typeof item.field === 'string' ? item.field : '';
            const message = typeof item.message === 'string' ? item.message : '';
            if (!Number.isFinite(row) || !field || !message) return null;
            return { row, field, message };
          })
          .filter((item): item is EmployeesUploadValidationErrorItem => item !== null)
      : undefined,
  };

  const title = payload.message ?? fallback;
  const errors = payload.errors ?? [];
  const truncated = payload.truncated ?? false;

  if (errors.length) {
    return { kind: 'backend', title, errors, truncated };
  }

  return { kind: 'message', message: title };
}

function applyFilter({ inputData, comparator, filters }: ApplyFilterProps) {
  const { name, status, positionId, skillId, organizationalUnitId, countryId, regionId } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter(
      (item) => {
        const fullName = item.fullName?.toLowerCase() || `${item.firstName || ''} ${item.secondName || ''} ${item.firstLastName || ''} ${item.secondLastName || ''}`.trim().toLowerCase();
        const email = item.email?.toLowerCase() || '';
        const username = item.username?.toLowerCase() || '';
        const supervisorName = item.immediateSupervisorId?.name?.toLowerCase() || '';
        const searchTerm = name.toLowerCase();
        return fullName.indexOf(searchTerm) !== -1 || email.indexOf(searchTerm) !== -1 || username.indexOf(searchTerm) !== -1 || supervisorName.indexOf(searchTerm) !== -1;
      }
    );
  }

  if (status !== 'all') {
    // TODO: Implement status filtering when the data model includes a status field
  }

  if (positionId) {
    inputData = inputData.filter((item) => item.position?.id === positionId);
  }

  if (skillId) {
    inputData = inputData.filter((item) => 
      item.skills?.some((skill) => skill.id === skillId)
    );
  }

  if (organizationalUnitId) {
    inputData = inputData.filter((item) => item.organizationalUnitId === organizationalUnitId);
  }

  if (countryId) {
    inputData = inputData.filter((item) => item.location?.country?.id === countryId);
  }

  if (regionId) {
    inputData = inputData.filter((item) => item.location?.region?.id === regionId);
  }

  return inputData;
}
