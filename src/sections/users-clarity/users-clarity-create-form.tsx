'use client';

import type { IJob } from 'src/types/architecture/jobs';
import type { IOrganizationalUnit } from 'src/types/organization';
import type { IUserClarity, IUserClarityRelations, IUserClarityCreatePayload } from 'src/types/users';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { GetRolesPaginationService } from 'src/services/security/roles.service';
import { GetJobsPaginationService } from 'src/services/architecture/business/jobs.service';
import {
  GetOrganizationalUnitPaginationService,
  normalizeOrganizationalUnitListResponse,
} from 'src/services/organization/organizationalUnit.service';
import {
  GetProfilesService,
  GetLanguageEnumsService,
  CreateUserClarityService,
  UpdateUserClarityService,
  GetUserStateEnumsService,
  GetUsersTypeEnumsService,
  GetPersonTypeEnumsService,
  GetDocumentTypeEnumsService,
  GetActiveUsersClarityService,
  GetAuthenticationMethodEnumsService,
} from 'src/services/security/users.service';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

type UsersClarityCreateFormProps = {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialUser?: IUserClarity;
  mode?: 'create' | 'edit';
};

const userClaritySchema = (t: (key: string) => string, mode: 'create' | 'edit') =>
  z
    .object({
      nombres: z.string().optional(),
      primerApellido: z.string().optional(),
      segundoApellido: z.string().optional(),
      usuario: z.string().optional(),
      correoElectronico1: z.string().optional(),
      codigoEmpleado: z.string().optional(),
      clave: z.string().optional(),
      roleId: z.string().optional(),
      perfil: z.string().optional(),
      unidadOrganizacional: z.string().optional(),
      cargos: z.string().optional(),
      jefeInmediato: z.string().optional(),
      tipoAutenticacion: z.string().optional(),
      estadoUsuario: z.string().optional(),
      tipoUsuario: z.string().optional(),
      imagen: z.string().optional(),
      alias: z.string().optional(),
      avatar: z.string().optional(),
      numeroIdentificacion: z.string().optional(),
      tipoIdentificacion: z.string().optional(),
      correoElectronico2: z.string().optional(),
      celular: z.string().optional(),
      direccionCasa: z.string().optional(),
      telefonoCasa: z.string().optional(),
      direccionOficina: z.string().optional(),
      usuariosSistema: z.string().optional(),
      tipoPersona: z.string().optional(),
      empresa: z.string().optional(),
      tipoEmpresa: z.string().optional(),
      nitEmpresa: z.string().optional(),
      actividadEconomica: z.string().optional(),
      lenguaje: z.string().optional(),
      zonaHoraria: z.string().optional(),
    })
    .superRefine((values, ctx) => {
      if (mode !== 'create') return;

      const required: Array<{ key: keyof typeof values; message: string }> = [
        { key: 'nombres', message: t('usersClarity.form.validation.nombresRequired') },
        { key: 'primerApellido', message: t('usersClarity.form.validation.primerApellidoRequired') },
        { key: 'segundoApellido', message: t('usersClarity.form.validation.segundoApellidoRequired') },
        { key: 'usuario', message: t('usersClarity.form.validation.usuarioRequired') },
        { key: 'correoElectronico1', message: t('usersClarity.form.validation.correoElectronico1Required') },
        { key: 'codigoEmpleado', message: t('usersClarity.form.validation.codigoEmpleadoRequired') },
        { key: 'clave', message: t('usersClarity.form.validation.claveRequired') },
        { key: 'roleId', message: t('users.form.validation.roleRequired') },
      ];

      required.forEach(({ key, message }) => {
        const value = values[key];
        if (typeof value !== 'string' || value.trim().length === 0) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: [key], message });
        }
      });
    });

type UserClarityFormValues = z.infer<ReturnType<typeof userClaritySchema>>;

export function UsersClarityCreateForm({
  onSuccess,
  onCancel,
  initialUser,
  mode = 'create',
}: UsersClarityCreateFormProps) {
  const { t } = useTranslate('security');
  const router = useRouter();

  const methods = useForm<UserClarityFormValues>({
    mode: 'onSubmit',
    resolver: zodResolver(userClaritySchema(t, mode)),
    defaultValues: {
      nombres: '',
      primerApellido: '',
      segundoApellido: '',
      usuario: '',
      correoElectronico1: '',
      codigoEmpleado: '',
      clave: '',
      perfil: '',
      unidadOrganizacional: '',
      cargos: '',
      jefeInmediato: '',
      tipoAutenticacion: '1',
      estadoUsuario: '0',
      tipoUsuario: '1',
      imagen: '',
      alias: '',
      avatar: '',
      numeroIdentificacion: '',
      tipoIdentificacion: '',
      correoElectronico2: '',
      celular: '',
      direccionCasa: '',
      telefonoCasa: '',
      direccionOficina: '',
      usuariosSistema: '',
      tipoPersona: '1',
      empresa: '',
      tipoEmpresa: '',
      nitEmpresa: '',
      actividadEconomica: '',
      lenguaje: '1',
      zonaHoraria: 'America/Bogota',
      roleId: '',
    },
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = methods;

  const [jobs, setJobs] = useState<IJob[]>([]);
  const [organizationalUnits, setOrganizationalUnits] = useState<IOrganizationalUnit[]>([]);
  const [userStates, setUserStates] = useState<number[]>([]);
  const [authenticationMethods, setAuthenticationMethods] = useState<number[]>([]);
  const [languages, setLanguages] = useState<number[]>([]);
  const [usersTypes, setUsersTypes] = useState<number[]>([]);
  const [personTypes, setPersonTypes] = useState<number[]>([]);
  const [documentTypes, setDocumentTypes] = useState<string[]>([]);
  const [profiles, setProfiles] = useState<Array<{ idperfil: number; nombreperfil: string }>>([]);
  const [activeUsers, setActiveUsers] = useState<IUserClarity[]>([]);
  const [roleOptions, setRoleOptions] = useState<Array<{ id: string | number; name: string }>>([]);

  const mapUserToFormValues = useCallback(
    (user: IUserClarity): UserClarityFormValues => ({
      nombres: user.nombres,
      primerApellido: user.apellidos,
      segundoApellido: user.apellido2 ?? '',
      usuario: user.usuario,
      correoElectronico1: user.correoElectronico,
      codigoEmpleado: user.alias ?? '',
      clave: '',
      perfil: user.perfil?.id ? String(user.perfil.id) : user.profile?.id ? String(user.profile.id) : '',
      unidadOrganizacional: user.empresa ?? '',
      cargos: user.job?.id ? String(user.job.id) : user.actores?.id ? String(user.actores.id) : '',
      jefeInmediato: user.UsersClarity?.id ? String(user.UsersClarity.id) : '',
      tipoAutenticacion: String(user.tipoautenticacion),
      estadoUsuario: String(user.estadousuario),
      tipoUsuario: String(user.tipousuario),
      imagen: user.imagen ?? '',
      alias: user.alias,
      avatar: user.avatarusuario ?? '',
      numeroIdentificacion: user.identificacion,
      tipoIdentificacion: '',
      correoElectronico2: user.correoelectronico2 ?? '',
      celular: user.telefonocelular,
      direccionCasa: user.direccioncasa,
      telefonoCasa: user.telefonocasa,
      direccionOficina: user.direccionoficina,
      usuariosSistema: '',
      tipoPersona: String(user.tipopersona),
      empresa: user.empresa,
      tipoEmpresa: '',
      nitEmpresa: user.nitempresa,
      actividadEconomica: user.actividadeconomica,
      lenguaje: String(user.lenguaje),
      zonaHoraria: user.zonahoraria,
      roleId:
        user.roleIds?.[0] ??
        user.linkedUserRoles?.[0]?.id ??
        '',
    }),
    []
  );

  useEffect(() => {
    let mounted = true;
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

    GetUserStateEnumsService()
      .then((res) => {
        if (mounted) setUserStates(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (mounted) setUserStates([]);
      });

    GetAuthenticationMethodEnumsService()
      .then((res) => {
        if (mounted) setAuthenticationMethods(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (mounted) setAuthenticationMethods([]);
      });

    GetLanguageEnumsService()
      .then((res) => {
        if (mounted) setLanguages(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (mounted) setLanguages([]);
      });

    GetUsersTypeEnumsService()
      .then((res) => {
        if (mounted) setUsersTypes(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (mounted) setUsersTypes([]);
      });

    GetPersonTypeEnumsService()
      .then((res) => {
        if (mounted) setPersonTypes(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (mounted) setPersonTypes([]);
      });

    GetDocumentTypeEnumsService()
      .then((res) => {
        if (mounted) setDocumentTypes(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (mounted) setDocumentTypes([]);
      });

    GetProfilesService()
      .then((res) => {
        const raw = Array.isArray(res?.data) ? res.data : [];
        const mapped = raw.map((p) => ({ idperfil: p.idperfil, nombreperfil: p.nombreperfil }));
        if (mounted) setProfiles(mapped);
      })
      .catch(() => {
        if (mounted) setProfiles([]);
      });

    GetActiveUsersClarityService()
      .then((res) => {
        if (mounted) setActiveUsers(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (mounted) setActiveUsers([]);
      });

    GetRolesPaginationService({ page: 1, take: 100 })
      .then((res) => {
        const data: Array<{ id: string | number; name: string }> = Array.isArray(res?.data?.data)
          ? res.data.data
          : [];
        if (mounted) setRoleOptions(data);
      })
      .catch(() => {
        if (mounted) setRoleOptions([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (initialUser) {
      const values = mapUserToFormValues(initialUser);
      reset(values);
    } else {
      reset({
        nombres: '',
        primerApellido: '',
        segundoApellido: '',
        usuario: '',
        correoElectronico1: '',
        codigoEmpleado: '',
        clave: '',
        perfil: '',
        unidadOrganizacional: '',
        cargos: '',
        jefeInmediato: '',
        tipoAutenticacion: '1',
        estadoUsuario: '0',
        tipoUsuario: '1',
        imagen: '',
        alias: '',
        avatar: '',
        numeroIdentificacion: '',
        tipoIdentificacion: '',
        correoElectronico2: '',
        celular: '',
        direccionCasa: '',
        telefonoCasa: '',
        direccionOficina: '',
        usuariosSistema: '',
        tipoPersona: '1',
        empresa: '',
        tipoEmpresa: '',
        nitEmpresa: '',
        actividadEconomica: '',
        lenguaje: '1',
        zonaHoraria: 'America/Bogota',
        roleId: '',
      });
    }
  }, [initialUser, mapUserToFormValues, reset]);

  const buildPayload = useCallback(
    (values: UserClarityFormValues): Partial<IUserClarityCreatePayload> & {
      perfil?: { id: number };
      profile?: { id: number };
      UsersClarity?: { id: number };
      immediateSupervisor?: { id: number };
      actores?: { id: number };
      job?: { id: number };
    } => {
      const isNonEmpty = (value: unknown): value is string =>
        typeof value === 'string' && value.trim().length > 0;

      const payload: Partial<IUserClarityCreatePayload> & {
        perfil?: { id: number };
        profile?: { id: number };
        UsersClarity?: { id: number };
        immediateSupervisor?: { id: number };
        actores?: { id: number };
        job?: { id: number };
      } = {};

      if (mode === 'create') {
        payload.fechaCreacion = new Date().toISOString();
        payload.fechaSuspension = null;
        payload.fechaultimologin = null;
        payload.intentoslogin = 0;
        payload.fechamodificacion = null;
        payload.indcambiopwd = 0;
        payload.tokenpwd = null;
        payload.template = 'saga';
        payload.templateTheme = 'blue';
        payload.templateLayout = 'horizontal';
        payload.templateMenuMode = 'static';
        payload.templateOrientationRtl = 'N';
        payload.templateHorizontal = 'Y';
        payload.templateDarkMenu = 'N';
        payload.templateDarkMode = 'N';
        payload.templateLayoutPrimaryColor = '#1976D2';
        payload.templateComponentTheme = 'blue';
        payload.templateMenuTheme = 'blue';
        payload.templateMenuColor = '#FFFFFF';
      }

      if (isNonEmpty(values.nombres)) payload.nombres = values.nombres;
      if (isNonEmpty(values.primerApellido)) payload.apellidos = values.primerApellido;
      if (typeof values.segundoApellido === 'string')
        payload.apellido2 = values.segundoApellido.trim() ? values.segundoApellido : null;
      if (isNonEmpty(values.usuario)) payload.usuario = values.usuario;
      if (mode === 'create' && isNonEmpty(values.clave)) payload.clave = values.clave;
      if (isNonEmpty(values.correoElectronico1)) payload.correoElectronico = values.correoElectronico1;

      if (typeof values.imagen === 'string') payload.imagen = values.imagen.trim() ? values.imagen : null;
      if (isNonEmpty(values.avatar)) payload.avatarusuario = values.avatar;
      if (isNonEmpty(values.zonaHoraria)) payload.zonahoraria = values.zonaHoraria;
      if (isNonEmpty(values.numeroIdentificacion)) payload.identificacion = values.numeroIdentificacion;
      if (isNonEmpty(values.direccionCasa)) payload.direccioncasa = values.direccionCasa;
      if (isNonEmpty(values.direccionOficina)) payload.direccionoficina = values.direccionOficina;
      if (isNonEmpty(values.telefonoCasa)) payload.telefonocasa = values.telefonoCasa;
      if (isNonEmpty(values.telefonoCasa)) payload.telefonooficina = values.telefonoCasa;
      if (isNonEmpty(values.celular)) payload.telefonocelular = values.celular;
      if (typeof values.correoElectronico2 === 'string')
        payload.correoelectronico2 = values.correoElectronico2.trim() ? values.correoElectronico2 : null;

      if (isNonEmpty(values.codigoEmpleado)) payload.alias = values.codigoEmpleado;
      else if (isNonEmpty(values.alias)) payload.alias = values.alias;

      if (isNonEmpty(values.unidadOrganizacional)) payload.empresa = values.unidadOrganizacional;
      else if (isNonEmpty(values.empresa)) payload.empresa = values.empresa;

      if (isNonEmpty(values.nitEmpresa)) payload.nitempresa = values.nitEmpresa;
      if (isNonEmpty(values.actividadEconomica)) payload.actividadeconomica = values.actividadEconomica;

      if (isNonEmpty(values.tipoUsuario)) {
        payload.tipousuario = Number(values.tipoUsuario);
        payload.tipo = values.tipoUsuario === '1' ? 'INTERNAL' : 'EXTERNAL';
      }

      if (isNonEmpty(values.estadoUsuario)) payload.estadousuario = Number(values.estadoUsuario);
      if (isNonEmpty(values.lenguaje)) payload.lenguaje = Number(values.lenguaje);
      if (isNonEmpty(values.tipoPersona)) payload.tipopersona = Number(values.tipoPersona);
      if (isNonEmpty(values.tipoAutenticacion)) payload.tipoautenticacion = Number(values.tipoAutenticacion);

      if (isNonEmpty(values.perfil)) {
        payload.descripcionPerfil =
          profiles.find((p) => String(p.idperfil) === values.perfil)?.nombreperfil || values.perfil;
        payload.perfil = { id: Number(values.perfil) };
        payload.profile = { id: Number(values.perfil) };
      }

      if (isNonEmpty(values.jefeInmediato)) {
        payload.immediateSupervisor = { id: Number(values.jefeInmediato) };
        payload.UsersClarity = { id: Number(values.jefeInmediato) };
      }

      if (isNonEmpty(values.cargos)) {
        payload.actores = { id: Number(values.cargos) };
        payload.job = { id: Number(values.cargos) };
      }

      if (isNonEmpty(values.roleId)) {
        payload.roleIds = [values.roleId];
      }

      return payload;
    },
    [mode, profiles]
  );

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload = buildPayload(data);
      if (mode === 'edit' && initialUser) {
        await UpdateUserClarityService(initialUser.idusuario, payload);
        toast.success(t('users.actions.update'));
      } else {
        await CreateUserClarityService(payload as IUserClarityCreatePayload & IUserClarityRelations);
        toast.success(t('users.actions.create'));
      }
      reset();
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(paths.dashboard.userAdministration.usersTable);
      }
    } catch (error) {
      console.error('Error saving user:', error);
      if (mode === 'edit') {
        toast.error('Error al actualizar el usuario');
      } else {
        toast.error(t('users.messages.error.creating'));
      }
    }
  });

  const handleReset = () => {
    reset();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push(paths.dashboard.userAdministration.usersTable);
    }
  };

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Card sx={{ p: 3 }}>
        <Box
          sx={{
            rowGap: 2,
            columnGap: 2,
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(1, 1fr)' },
          }}
        >
          <Field.Text
            name="nombres"
            label={
              mode === 'create'
                ? `${t('usersClarity.form.fields.nombres')} *`
                : t('usersClarity.form.fields.nombres')
            }
          />
          <Field.Text
            name="primerApellido"
            label={
              mode === 'create'
                ? `${t('usersClarity.form.fields.primerApellido')} *`
                : t('usersClarity.form.fields.primerApellido')
            }
          />
          <Field.Text
            name="segundoApellido"
            label={
              mode === 'create'
                ? `${t('usersClarity.form.fields.segundoApellido')} *`
                : t('usersClarity.form.fields.segundoApellido')
            }
          />
          <Field.Text
            name="usuario"
            label={
              mode === 'create'
                ? `${t('usersClarity.form.fields.usuario')} *`
                : t('usersClarity.form.fields.usuario')
            }
          />
          <Field.Text
            name="correoElectronico1"
            label={
              mode === 'create'
                ? `${t('usersClarity.form.fields.correoElectronico1')} *`
                : t('usersClarity.form.fields.correoElectronico1')
            }
          />
          <Field.Text
            name="codigoEmpleado"
            label={
              mode === 'create'
                ? `${t('usersClarity.form.fields.codigoEmpleado')} *`
                : t('usersClarity.form.fields.codigoEmpleado')
            }
          />
          {mode === 'create' ? (
            <Field.Text name="clave" label={`${t('usersClarity.form.fields.clave')} *`} type="password" />
          ) : null}

          <Field.Select
            name="roleId"
            label={
              mode === 'create'
                ? `${t('users.form.fields.roles.label')} *`
                : t('users.form.fields.roles.label')
            }
          >
            <MenuItem value="">{t('usersClarity.table.filters.all')}</MenuItem>
            {roleOptions.map((option) => (
              <MenuItem key={option.id} value={String(option.id)}>
                {option.name}
              </MenuItem>
            ))}
          </Field.Select>

          <Field.Select name="perfil" label={t('usersClarity.form.fields.perfil')}>
            <MenuItem value="">
              {t('usersClarity.table.filters.all')}
            </MenuItem>
            {profiles.map((p) => (
              <MenuItem key={p.idperfil} value={String(p.idperfil)}>
                {p.nombreperfil}
              </MenuItem>
            ))}
          </Field.Select>

          <Field.Select name="unidadOrganizacional" label={t('usersClarity.form.fields.unidadOrganizacional')}>
            <MenuItem value="">
              {t('usersClarity.table.filters.all')}
            </MenuItem>
            {organizationalUnits.map((ou) => (
              <MenuItem key={ou.id} value={ou.code}>
                {ou.name}
              </MenuItem>
            ))}
          </Field.Select>

          <Field.Select name="cargos" label={t('usersClarity.form.fields.cargos')}>
            <MenuItem value="">
              {t('usersClarity.table.filters.all')}
            </MenuItem>
            {jobs.map((job) => (
              <MenuItem key={job.id} value={String(job.id)}>
                {job.name}
              </MenuItem>
            ))}
          </Field.Select>

          <Field.Select name="jefeInmediato" label={t('usersClarity.form.fields.jefeInmediato')}>
            <MenuItem value="">
              {t('usersClarity.table.filters.all')}
            </MenuItem>
            {activeUsers.map((u) => (
              <MenuItem key={u.idusuario} value={String(u.idusuario)}>
                {`${u.nombres} ${u.apellidos}${u.apellido2 ? ` ${u.apellido2}` : ''}`}
              </MenuItem>
            ))}
          </Field.Select>

          <Field.Select
            name="tipoAutenticacion"
            label={t('usersClarity.form.fields.tipoAutenticacion')}
          >
            {authenticationMethods.map((method) => (
              <MenuItem key={method} value={String(method)}>
                {method === 1 && 'Base de Datos'}
                {method === 2 && 'LDAP'}
                {method === 3 && 'Externo'}
              </MenuItem>
            ))}
          </Field.Select>

          <Field.Select name="estadoUsuario" label={t('usersClarity.form.fields.estadoUsuario')}>
            {userStates.map((state) => (
              <MenuItem key={state} value={String(state)}>
                {state === 0 && 'Activo'}
                {state === 1 && 'Preregistrado'}
                {state === 2 && 'Inactivo'}
                {state === 3 && 'Eliminado'}
              </MenuItem>
            ))}
          </Field.Select>

          <Field.Select name="tipoUsuario" label={t('usersClarity.form.fields.tipoUsuario')}>
            {usersTypes.map((value) => (
              <MenuItem key={value} value={String(value)}>
                {value === 1 && 'Interno'}
                {value === 2 && 'Externo'}
              </MenuItem>
            ))}
          </Field.Select>

          <Field.Text name="imagen" label={t('usersClarity.form.fields.imagen')} />
          <Field.Text name="alias" label={t('usersClarity.form.fields.alias')} />
          <Field.Text name="avatar" label={t('usersClarity.form.fields.avatar')} />
          <Field.Text
            name="numeroIdentificacion"
            label={t('usersClarity.form.fields.numeroIdentificacion')}
          />

          <Field.Select
            name="tipoIdentificacion"
            label={t('usersClarity.form.fields.tipoIdentificacion')}
          >
            <MenuItem value="">
              {t('usersClarity.table.filters.all')}
            </MenuItem>
            {documentTypes.map((code) => (
              <MenuItem key={code} value={code}>
                {code === 'CC' && 'Cédula de ciudadanía'}
                {code === 'TI' && 'Tarjeta de identidad'}
                {code === 'PP' && 'Pasaporte'}
              </MenuItem>
            ))}
          </Field.Select>

          <Field.Text
            name="correoElectronico2"
            label={t('usersClarity.form.fields.correoElectronico2')}
          />
          <Field.Text name="celular" label={t('usersClarity.form.fields.celular')} />
          <Field.Text
            name="direccionCasa"
            label={t('usersClarity.form.fields.direccionCasa')}
          />
          <Field.Text
            name="telefonoCasa"
            label={t('usersClarity.form.fields.telefonoCasa')}
          />
          <Field.Text
            name="direccionOficina"
            label={t('usersClarity.form.fields.direccionOficina')}
          />
          <Field.Text
            name="usuariosSistema"
            label={t('usersClarity.form.fields.usuariosSistema')}
          />

          <Field.Select name="tipoPersona" label={t('usersClarity.form.fields.tipoPersona')}>
            {personTypes.map((value) => (
              <MenuItem key={value} value={String(value)}>
                {value === 1 && 'Natural'}
                {value === 2 && 'Jurídica'}
              </MenuItem>
            ))}
          </Field.Select>

          <Field.Text name="empresa" label={t('usersClarity.form.fields.empresa')} />

          <FormControl fullWidth>
            <InputLabel>{t('usersClarity.form.fields.tipoEmpresa')}</InputLabel>
            <Select label={t('usersClarity.form.fields.tipoEmpresa')} defaultValue="">
              <MenuItem value="">
                {t('usersClarity.table.filters.all')}
              </MenuItem>
            </Select>
          </FormControl>

          <Field.Text
            name="nitEmpresa"
            label={t('usersClarity.form.fields.nitEmpresa')}
          />
          <Field.Text
            name="actividadEconomica"
            label={t('usersClarity.form.fields.actividadEconomica')}
          />

          <Field.Select name="lenguaje" label={t('usersClarity.form.fields.lenguaje')}>
            {languages.map((value) => (
              <MenuItem key={value} value={String(value)}>
                {value === 1 && 'Español'}
                {value === 2 && 'Inglés'}
              </MenuItem>
            ))}
          </Field.Select>

          <FormControl fullWidth>
            <InputLabel>{t('usersClarity.form.fields.zonaHoraria')}</InputLabel>
            <Select
              label={t('usersClarity.form.fields.zonaHoraria')}
              defaultValue="America/Bogota"
            >
              <MenuItem value="America/Bogota">America/Bogota</MenuItem>
              <MenuItem value="America/Guatemala">America/Guatemala</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Grid container spacing={2} sx={{ mt: 3 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Button fullWidth type="submit" variant="contained" loading={isSubmitting}>
              {t('usersClarity.form.actions.save')}
            </Button>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Button fullWidth variant="outlined" color="inherit" onClick={handleReset}>
              {t('usersClarity.form.actions.reset')}
            </Button>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Button fullWidth variant="outlined" color="inherit" onClick={handleCancel}>
              {t('usersClarity.form.actions.cancel')}
            </Button>
          </Grid>
        </Grid>
      </Card>
    </Form>
  );
}
