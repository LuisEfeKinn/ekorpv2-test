'use client';

import type { IUserClarityCreatePayload } from 'src/types/users';

import * as z from 'zod';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

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
import { CreateUserClarityService } from 'src/services/security/users.service';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

type UsersClarityCreateFormProps = {
  onSuccess?: () => void;
  onCancel?: () => void;
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
  });

type UserClarityFormValues = z.infer<ReturnType<typeof userClaritySchema>>;

export function UsersClarityCreateForm({ onSuccess, onCancel }: UsersClarityCreateFormProps) {
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
      tipoAutenticacion: 'Base de Datos',
      estadoUsuario: 'Activo',
      tipoUsuario: 'Interno',
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
      tipoPersona: '',
      empresa: '',
      tipoEmpresa: '',
      nitEmpresa: '',
      actividadEconomica: '',
      lenguaje: 'Español',
      zonaHoraria: 'America/Bogota',
    },
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = methods;

  const buildPayload = useCallback(
    (values: UserClarityFormValues): IUserClarityCreatePayload => ({
      nombres: values.nombres,
      apellidos: values.primerApellido,
      apellido2: values.segundoApellido || null,
      usuario: values.usuario,
      clave: values.clave,
      correoElectronico: values.correoElectronico1,
      fechaCreacion: new Date().toISOString(),
      fechaSuspension: null,
      imagen: values.imagen || null,
      tipo: values.tipoUsuario || 'INTERNAL',
      fechaultimologin: null,
      intentoslogin: 0,
      tipousuario: values.tipoUsuario === 'Interno' ? 1 : 2,
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
      estadousuario: values.estadoUsuario === 'Activo' ? 1 : 0,
      lenguaje: values.lenguaje === 'Español' ? 1 : 2,
      empresa: values.empresa,
      nitempresa: values.nitEmpresa,
      actividadeconomica: values.actividadEconomica,
      tipopersona: values.tipoPersona === 'Natural' ? 1 : 2,
      tipoautenticacion: values.tipoAutenticacion === 'Base de Datos' ? 1 : 2,
      indcambiopwd: 0,
      tokenpwd: null,
      descripcionPerfil: values.perfil,
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
    }),
    []
  );

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload = buildPayload(data);
      await CreateUserClarityService(payload);
      toast.success(t('users.actions.create'));
      reset();
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(paths.dashboard.userAdministration.usersTable);
      }
    } catch (error) {
      toast.error(t('users.messages.error.creating'));
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

          <FormControl fullWidth>
            <InputLabel>{t('usersClarity.form.fields.perfil')}</InputLabel>
            <Select label={t('usersClarity.form.fields.perfil')} defaultValue="">
              <MenuItem value="">
                {t('usersClarity.table.filters.all')}
              </MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>{t('usersClarity.form.fields.unidadOrganizacional')}</InputLabel>
            <Select label={t('usersClarity.form.fields.unidadOrganizacional')} defaultValue="">
              <MenuItem value="">
                {t('usersClarity.table.filters.all')}
              </MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>{t('usersClarity.form.fields.cargos')}</InputLabel>
            <Select label={t('usersClarity.form.fields.cargos')} defaultValue="">
              <MenuItem value="">
                {t('usersClarity.table.filters.all')}
              </MenuItem>
            </Select>
          </FormControl>

          <Field.Text
            name="jefeInmediato"
            label={t('usersClarity.form.fields.jefeInmediato')}
          />

          <FormControl fullWidth>
            <InputLabel>{t('usersClarity.form.fields.tipoAutenticacion')}</InputLabel>
            <Select
              label={t('usersClarity.form.fields.tipoAutenticacion')}
              defaultValue="Base de Datos"
            >
              <MenuItem value="Base de Datos">Base de Datos</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>{t('usersClarity.form.fields.estadoUsuario')}</InputLabel>
            <Select
              label={t('usersClarity.form.fields.estadoUsuario')}
              defaultValue="Activo"
            >
              <MenuItem value="Activo">Activo</MenuItem>
              <MenuItem value="Inactivo">Inactivo</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>{t('usersClarity.form.fields.tipoUsuario')}</InputLabel>
            <Select label={t('usersClarity.form.fields.tipoUsuario')} defaultValue="Interno">
              <MenuItem value="Interno">Interno</MenuItem>
              <MenuItem value="Externo">Externo</MenuItem>
            </Select>
          </FormControl>

          <Field.Text name="imagen" label={t('usersClarity.form.fields.imagen')} />
          <Field.Text name="alias" label={t('usersClarity.form.fields.alias')} />
          <Field.Text name="avatar" label={t('usersClarity.form.fields.avatar')} />
          <Field.Text
            name="numeroIdentificacion"
            label={t('usersClarity.form.fields.numeroIdentificacion')}
          />

          <FormControl fullWidth>
            <InputLabel>{t('usersClarity.form.fields.tipoIdentificacion')}</InputLabel>
            <Select label={t('usersClarity.form.fields.tipoIdentificacion')} defaultValue="">
              <MenuItem value="">
                {t('usersClarity.table.filters.all')}
              </MenuItem>
            </Select>
          </FormControl>

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

          <FormControl fullWidth>
            <InputLabel>{t('usersClarity.form.fields.tipoPersona')}</InputLabel>
            <Select label={t('usersClarity.form.fields.tipoPersona')} defaultValue="">
              <MenuItem value="Natural">Natural</MenuItem>
              <MenuItem value="Juridica">Jurídica</MenuItem>
            </Select>
          </FormControl>

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

          <FormControl fullWidth>
            <InputLabel>{t('usersClarity.form.fields.lenguaje')}</InputLabel>
            <Select label={t('usersClarity.form.fields.lenguaje')} defaultValue="Español">
              <MenuItem value="Español">Español</MenuItem>
            </Select>
          </FormControl>

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
