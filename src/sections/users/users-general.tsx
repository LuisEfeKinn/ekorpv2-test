'use client';

import * as z from 'zod';
import { useState, useEffect } from 'react';
import { useBoolean } from 'minimal-shared/hooks';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { SaveOrUpdateUsersService } from 'src/services/security/users.service';
import { GetRolesPaginationService } from 'src/services/security/roles.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

type Props = {
  currentUser?: any; // Si hay currentUser = EDITAR, si no = CREAR
};

export function UsersGeneral({ currentUser }: Props) {
  const { t } = useTranslate('security');
  const router = useRouter();
  const [roleOptions, setRoleOptions] = useState<Array<{ id: string | number; name: string }>>([]);

  const showPassword = useBoolean();
  const showConfirmPassword = useBoolean();

  // Determinar si es edición o creación
  const isEdit = Boolean(currentUser?.id);

  useEffect(() => {
    const fetchRoles = async () => {
      const response = await GetRolesPaginationService({ page: 1, take: 100 });
      if (response.status === 200) {
        setRoleOptions(
          response.data.data.map((role: any) => ({
            id: role.id,
            name: role.name,
          }))
        );
      }
    };
    fetchRoles();
  }, []);

  const defaultValues: any = {
    avatarUrl: null,
    email: '',
    password: '',
    confirmPassword: '',
    names: '',
    lastnames: '',
    isActive: currentUser?.isActive ?? true,
    roleIds: Array.isArray(currentUser?.roles)
      ? currentUser.roles.map((role: any) => (typeof role === 'object' ? role.id : role))
      : [],
    tel: currentUser?.tel || '',
    documentId: currentUser?.documentId || '',
    biometricIsActive: currentUser?.biometricIsActive ?? true,
    ...currentUser,
  };

  // Schema dinámico según si es crear o editar
  const UserSchema = z
    .object({
      avatarUrl: z.any().optional(),
      email: z.string().email({ message: t('users.form.validation.emailRequired') }),
      password: isEdit
        ? z.string().optional()
        : z.string().min(6, { message: t('users.form.validation.passwordRequired') }),
      confirmPassword: isEdit
        ? z.string().optional()
        : z.string().min(6, { message: t('users.form.validation.confirmPasswordRequired') }),
      names: z.string().min(1, { message: t('users.form.validation.namesRequired') }),
      lastnames: z.string().min(1, { message: t('users.form.validation.lastnamesRequired') }),
      isActive: z.boolean(),
      roleIds: z.array(z.union([z.string(), z.number()]))
        .nonempty({ message: t('users.form.validation.roleRequired') }),
      tel: z.string().min(1, { message: t('users.form.validation.telRequired') }),
      documentId: z.string().min(1, { message: t('users.form.validation.documentIdRequired') }),
      biometricIsActive: isEdit ? z.boolean().optional() : z.boolean(),
    })
    .refine(
      (data) => isEdit || data.password === data.confirmPassword,
      {
        message: t('users.form.validation.confirmPasswordMatch'),
        path: ['confirmPassword'],
      }
    );

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(UserSchema),
    defaultValues,
  });

  const {
    reset,
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload = {
        email: data.email,
        names: data.names,
        lastnames: data.lastnames,
        isActive: data.isActive,
        roleIds: Array.isArray(data.roleIds)
          ? data.roleIds.map((role: any) => (typeof role === 'object' ? role.id : role))
          : [],
        tel: data.tel,
        documentId: data.documentId,
        ...(isEdit ? {} : { biometricIsActive: data.biometricIsActive }),
        // Solo incluir password si es creación o si se proporciona en edición
        ...(data.password ? { password: data.password } : {}),
      };

      await SaveOrUpdateUsersService(payload, currentUser?.id);
      toast.success(isEdit ? t('users.messages.success.updated') : t('users.messages.success.created'));
      reset();
      router.push(paths.dashboard.security.users);
    } catch (error) {
      console.error(error);
      toast.error(isEdit ? t('users.messages.error.updating') : t('users.messages.error.creating'));
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ pt: 10, pb: 5, px: 3 }}>
            <Box sx={{ mb: 5 }}>
              <Field.UploadAvatar
                name="avatarUrl"
                maxSize={3145728}
                disabled
                helperText={
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 3,
                      mx: 'auto',
                      display: 'block',
                      textAlign: 'center',
                      color: 'text.disabled',
                    }}
                  >
                    {t('users.form.fields.avatar.helperText')}
                  </Typography>
                }
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                {t('users.form.fields.status.label')}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                {t('users.form.fields.status.helperText')}
              </Typography>
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <>
                    <Switch
                      checked={field.value}
                      onChange={e => field.onChange(e.target.checked)}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: field.value ? 'success.main' : 'error.main',
                        mt: 1,
                      }}
                    >
                      {field.value ? t('users.status.active') : t('users.status.inactive')}
                    </Typography>
                  </>
                )}
              />
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ p: 3 }}>
            <Box
              sx={{
                rowGap: 3,
                columnGap: 2,
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
              }}
            >
              <Field.Text name="names" label={t('users.form.fields.names.label')} />
              <Field.Text name="lastnames" label={t('users.form.fields.lastnames.label')} />
              <Field.Text name="email" label={t('users.form.fields.email.label')} />

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
                      onChange={(e) => field.onChange(e.target.value)}
                      label={t('users.form.fields.roles.label')}
                      renderValue={(selected) =>
                        roleOptions
                          .filter((option: any) => selected.includes(option.id))
                          .map((option) => option.name)
                          .join(', ')
                      }
                    >
                      {roleOptions.map((option) => (
                        <MenuItem key={option.id} value={option.id}>
                          {option.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />

              <Field.Text name="tel" label={t('users.form.fields.tel.label')} />
              <Field.Text name="documentId" label={t('users.form.fields.documentId.label')} />

              <Controller
                name="biometricIsActive"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel id="biometricIsActive-label">
                      {t('users.form.fields.biometricIsActive.label')}
                    </InputLabel>
                    <Select
                      labelId="biometricIsActive-label"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value === 'true')}
                      label={t('users.form.fields.biometricIsActive.label')}
                    >
                      <MenuItem value="true">{t('users.status.active')}</MenuItem>
                      <MenuItem value="false">{t('users.status.inactive')}</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Box>

            {/* Campos de contraseña separados */}
            {!isEdit && (
              <Box
                sx={{
                  mt: 3,
                  rowGap: 3,
                  columnGap: 2,
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
                }}
              >
                <Field.Text
                  name="password"
                  label={t('users.form.fields.password.label')}
                  type={showPassword.value ? 'text' : 'password'}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={showPassword.onToggle} edge="end">
                            <Iconify
                              icon={
                                showPassword.value
                                  ? 'solar:eye-bold'
                                  : 'solar:eye-closed-bold'
                              }
                            />
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <Field.Text
                  name="confirmPassword"
                  label={t('users.form.fields.confirmPassword.label')}
                  type={showConfirmPassword.value ? 'text' : 'password'}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={showConfirmPassword.onToggle} edge="end">
                            <Iconify
                              icon={
                                showConfirmPassword.value
                                  ? 'solar:eye-bold'
                                  : 'solar:eye-closed-bold'
                              }
                            />
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
            )}

            <Stack sx={{ mt: 3, alignItems: 'flex-end' }}>
              <Button type="submit" variant="contained" loading={isSubmitting}>
                {isEdit ? t('users.actions.save') : t('users.actions.create')}
              </Button>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Form>
  );
}