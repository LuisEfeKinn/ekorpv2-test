'use client';

import type { SelectChangeEvent } from '@mui/material/Select';
import type { IUserClarity } from 'src/types/users';
import type { IJob } from 'src/types/architecture/jobs';
import type { TableHeadCellProps } from 'src/components/table';
import type { IOrganizationalUnit } from 'src/types/organization';

import { varAlpha } from 'minimal-shared/utils';
import { useDebounce, useSetState } from 'minimal-shared/hooks';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Checkbox from '@mui/material/Checkbox';
import TableRow from '@mui/material/TableRow';
import Collapse from '@mui/material/Collapse';
import MenuItem from '@mui/material/MenuItem';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetRolesPaginationService } from 'src/services/security/roles.service';
import { GetJobsPaginationService } from 'src/services/architecture/business/jobs.service';
import {
  GetOrganizationalUnitPaginationService,
  normalizeOrganizationalUnitListResponse,
} from 'src/services/organization/organizationalUnit.service';
import {
  DeleteUserClarityService,
  GetUsersClarityAllService,
  GetActiveUsersClarityService,
  DownloadUsersClarityExcelService,
  UploadUsersClarityTemplateService,
  DownloadUsersClarityTemplateService,
} from 'src/services/security/users.service';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { usePopover, CustomPopover } from 'src/components/custom-popover';
import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';
import {
  useTable,
  TableNoData,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { UsersClarityCreateForm } from 'src/sections/users-clarity/users-clarity-create-form';

import { getErrorMessage } from 'src/auth/utils/error-message';

type UserStatusFilter = 'all' | '0' | '1' | '2' | '3';

type UsersClarityColumnId =
  | 'usuario'
  | 'nombres'
  | 'apellidos'
  | 'apellido2'
  | 'codigoEmpleado'
  | 'correoElectronico'
  | 'roles'
  | 'estadousuario'
  | 'cargo'
  | 'perfil'
  | 'unidadOrganizacional'
  | 'jefeInmediato'
  | 'tipoUsuario';

type UsersClarityColumnConfig = {
  id: UsersClarityColumnId;
  label: string;
  width?: number;
  api?: string;
};

const USERS_CLARITY_ALL_COLUMNS: UsersClarityColumnConfig[] = [
  { id: 'usuario', label: 'Usuario', api: 'USUARIO' },
  { id: 'nombres', label: 'Nombres', api: 'NOMBRES' },
  { id: 'apellidos', label: 'Primer apellido', api: 'PRIMER_APELLIDO' },
  { id: 'apellido2', label: 'Segundo apellido', api: 'SEGUNDO_APELLIDO' },
  { id: 'codigoEmpleado', label: 'Código empleado', api: 'CODIGO_EMPLEADO' },
  { id: 'correoElectronico', label: 'Correo', api: 'CORREO_ELECTRONICO' },
  { id: 'roles', label: 'Rol', api: 'ROL' },
  { id: 'cargo', label: 'Cargo', api: 'CARGO' },
  { id: 'unidadOrganizacional', label: 'Unidad organizacional', api: 'UNIDAD_ORGANIZACIONAL' },
  { id: 'jefeInmediato', label: 'Jefe inmediato', api: 'JEFE_INMEDIATO' },
  { id: 'tipoUsuario', label: 'Tipo usuario', api: 'TIPO_USUARIO' },
  { id: 'estadousuario', label: 'Estado', api: 'ESTADO_USUARIO' },
  { id: 'perfil', label: 'Perfil' },
];

const USERS_CLARITY_FIXED_COLUMNS: UsersClarityColumnId[] = [
  'usuario',
  'nombres',
  'apellidos',
  'roles',
  'cargo',
  'correoElectronico',
];

const USERS_CLARITY_DEFAULT_COLUMNS: UsersClarityColumnId[] = [
  'usuario',
  'nombres',
  'apellidos',
  'roles',
  'cargo',
  'correoElectronico',
  'estadousuario',
];

interface IUserAdministrationTableFilters {
  nombre: string;
  correo: string;
  rolId: string;
  cargo: string;
  unidadOrganizacional: string;
  jefeInmediato: string;
  tipoUsuario: string;
  status: UserStatusFilter;
}

type UsersClarityTableFilterName =
  | 'nombre'
  | 'correo'
  | 'rolId'
  | 'cargo'
  | 'unidadOrganizacional'
  | 'jefeInmediato'
  | 'tipoUsuario';

export default function Page() {
  const { t } = useTranslate('security');
  const table = useTable();

  const [tableData, setTableData] = useState<IUserClarity[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [openCreateDrawer, setOpenCreateDrawer] = useState(false);
  const [editingUser, setEditingUser] = useState<IUserClarity | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadingTemplate, setUploadingTemplate] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [roleOptions, setRoleOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [organizationalUnits, setOrganizationalUnits] = useState<IOrganizationalUnit[]>([]);
  const [activeUsers, setActiveUsers] = useState<IUserClarity[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<UsersClarityColumnId[]>(() => {
    const set = new Set<UsersClarityColumnId>(USERS_CLARITY_DEFAULT_COLUMNS);
    USERS_CLARITY_FIXED_COLUMNS.forEach((id) => set.add(id));
    return USERS_CLARITY_ALL_COLUMNS.map((c) => c.id).filter((id) => set.has(id));
  });

  const handleToggleColumn = useCallback((columnId: UsersClarityColumnId) => {
    if (USERS_CLARITY_FIXED_COLUMNS.includes(columnId)) return;
    setVisibleColumns((prev) => {
      const nextSet = new Set(prev);
      if (nextSet.has(columnId)) nextSet.delete(columnId);
      else nextSet.add(columnId);
      USERS_CLARITY_FIXED_COLUMNS.forEach((id) => nextSet.add(id));
      return USERS_CLARITY_ALL_COLUMNS.map((c) => c.id).filter((id) => nextSet.has(id));
    });
  }, []);

  const filters = useSetState<IUserAdministrationTableFilters>({
    nombre: '',
    correo: '',
    rolId: '',
    cargo: '',
    unidadOrganizacional: '',
    jefeInmediato: '',
    tipoUsuario: '',
    status: 'all',
  });

  const { state: currentFilters, setState: updateFilters } = filters;

  const STATUS_OPTIONS = useMemo(
    () => [
      { value: 'all' as const, label: t('usersClarity.table.filters.all') },
      { value: '0' as const, label: t('usersClarity.table.filters.active') },
      { value: '1' as const, label: t('usersClarity.table.filters.preregistered') },
      { value: '2' as const, label: t('usersClarity.table.filters.inactive') },
      { value: '3' as const, label: t('usersClarity.table.filters.deleted') },
    ],
    [t]
  );

  const TABLE_HEAD: TableHeadCellProps[] = useMemo(
    () => {
      const dynamic = USERS_CLARITY_ALL_COLUMNS.filter((c) => visibleColumns.includes(c.id)).map((c) => ({
        id: c.id,
        label: c.label,
        width: c.width,
      }));

      return [{ id: 'actions', width: 88 }, ...dynamic];
    },
    [visibleColumns]
  );

  useEffect(() => {
    let mounted = true;

    GetRolesPaginationService({ page: 1, take: 100 })
      .then((res) => {
        const data: Array<{ id: string; name: string }> = Array.isArray(res?.data?.data) ? res.data.data : [];
        if (mounted) setRoleOptions(data);
      })
      .catch(() => {
        if (mounted) setRoleOptions([]);
      });

    GetJobsPaginationService(undefined)
      .then((res) => {
        const data = Array.isArray(res?.data) ? res.data : [];
        if (mounted) setJobs(data);
      })
      .catch(() => {
        if (mounted) setJobs([]);
      });

    GetOrganizationalUnitPaginationService(undefined)
      .then((res) => {
        const data = normalizeOrganizationalUnitListResponse(res?.data as any);
        if (mounted) setOrganizationalUnits(data);
      })
      .catch(() => {
        if (mounted) setOrganizationalUnits([]);
      });

    GetActiveUsersClarityService()
      .then((res) => {
        const data = Array.isArray(res?.data) ? res.data : [];
        if (mounted) setActiveUsers(data);
      })
      .catch(() => {
        if (mounted) setActiveUsers([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const debouncedNombre = useDebounce(currentFilters.nombre, 300);
  const debouncedCorreo = useDebounce(currentFilters.correo, 300);

  const buildQueryParams = useCallback(
    (options?: { useDebounced?: boolean }) => {
      const useDebounced = options?.useDebounced ?? false;
      const params: Record<string, string | number> = {};

      const nombre = (useDebounced ? debouncedNombre : currentFilters.nombre).trim();
      if (nombre) params.nombre = nombre;

      const correo = (useDebounced ? debouncedCorreo : currentFilters.correo).trim();
      if (correo) params.correo = correo;

      if (currentFilters.rolId) params.rolId = currentFilters.rolId;
      if (currentFilters.cargo) params.cargo = currentFilters.cargo;
      if (currentFilters.unidadOrganizacional) params.unidadOrganizacional = currentFilters.unidadOrganizacional;
      if (currentFilters.jefeInmediato) params.jefeInmediato = currentFilters.jefeInmediato;
      if (currentFilters.tipoUsuario) params.tipoUsuario = currentFilters.tipoUsuario;

      if (currentFilters.status !== 'all') {
        params.estadoUsuario = Number(currentFilters.status);
      }

      return params;
    },
    [currentFilters, debouncedCorreo, debouncedNombre]
  );

  const loadData = useCallback(async () => {
    try {
      const response = await GetUsersClarityAllService(buildQueryParams({ useDebounced: true }));
      const data = response.data ?? [];

      setTableData(Array.isArray(data) ? data.filter((item) => item !== null && item !== undefined) : []);
      setTotalItems(Array.isArray(data) ? data.length : 0);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error(t('usersClarity.messages.error.loading'));
      setTableData([]);
      setTotalItems(0);
    }
  }, [buildQueryParams, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const dataFiltered = tableData;

  const canReset =
    !!currentFilters.nombre.trim() ||
    !!currentFilters.correo.trim() ||
    !!currentFilters.rolId ||
    !!currentFilters.cargo ||
    !!currentFilters.unidadOrganizacional ||
    !!currentFilters.jefeInmediato ||
    !!currentFilters.tipoUsuario ||
    currentFilters.status !== 'all';

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const jobNameById = useMemo(() => {
    const entries = jobs.map((job) => [String(job.id), job.name] as const);
    return new Map<string, string>(entries);
  }, [jobs]);

  const organizationalUnitNameByCode = useMemo(() => {
    const entries = organizationalUnits.map((ou) => [ou.code, ou.name] as const);
    return new Map<string, string>(entries);
  }, [organizationalUnits]);

  const bossNameById = useMemo(() => {
    const entries = activeUsers.map((u) => {
      const fullName = `${u.nombres} ${u.apellidos}${u.apellido2 ? ` ${u.apellido2}` : ''}`.trim();
      return [String(u.idusuario), fullName || u.usuario] as const;
    });
    return new Map<string, string>(entries);
  }, [activeUsers]);

  const handleFilterStatus = useCallback(
    (_event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      updateFilters({ status: newValue as UserStatusFilter });
    },
    [updateFilters, table]
  );

  const handleResetFilters = useCallback(() => {
    table.onResetPage();
    updateFilters({
      nombre: '',
      correo: '',
      rolId: '',
      cargo: '',
      unidadOrganizacional: '',
      jefeInmediato: '',
      tipoUsuario: '',
      status: 'all',
    });
  }, [updateFilters, table]);

  const getStatusCount = useCallback(
    (status: UserStatusFilter) => {
      if (status === 'all') {
        return totalItems;
      }

      return tableData.filter((user) => user.estadousuario === Number(status)).length;
    },
    [tableData, totalItems]
  );

  const handleOpenCreateDrawer = useCallback(() => {
    setEditingUser(null);
    setOpenCreateDrawer(true);
  }, []);

  const handleCloseCreateDrawer = useCallback(() => {
    setEditingUser(null);
    setOpenCreateDrawer(false);
  }, []);

  const handleEditUser = useCallback((user: IUserClarity) => {
    setEditingUser(user);
    setOpenCreateDrawer(true);
  }, []);

  const handleDeleteUser = useCallback(
    async (idusuario: number) => {
      try {
        await DeleteUserClarityService(idusuario);
        toast.success('Usuario eliminado correctamente');
        loadData();
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Error al eliminar el usuario');
      }
    },
    [loadData]
  );

  const handleDownloadUsersClarityTemplate = useCallback(async () => {
    try {
      const response = await DownloadUsersClarityTemplateService();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'users_clarity_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading users clarity template:', error);
      toast.error(
        t('usersClarity.table.messages.downloadTemplateError', {
          defaultValue: 'Error al descargar la plantilla',
        })
      );
    }
  }, [t]);

  const handleUploadUsersClarityTemplate = useCallback(
    async (file: File) => {
      try {
        setUploadingTemplate(true);
        const formData = new FormData();
        formData.append('file', file);

        const response = await UploadUsersClarityTemplateService(formData);
        const created = response.data?.data?.created;
        const message =
          response.data?.message ??
          t('usersClarity.table.messages.uploadSuccess', { defaultValue: 'Plantilla cargada correctamente' });

        const createdSuffix =
          typeof created === 'number'
            ? ` (${t('usersClarity.table.messages.createdCount', { defaultValue: 'creados' })}: ${created})`
            : '';

        toast.success(`${message}${createdSuffix}`);
        loadData();
      } catch (error) {
        console.error('Error uploading users clarity template:', error);
        const base = t('usersClarity.table.messages.uploadError', { defaultValue: 'Error al cargar la plantilla' });
        toast.error(`${base}: ${getErrorMessage(error)}`);
        throw error;
      } finally {
        setUploadingTemplate(false);
      }
    },
    [loadData, t]
  );

  const handleDownloadExcel = useCallback(async () => {
    try {
      setDownloadingExcel(true);

      const columns = USERS_CLARITY_ALL_COLUMNS.filter((c) => visibleColumns.includes(c.id))
        .map((c) => c.api)
        .filter((v): v is string => typeof v === 'string' && v.length > 0);

      const columnsParam = columns.length ? columns.join(',') : 'USUARIO';

      const params = {
        ...buildQueryParams({ useDebounced: false }),
        columns: columnsParam,
      };

      const response = await DownloadUsersClarityExcelService(params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'users_clarity.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading users clarity excel:', error);
      toast.error(t('usersClarity.table.messages.downloadExcelError', { defaultValue: 'Error al descargar' }));
    } finally {
      setDownloadingExcel(false);
    }
  }, [buildQueryParams, t, visibleColumns]);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('usersClarity.title')}
        links={[
          { name: t('usersClarity.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('usersClarity.title') },
        ]}
        action={
          <Stack direction="row" spacing={1}>
            <LoadingButton
              onClick={handleDownloadExcel}
              loading={downloadingExcel}
              variant="outlined"
              startIcon={<Iconify icon="solar:download-bold" />}
            >
              {t('usersClarity.table.actions.exportExcel', { defaultValue: 'Exportar Excel' })}
            </LoadingButton>

            <LoadingButton
              onClick={() => setUploadDialogOpen(true)}
              disabled={uploadingTemplate}
              variant="outlined"
              startIcon={<Iconify icon="eva:cloud-upload-fill" />}
            >
              {t('usersClarity.table.actions.uploadTemplate', { defaultValue: 'Cargar Plantilla' })}
            </LoadingButton>
            <Button
              variant="contained"
              startIcon={<Iconify icon="solar:user-plus-bold" />}
              onClick={handleOpenCreateDrawer}
            >
              {t('users.actions.create')}
            </Button>
          </Stack>
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
                  color={
                    (tab.value === '0' && 'success') ||
                    ((tab.value === '2' || tab.value === '3') && 'error') ||
                    'default'
                  }
                >
                  {getStatusCount(tab.value)}
                </Label>
              }
            />
          ))}
        </Tabs>

        <UsersClarityTableToolbar
          filters={currentFilters}
          canReset={canReset}
          onResetFilters={handleResetFilters}
          visibleColumns={visibleColumns}
          onChangeColumns={handleToggleColumn}
          roleOptions={roleOptions}
          jobs={jobs}
          organizationalUnits={organizationalUnits}
          activeUsers={activeUsers}
          onFilters={(name: UsersClarityTableFilterName, value: string) => {
            table.onResetPage();
            updateFilters({ [name]: value } as Partial<IUserAdministrationTableFilters>);
          }}
          onClearAdvancedFilters={() => {
            table.onResetPage();
            updateFilters({
              correo: '',
              rolId: '',
              cargo: '',
              unidadOrganizacional: '',
              jefeInmediato: '',
              tipoUsuario: '',
            });
          }}
        />

        {canReset && (
          <FiltersResult totalResults={totalItems} onReset={handleResetFilters} sx={{ p: 2.5, pt: 0 }}>
            <FiltersBlock
              label={`${t('usersClarity.table.filters.nombre')}:`}
              isShow={currentFilters.nombre.trim().length > 0}
            >
              <Chip
                {...chipProps}
                label={currentFilters.nombre}
                onDelete={() => updateFilters({ nombre: '' })}
              />
            </FiltersBlock>

            <FiltersBlock
              label={`${t('usersClarity.table.filters.correo')}:`}
              isShow={currentFilters.correo.trim().length > 0}
            >
              <Chip
                {...chipProps}
                label={currentFilters.correo}
                onDelete={() => updateFilters({ correo: '' })}
              />
            </FiltersBlock>

            <FiltersBlock
              label={`${t('usersClarity.table.filters.rol')}:`}
              isShow={Boolean(currentFilters.rolId)}
            >
              <Chip
                {...chipProps}
                label={
                  roleOptions.find((r) => String(r.id) === String(currentFilters.rolId))?.name ??
                  currentFilters.rolId
                }
                onDelete={() => updateFilters({ rolId: '' })}
              />
            </FiltersBlock>

            <FiltersBlock
              label={`${t('usersClarity.table.filters.cargo')}:`}
              isShow={Boolean(currentFilters.cargo)}
            >
              <Chip
                {...chipProps}
                label={
                  jobs.find((j) => String(j.code ?? j.id) === String(currentFilters.cargo))?.name ??
                  currentFilters.cargo
                }
                onDelete={() => updateFilters({ cargo: '' })}
              />
            </FiltersBlock>

            <FiltersBlock
              label={`${t('usersClarity.table.filters.unidadOrganizacional')}:`}
              isShow={Boolean(currentFilters.unidadOrganizacional)}
            >
              <Chip
                {...chipProps}
                label={
                  organizationalUnits.find((ou) => ou.code === currentFilters.unidadOrganizacional)?.name ??
                  currentFilters.unidadOrganizacional
                }
                onDelete={() => updateFilters({ unidadOrganizacional: '' })}
              />
            </FiltersBlock>

            <FiltersBlock
              label={`${t('usersClarity.table.filters.jefeInmediato')}:`}
              isShow={Boolean(currentFilters.jefeInmediato)}
            >
              <Chip
                {...chipProps}
                label={
                  activeUsers.find((u) => u.usuario === currentFilters.jefeInmediato)?.usuario ??
                  currentFilters.jefeInmediato
                }
                onDelete={() => updateFilters({ jefeInmediato: '' })}
              />
            </FiltersBlock>

            <FiltersBlock
              label={`${t('usersClarity.table.filters.tipoUsuario')}:`}
              isShow={Boolean(currentFilters.tipoUsuario)}
            >
              <Chip
                {...chipProps}
                label={
                  currentFilters.tipoUsuario === '1'
                    ? t('usersClarity.table.filters.tipoUsuarioInterno')
                    : t('usersClarity.table.filters.tipoUsuarioExterno')
                }
                onDelete={() => updateFilters({ tipoUsuario: '' })}
              />
            </FiltersBlock>
          </FiltersResult>
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
                  .map((row) => {
                    const isActive = row.estadousuario === 0;

                    return (
                      <UsersAdministrationTableRow
                        key={row.idusuario}
                        row={row}
                        isActive={isActive}
                        onEdit={() => handleEditUser(row)}
                        onDelete={() => handleDeleteUser(row.idusuario)}
                        visibleColumns={visibleColumns}
                        jobNameById={jobNameById}
                        organizationalUnitNameByCode={organizationalUnitNameByCode}
                        bossNameById={bossNameById}
                      />
                    );
                  })}

                <TableEmptyRows
                  height={table.dense ? 56 : 76}
                  emptyRows={
                    table.page > 0
                      ? Math.max(0, (1 + table.page) * table.rowsPerPage - dataFiltered.length)
                      : 0
                  }
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

      <Drawer
        anchor="right"
        open={openCreateDrawer}
        onClose={handleCloseCreateDrawer}
        slotProps={{ backdrop: { invisible: true } }}
        PaperProps={{ sx: { width: { xs: 1, md: 640 } } }}
      >
        <Stack sx={{ height: 1, display: 'flex', flexDirection: 'column' }}>
          <Box
            sx={{
              p: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: (theme) => `solid 1px ${theme.vars.palette.divider}`,
            }}
          >
            <Typography variant="h6">{t('usersClarity.form.sections.systemUsers')}</Typography>

            <IconButton onClick={handleCloseCreateDrawer}>
              <Iconify icon="mingcute:close-line" />
            </IconButton>
          </Box>

          <Scrollbar sx={{ flexGrow: 1, p: 2.5 }}>
            <UsersClarityCreateForm
              mode={editingUser ? 'edit' : 'create'}
              initialUser={editingUser ?? undefined}
              onSuccess={() => {
                handleCloseCreateDrawer();
                loadData();
              }}
              onCancel={handleCloseCreateDrawer}
            />
          </Scrollbar>

          <Divider sx={{ borderStyle: 'dashed' }} />
        </Stack>
      </Drawer>

      <UsersClarityUploadTemplateDialog
        open={uploadDialogOpen}
        uploading={uploadingTemplate}
        onClose={() => setUploadDialogOpen(false)}
        onDownloadTemplate={handleDownloadUsersClarityTemplate}
        onUpload={handleUploadUsersClarityTemplate}
      />
    </DashboardContent>
  );
}

type UsersClarityUploadTemplateDialogProps = {
  open: boolean;
  uploading: boolean;
  onClose: () => void;
  onDownloadTemplate: () => void;
  onUpload: (file: File) => Promise<void>;
};

function UsersClarityUploadTemplateDialog({
  open,
  uploading,
  onClose,
  onDownloadTemplate,
  onUpload,
}: UsersClarityUploadTemplateDialogProps) {
  const { t } = useTranslate('security');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setError(null);
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
        const msg = t('usersClarity.table.uploadDialog.errors.tooManyFiles', {
          defaultValue: 'Solo se permite 1 archivo.',
        });
        setError(msg);
        toast.error(msg);
        return;
      }

      if (code === 'file-invalid-type') {
        const msg = t('usersClarity.table.uploadDialog.errors.invalidType', {
          defaultValue: 'Formato no permitido. Usa .xlsx o .xls.',
        });
        setError(msg);
        toast.error(msg);
        return;
      }

      const msg = t('usersClarity.table.uploadDialog.errors.generic', {
        defaultValue: 'No se pudo cargar el archivo. Intenta nuevamente.',
      });
      setError(msg);
      toast.error(msg);
    },
    [t]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    multiple: false,
    maxFiles: 1,
    accept,
    disabled: uploading,
    onDropAccepted: (files) => {
      setFile(files[0] ?? null);
      setError(null);
    },
    onDropRejected: handleDropRejected,
  });

  const handleClose = useCallback(() => {
    if (!uploading) onClose();
  }, [onClose, uploading]);

  const handleConfirmUpload = useCallback(async () => {
    if (!file) {
      const msg = t('usersClarity.table.uploadDialog.errors.noFile', { defaultValue: 'Selecciona un archivo.' });
      setError(msg);
      toast.error(msg);
      return;
    }
    try {
      await onUpload(file);
      onClose();
    } catch (uploadError) {
      const msg = getErrorMessage(uploadError);
      setError(msg);
      toast.error(msg);
    }
  }, [file, onClose, onUpload, t]);

  return (
    <Drawer
      open={open}
      anchor="right"
      onClose={handleClose}
      PaperProps={{ sx: { width: { xs: 1, sm: 520, md: 620 }, display: 'flex', flexDirection: 'column' } }}
    >
      <Box sx={{ px: 3, py: 2, position: 'relative', borderBottom: (theme) => `1px solid ${theme.vars.palette.divider}` }}>
        <Typography variant="h6">
          {t('usersClarity.table.uploadDialog.title', { defaultValue: 'Carga masiva de usuarios' })}
        </Typography>
        <IconButton
          aria-label={t('usersClarity.table.uploadDialog.actions.close', { defaultValue: 'Cerrar' })}
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
            <Typography variant="subtitle2">
              {t('usersClarity.table.uploadDialog.instructions.title', { defaultValue: 'Instrucciones' })}
            </Typography>
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
              <Typography variant="body2" color="text.secondary">
                {t('usersClarity.table.uploadDialog.instructions.step1', {
                  defaultValue: 'Debe crear un archivo excel con las siguientes columnas como encabezado: ',
                })}
                <Box component="span" sx={{ fontWeight: 700 }}>
                  {t('usersClarity.table.uploadDialog.instructions.columns', {
                    defaultValue:
                      'USUARIO, CLAVE, NOMBRES, PRIMER_APELLIDO, SEGUNDO_APELLIDO, CODIGO_EMPLEADO, CORREO_ELECTRONICO, ID_CARGO, JEFE INMEDIATO (Nombre del usuario), TIPO_DE_AUTENTICACION (Base de datos=1, LDAP=2, Externo=3), ESTADO_USUARIO (Activo=0, Inactivo=2), TIPO_USUARIO (Interno=1, Externo=2).',
                  })}
                </Box>
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                {t('usersClarity.table.uploadDialog.instructions.step2', {
                  defaultValue:
                    'Tener en cuenta que el cargo debe estar asociado a la Unidad Organizacional, de lo contrario no se cargará en el sistema.',
                })}
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                {t('usersClarity.table.uploadDialog.instructions.step3', {
                  defaultValue: 'Descargar plantilla.',
                })}
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                {t('usersClarity.table.uploadDialog.instructions.step4', {
                  defaultValue:
                    "Ingrese el listado de usuarios a cargar y guarde el archivo con un nombre que no contenga espacios ni caracteres especiales.",
                })}
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                {t('usersClarity.table.uploadDialog.instructions.step5', {
                  defaultValue:
                    "Puede arrastrar y soltar el archivo guardado en el cuadro a continuación, o seleccionarlo mediante el botón 'Seleccionar archivo'.",
                })}
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                {t('usersClarity.table.uploadDialog.instructions.step6', {
                  defaultValue: "Haga clic en el botón 'Cargar' para iniciar el proceso de cargue.",
                })}
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
                ...((isDragReject || !!error) && {
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
                  ? t('usersClarity.table.uploadDialog.drop.selectedTitle', {
                      defaultValue: 'Archivo seleccionado',
                    })
                  : t('usersClarity.table.uploadDialog.drop.title', {
                      defaultValue: 'Seleccionar archivo Excel',
                    })}
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
                      setError(null);
                    }}
                    disabled={uploading}
                    sx={{ textTransform: 'none' }}
                  >
                    {t('usersClarity.table.uploadDialog.actions.remove', { defaultValue: 'Quitar' })}
                  </Button>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t('usersClarity.table.uploadDialog.drop.subtitle', {
                    defaultValue: 'o haz clic para seleccionar desde tu dispositivo',
                  })}
                </Typography>
              )}

              <Typography variant="caption" color="text.disabled">
                {t('usersClarity.table.uploadDialog.drop.formats', {
                  defaultValue: 'Formatos permitidos: .xlsx, .xls • 1 archivo',
                })}
              </Typography>
            </Stack>
          </Box>

          {!!error && (
            <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 1, whiteSpace: 'pre-line' }}>
              {error}
            </Typography>
          )}

          <Button
            variant="outlined"
            startIcon={<Iconify icon="eva:cloud-download-fill" />}
            onClick={onDownloadTemplate}
            disabled={uploading}
            sx={{ mt: 1.5, width: 1 }}
          >
            {t('usersClarity.table.actions.downloadTemplate', { defaultValue: 'Descargar Plantilla' })}
          </Button>
        </Box>
      </Box>

      <Box sx={{ px: 3, py: 2, borderTop: (theme) => `1px solid ${theme.vars.palette.divider}`, display: 'flex', justifyContent: 'flex-end', gap: 1.25 }}>
        <Button onClick={handleClose} disabled={uploading} color="inherit" variant="outlined">
          {t('usersClarity.table.uploadDialog.actions.cancel', { defaultValue: 'Cancelar' })}
        </Button>
        <LoadingButton variant="contained" loading={uploading} onClick={handleConfirmUpload} disabled={!file}>
          {t('usersClarity.table.uploadDialog.actions.upload', { defaultValue: 'Cargar' })}
        </LoadingButton>
      </Box>
    </Drawer>
  );
}

type UsersClarityTableToolbarProps = {
  filters: IUserAdministrationTableFilters;
  canReset: boolean;
  onResetFilters: () => void;
  onClearAdvancedFilters: () => void;
  onFilters: (name: UsersClarityTableFilterName, value: string) => void;
  visibleColumns: UsersClarityColumnId[];
  onChangeColumns: (columnId: UsersClarityColumnId) => void;
  roleOptions: Array<{ id: string; name: string }>;
  jobs: IJob[];
  organizationalUnits: IOrganizationalUnit[];
  activeUsers: IUserClarity[];
};

function UsersClarityTableToolbar({
  filters,
  canReset,
  onResetFilters,
  onClearAdvancedFilters,
  onFilters,
  visibleColumns,
  onChangeColumns,
  roleOptions,
  jobs,
  organizationalUnits,
  activeUsers,
}: UsersClarityTableToolbarProps) {
  const { t } = useTranslate('security');
  const { t: tCommon } = useTranslate('common');
  const columnsPopover = usePopover();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const fixedColumnSet = useMemo(() => new Set<UsersClarityColumnId>(USERS_CLARITY_FIXED_COLUMNS), []);

  const hasAnyAdvancedFilter = useMemo(
    () =>
      !!filters.correo.trim() ||
      !!filters.rolId ||
      !!filters.cargo ||
      !!filters.unidadOrganizacional ||
      !!filters.jefeInmediato ||
      !!filters.tipoUsuario,
    [
      filters.cargo,
      filters.correo,
      filters.jefeInmediato,
      filters.rolId,
      filters.tipoUsuario,
      filters.unidadOrganizacional,
    ]
  );

  const handleToggleFilters = useCallback(() => {
    setFiltersOpen((prev) => !prev);
  }, []);

  const handleNombreChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFilters('nombre', event.target.value);
    },
    [onFilters]
  );

  const handleCorreoChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFilters('correo', event.target.value);
    },
    [onFilters]
  );

  const handleSelectChange = useCallback(
    (name: UsersClarityTableFilterName) => (event: SelectChangeEvent) => {
      onFilters(name, String(event.target.value));
    },
    [onFilters]
  );

  return (
    <>
      <Stack spacing={2} direction={{ xs: 'column', md: 'row' }} sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="center" spacing={2} flexGrow={1} sx={{ width: 1 }}>
          <TextField
            fullWidth
            value={filters.nombre}
            onChange={handleNombreChange}
            placeholder={tCommon('filters.search')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" />
                </InputAdornment>
              ),
              endAdornment: canReset ? (
                <InputAdornment position="end">
                  <IconButton onClick={onResetFilters}>
                    <Iconify icon="solar:close-circle-bold" />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            }}
          />

          <Button
            color="inherit"
            variant={hasAnyAdvancedFilter ? 'contained' : 'outlined'}
            startIcon={<Iconify icon="solar:filter-broken" />}
            onClick={handleToggleFilters}
            sx={{ textTransform: 'capitalize' }}
          >
            {tCommon('filters.button')}
          </Button>

          <Button
            color="inherit"
            variant="outlined"
            startIcon={<Iconify icon="solar:settings-bold" />}
            onClick={columnsPopover.onOpen}
            sx={{ textTransform: 'capitalize' }}
          >
            {t('usersClarity.table.toolbar.columns', { defaultValue: 'Columnas' })}
          </Button>
        </Stack>
      </Stack>

      <Collapse in={filtersOpen} timeout="auto" unmountOnExit>
        <Box sx={{ px: 2.5, pb: 2.5 }}>
          <Box
            sx={[
              (theme) => ({
                p: 2,
                borderRadius: 1.5,
                border: `dashed 1px ${theme.vars.palette.divider}`,
                backgroundColor: theme.vars.palette.background.neutral,
              }),
            ]}
          >
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              }}
            >
              <TextField
                fullWidth
                value={filters.correo}
                onChange={handleCorreoChange}
                label={t('usersClarity.table.filters.correo')}
              />

              <FormControl fullWidth>
                <InputLabel id="users-clarity-role-filter-label">
                  {t('usersClarity.table.filters.rol')}
                </InputLabel>
                <Select
                  labelId="users-clarity-role-filter-label"
                  value={filters.rolId || ''}
                  label={t('usersClarity.table.filters.rol')}
                  onChange={handleSelectChange('rolId')}
                  MenuProps={{
                    anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
                    transformOrigin: { vertical: 'top', horizontal: 'left' },
                    slotProps: {
                      paper: {
                        sx: {
                          mt: 0.5,
                          maxHeight: 240,
                          maxWidth: 360,
                        },
                      },
                    },
                  }}
                >
                  <MenuItem value="">{tCommon('filters.all')}</MenuItem>
                  {roleOptions.map((role) => (
                    <MenuItem key={role.id} value={String(role.id)}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel id="users-clarity-user-type-filter-label">
                  {t('usersClarity.table.filters.tipoUsuario')}
                </InputLabel>
                <Select
                  labelId="users-clarity-user-type-filter-label"
                  value={filters.tipoUsuario || ''}
                  label={t('usersClarity.table.filters.tipoUsuario')}
                  onChange={handleSelectChange('tipoUsuario')}
                >
                  <MenuItem value="">{tCommon('filters.all')}</MenuItem>
                  <MenuItem value="1">{t('usersClarity.table.filters.tipoUsuarioInterno')}</MenuItem>
                  <MenuItem value="2">{t('usersClarity.table.filters.tipoUsuarioExterno')}</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel id="users-clarity-job-filter-label">
                  {t('usersClarity.table.filters.cargo')}
                </InputLabel>
                <Select
                  labelId="users-clarity-job-filter-label"
                  value={filters.cargo || ''}
                  label={t('usersClarity.table.filters.cargo')}
                  onChange={handleSelectChange('cargo')}
                  MenuProps={{
                    anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
                    transformOrigin: { vertical: 'top', horizontal: 'left' },
                    slotProps: {
                      paper: {
                        sx: {
                          mt: 0.5,
                          maxHeight: 240,
                          maxWidth: 420,
                        },
                      },
                    },
                  }}
                >
                  <MenuItem value="">{tCommon('filters.all')}</MenuItem>
                  {jobs.map((job) => {
                    const value = String(job.code ?? job.id);
                    return (
                      <MenuItem key={value} value={value}>
                        {job.name}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel id="users-clarity-ou-filter-label">
                  {t('usersClarity.table.filters.unidadOrganizacional')}
                </InputLabel>
                <Select
                  labelId="users-clarity-ou-filter-label"
                  value={filters.unidadOrganizacional || ''}
                  label={t('usersClarity.table.filters.unidadOrganizacional')}
                  onChange={handleSelectChange('unidadOrganizacional')}
                  MenuProps={{
                    anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
                    transformOrigin: { vertical: 'top', horizontal: 'left' },
                    slotProps: {
                      paper: {
                        sx: {
                          mt: 0.5,
                          maxHeight: 240,
                          maxWidth: 420,
                        },
                      },
                    },
                  }}
                >
                  <MenuItem value="">{tCommon('filters.all')}</MenuItem>
                  {organizationalUnits.map((ou) => (
                    <MenuItem key={ou.id} value={ou.code}>
                      {ou.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel id="users-clarity-boss-filter-label">
                  {t('usersClarity.table.filters.jefeInmediato')}
                </InputLabel>
                <Select
                  labelId="users-clarity-boss-filter-label"
                  value={filters.jefeInmediato || ''}
                  label={t('usersClarity.table.filters.jefeInmediato')}
                  onChange={handleSelectChange('jefeInmediato')}
                  MenuProps={{
                    anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
                    transformOrigin: { vertical: 'top', horizontal: 'left' },
                    slotProps: {
                      paper: {
                        sx: {
                          mt: 0.5,
                          maxHeight: 240,
                          maxWidth: 420,
                        },
                      },
                    },
                  }}
                >
                  <MenuItem value="">{tCommon('filters.all')}</MenuItem>
                  {activeUsers.map((u) => (
                    <MenuItem key={u.idusuario} value={u.usuario}>
                      {u.usuario}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
              <Button
                color="inherit"
                variant="outlined"
                startIcon={<Iconify icon="solar:restart-bold" />}
                onClick={onClearAdvancedFilters}
                disabled={!hasAnyAdvancedFilter}
                sx={{ textTransform: 'capitalize' }}
              >
                {tCommon('filters.clear')}
              </Button>
            </Stack>
          </Box>
        </Box>
      </Collapse>

      <CustomPopover
        open={columnsPopover.open}
        anchorEl={columnsPopover.anchorEl}
        onClose={columnsPopover.onClose}
        slotProps={{ arrow: { placement: 'top-right' } }}
      >
        <Box sx={{ p: 2, maxWidth: 320 }}>
          <Stack spacing={1}>
            {USERS_CLARITY_ALL_COLUMNS.map((column) => (
              <FormControlLabel
                key={column.id}
                control={
                  <Checkbox
                    checked={fixedColumnSet.has(column.id) || visibleColumns.includes(column.id)}
                    disabled={fixedColumnSet.has(column.id)}
                    onChange={() => {
                      if (!fixedColumnSet.has(column.id)) onChangeColumns(column.id);
                    }}
                  />
                }
                label={column.label}
              />
            ))}
          </Stack>
        </Box>
      </CustomPopover>
    </>
  );
}

interface UsersAdministrationTableRowProps {
  row: IUserClarity;
  isActive: boolean;
  onEdit: () => void;
  onDelete: () => void;
  visibleColumns: UsersClarityColumnId[];
  jobNameById: Map<string, string>;
  organizationalUnitNameByCode: Map<string, string>;
  bossNameById: Map<string, string>;
}

function UsersAdministrationTableRow({
  row,
  isActive,
  onEdit,
  onDelete,
  visibleColumns,
  jobNameById,
  organizationalUnitNameByCode,
  bossNameById,
}: UsersAdministrationTableRowProps) {
  const { t } = useTranslate('security');

  if (!row) {
    return null;
  }

  const rolesLabel =
    row.linkedUserRoles?.map((r) => r.name).filter(Boolean).join(', ') || row.roleIds?.join(', ') || '-';

  const resolveCellValue = (columnId: UsersClarityColumnId): React.ReactNode => {
    switch (columnId) {
      case 'usuario':
        return row.usuario || '-';
      case 'nombres':
        return row.nombres || '-';
      case 'apellidos':
        return row.apellidos || '-';
      case 'apellido2':
        return row.apellido2 || '-';
      case 'codigoEmpleado':
        return row.alias || '-';
      case 'correoElectronico':
        return row.correoElectronico || '-';
      case 'roles':
        return rolesLabel;
      case 'estadousuario':
        return (
          <Label
            variant="soft"
            color={
              row.estadousuario === 0 ? 'success' : row.estadousuario === 2 || row.estadousuario === 3 ? 'error' : 'warning'
            }
          >
            {row.estadousuario === 0
              ? t('usersClarity.status.active')
              : row.estadousuario === 1
                ? t('usersClarity.status.preregistered', { defaultValue: 'Preregistrado' })
                : row.estadousuario === 2
                  ? t('usersClarity.status.inactive')
                  : row.estadousuario === 3
                    ? t('usersClarity.status.deleted', { defaultValue: 'Eliminado' })
                    : '-'}
          </Label>
        );
      case 'cargo': {
        const id = row.job?.id ?? row.actores?.id;
        if (typeof id === 'number') return jobNameById.get(String(id)) ?? String(id);
        return '-';
      }
      case 'perfil':
        return row.descripcionPerfil || '-';
      case 'unidadOrganizacional': {
        const code = row.empresa;
        return code ? organizationalUnitNameByCode.get(code) ?? code : '-';
      }
      case 'jefeInmediato': {
        const id = row.UsersClarity?.id;
        if (typeof id === 'number') return bossNameById.get(String(id)) ?? String(id);
        return '-';
      }
      case 'tipoUsuario':
        return row.tipousuario === 1
          ? t('usersClarity.table.filters.tipoUsuarioInterno')
          : row.tipousuario === 2
            ? t('usersClarity.table.filters.tipoUsuarioExterno')
            : '-';
      default:
        return '-';
    }
  };

  return (
    <TableRowBasic>
      <TableCellBasic>
        <Stack direction="row" spacing={1} justifyContent="center">
          <IconButton size="small" onClick={onEdit}>
            <Iconify icon="solar:pen-bold" />
          </IconButton>
          <IconButton size="small" color="error" onClick={onDelete}>
            <Iconify icon="solar:trash-bin-trash-bold" />
          </IconButton>
        </Stack>
      </TableCellBasic>
      {visibleColumns.map((colId) => (
        <TableCellBasic key={colId}>{resolveCellValue(colId)}</TableCellBasic>
      ))}
    </TableRowBasic>
  );
}

function TableCellBasic({ children }: { children: React.ReactNode }) {
  return (
    <TableCell>
      <Box sx={{ typography: 'body2', color: 'text.primary' }}>{children}</Box>
    </TableCell>
  );
}

function TableRowBasic({ children }: { children: React.ReactNode }) {
  return <TableRow hover>{children}</TableRow>;
}
