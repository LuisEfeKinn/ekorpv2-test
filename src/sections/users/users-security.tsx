'use client';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { useTranslate } from 'src/locales';
import { ChangeUserPasswordService } from 'src/services/security/users.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

type Props = {
  currentUser?: any;
};

export function UsersSecurity({ currentUser }: Props) {
  const { t } = useTranslate('security');

  const showOldPassword = useBoolean();
  const showNewPassword = useBoolean();
  const showConfirmPassword = useBoolean();

  const ChangePasswordSchema = z.object({
    oldPassword: z.string().min(1, { message: t('users.form.validation.oldPasswordRequired') }),
    newPassword: z.string().min(6, { message: t('users.form.validation.newPasswordRequired') }),
    confirmPassword: z.string().min(6, { message: t('users.form.validation.confirmPasswordRequired') }),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: t('users.form.validation.confirmPasswordMatch'),
    path: ['confirmPassword'],
  });

  const defaultValues = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  };

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await ChangeUserPasswordService(currentUser?.id, { 
        oldPassword: data.oldPassword,
        newPassword: data.newPassword 
      });
      toast.success(t('users.messages.success.passwordChanged'));
      reset();
    } catch (error) {
      console.error(error);
      toast.error(t('users.messages.error.changingPassword'));
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={3} alignItems="flex-end">
        <Card sx={{ p: 3, width: 1 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            {t('users.security.changePassword')}
          </Typography>
          
          <Box
            sx={{
              rowGap: 3,
              columnGap: 2,
              display: 'grid',
              gridTemplateColumns: '1fr',
            }}
          >
            <Field.Text
              name="oldPassword"
              label={t('users.form.fields.oldPassword.label')}
              type={showOldPassword.value ? 'text' : 'password'}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={showOldPassword.onToggle} edge="end">
                        <Iconify
                          icon={showOldPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                        />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Field.Text
              name="newPassword"
              label={t('users.form.fields.newPassword.label')}
              type={showNewPassword.value ? 'text' : 'password'}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={showNewPassword.onToggle} edge="end">
                        <Iconify
                          icon={showNewPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                        />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Field.Text
              name="confirmPassword"
              label={t('users.form.fields.confirmNewPassword.label')}
              type={showConfirmPassword.value ? 'text' : 'password'}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={showConfirmPassword.onToggle} edge="end">
                        <Iconify
                          icon={showConfirmPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                        />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>

          <Stack spacing={3} alignItems="flex-end" sx={{ mt: 3 }}>
            <Button type="submit" variant="contained" loading={isSubmitting}>
              {t('users.actions.changePassword')}
            </Button>
          </Stack>
        </Card>
      </Stack>
    </Form>
  );
}