'use client';

import type { IJob } from 'src/types/architecture/jobs';
import type { IOrganizationalUnit } from 'src/types/organization';
import type { IUserClarity, IUserClarityCreatePayload } from 'src/types/users';

import * as z from 'zod';
import { useForm, Controller } from 'react-hook-form';
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

const userClaritySchema = (t: (key: string) => string) =>
  z.object({
    nombres: z.string().min(1, { message: t('usersClarity.form.validation.nombresRequired') }),
    primerApellido: z
      .string()
      .min(1, { message: t('usersClarity.form.validation.primerApellidoRequired') }),
    segundoApellido: z
      .string()
      .min(1, { message: t('usersClarity.form.validation.segundoApellidoRequired') }),
    usuario: z.string().min(1, { message: t('usersClarity.form.validation.usuarioRequired') }),
    correoElectronico1: z
      .string()
      .min(1, { message: t('usersClarity.form.validation.correoElectronico1Required') }),
    codigoEmpleado: z
      .string()
      .min(1, { message: t('usersClarity.form.validation.codigoEmpleadoRequired') }),
    clave: z.string().min(1, { message: t('usersClarity.form.validation.claveRequired') }),
    perfil: z.string(),
    unidadOrganizacional: z.string(),
    cargos: z.string(),
    jefeInmediato: z.string(),
    tipoAutenticacion: z.string(),
    estadoUsuario: z.string(),
    tipoUsuario: z.string(),
    imagen: z.string(),
    alias: z.string(),
    avatar: z.string(),
    numeroIdentificacion: z.string(),
    tipoIdentificacion: z.string(),
    correoElectronico2: z.string(),
    celular: z.string(),
    direccionCasa: z.string(),
    telefonoCasa: z.string(),
    direccionOficina: z.string(),
    usuariosSistema: z.string(),
    tipoPersona: z.string(),
    empresa: z.string(),
    tipoEmpresa: z.string(),
    nitEmpresa: z.string(),
    actividadEconomica: z.string(),
    lenguaje: z.string(),
    zonaHoraria: z.string(),
    roleIds: z.array(z.string()).min(1, { message: t('users.form.validation.roleRequired') }),
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
    resolver: zodResolver(userClaritySchema(t)),
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
      roleIds: [],
    },
  });

  const {
    handleSubmit,
    reset,
    control,
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
      codigoEmpleado: '',
      clave: '',
      perfil: '',
      unidadOrganizacional: '',
      cargos: '',
      jefeInmediato: '',
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
      roleIds: user.roleIds ?? user.linkedUserRoles?.map((r) => r.id) ?? [],
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
        roleIds: [],
      });
    }
  }, [initialUser, mapUserToFormValues, reset]);

  const buildPayload = useCallback(
    (values: UserClarityFormValues): IUserClarityCreatePayload & {
      perfil?: { id: number };
      profile?: { id: number };
      UsersClarity?: { id: number };
      immediateSupervisor?: { id: number };
      actores?: { id: number };
      job?: { id: number };
    } => ({
      nombres: values.nombres,
      apellidos: values.primerApellido,
      apellido2: values.segundoApellido || null,
      usuario: values.usuario,
      clave: values.clave,
      correoElectronico: values.correoElectronico1,
      fechaCreacion: new Date().toISOString(),
      fechaSuspension: null,
      imagen: values.imagen || null,
      tipo: values.tipoUsuario === '1' ? 'INTERNAL' : 'EXTERNAL',
      fechaultimologin: null,
      intentoslogin: 0,
      tipousuario: Number(values.tipoUsuario),
      zonahoraria: values.zonaHoraria || 'America/Bogota',
      identificacion: values.numeroIdentificacion,
      avatarusuario: values.avatar || null,
      direccioncasa: values.direccionCasa,
      direccionoficina: values.direccionOficina,
      telefonocasa: values.telefonoCasa,
      telefonooficina: values.telefonoCasa,
      telefonocelular: values.celular,
      correoelectronico2: values.correoElectronico2 || null,
      alias: values.alias,
      fechamodificacion: null,
      estadousuario: Number(values.estadoUsuario),
      lenguaje: Number(values.lenguaje),
      empresa: values.empresa,
      nitempresa: values.nitEmpresa,
      actividadeconomica: values.actividadEconomica,
      tipopersona: Number(values.tipoPersona),
      tipoautenticacion: Number(values.tipoAutenticacion),
      indcambiopwd: 0,
      tokenpwd: null,
      descripcionPerfil:
        profiles.find((p) => String(p.idperfil) === values.perfil)?.nombreperfil || values.perfil,
      perfil: values.perfil ? { id: Number(values.perfil) } : undefined,
      profile: values.perfil ? { id: Number(values.perfil) } : undefined,
      immediateSupervisor: values.jefeInmediato
        ? { id: Number(values.jefeInmediato) }
        : undefined,
      actores: values.cargos ? { id: Number(values.cargos) } : undefined,
      job: values.cargos ? { id: Number(values.cargos) } : undefined,
      UsersClarity: values.jefeInmediato ? { id: Number(values.jefeInmediato) } : undefined,
      template: 'saga',
      templateTheme: 'blue',
      templateLayout: 'horizontal',
      templateMenuMode: 'static',
      templateOrientationRtl: 'N',
      templateHorizontal: 'Y',
      templateDarkMenu: 'N',
      templateDarkMode: 'N',
      templateLayoutPrimaryColor: '#1976D2',
      templateComponentTheme: 'blue',
      templateMenuTheme: 'blue',
      templateMenuColor: '#FFFFFF',
      roleIds: values.roleIds,
    }),
    [profiles]
  );

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload = buildPayload(data);
      if (mode === 'edit' && initialUser) {
        await UpdateUserClarityService(initialUser.idusuario, payload);
        toast.success(t('users.actions.update'));
      } else {
        await CreateUserClarityService(payload);
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
          <Field.Text name="nombres" label={t('usersClarity.form.fields.nombres')} />
          <Field.Text
            name="primerApellido"
            label={t('usersClarity.form.fields.primerApellido')}
          />
          <Field.Text
            name="segundoApellido"
            label={t('usersClarity.form.fields.segundoApellido')}
          />
          <Field.Text name="usuario" label={t('usersClarity.form.fields.usuario')} />
          <Field.Text
            name="correoElectronico1"
            label={t('usersClarity.form.fields.correoElectronico1')}
          />
          <Field.Text
            name="codigoEmpleado"
            label={t('usersClarity.form.fields.codigoEmpleado')}
          />
          <Field.Text name="clave" label={t('usersClarity.form.fields.clave')} type="password" />

          <Controller
            name="roleIds"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel id="roleIds-label">{t('users.form.fields.roles.label')}</InputLabel>
                <Select
                  labelId="roleIds-label"
                  multiple
                  value={field.value}
                  onChange={(e) =>
                    field.onChange((e.target.value as Array<string | number>).map(String))
                  }
                  label={t('users.form.fields.roles.label')}
                  renderValue={(selected) =>
                    roleOptions
                      .filter((option) => selected.includes(String(option.id)))
                      .map((option) => option.name)
                      .join(', ')
                  }
                >
                  {roleOptions.map((option) => (
                    <MenuItem key={option.id} value={String(option.id)}>
                      {option.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />

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
              <MenuItem key={ou.id} value={ou.id}>
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
