'use client';

import type { IUserProfile, IUserProfileUpdate } from 'src/types/user-profile';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fDateTime } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';
import { UpdateUserProfileService } from 'src/services/auth/user.service';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { ImageUploader } from 'src/components/image-uploader';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

type Props = {
  currentProfile: IUserProfile;
};

export function UserProfileEditForm({ currentProfile }: Props) {
  const { t } = useTranslate('user-profile');
  const router = useRouter();
  const { checkUserSession } = useAuthContext();

  const UserProfileSchema = z.object({
    names: z.string().min(1, { message: t('form.validation.namesRequired') }),
    lastnames: z.string().min(1, { message: t('form.validation.lastnamesRequired') }),
    tel: z.string().min(1, { message: t('form.validation.telRequired') }),
    avatarUrl: z.string().nullable().optional(),
  });

  type UserProfileSchemaType = z.infer<typeof UserProfileSchema>;

  const defaultValues: UserProfileSchemaType = {
    names: currentProfile.names || '',
    lastnames: currentProfile.lastnames || '',
    tel: currentProfile.tel || '',
    avatarUrl: currentProfile.avatar || null,
  };

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(UserProfileSchema),
    defaultValues,
    values: defaultValues,
  });

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload: IUserProfileUpdate = {
        names: data.names,
        lastnames: data.lastnames,
        tel: data.tel,
        avatar: data.avatarUrl || '',
      };

      const response = await UpdateUserProfileService(payload);

      if (response.data?.statusCode === 200) {
        toast.success(t('messages.success.updated'));
        await checkUserSession?.();
        router.push(paths.dashboard.root);
      }
    } catch (error) {
      console.error(error);
      toast.error(t('messages.error.updating'));
    }
  });

  const renderStatusLabel = (active: boolean, activeLabel: string, inactiveLabel: string) => (
    <Label color={active ? 'success' : 'error'}>{active ? activeLabel : inactiveLabel}</Label>
  );

  const renderLinkedLabel = (linked: boolean) =>
    renderStatusLabel(linked, t('status.linked'), t('status.notLinked'));

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ pt: 10, pb: 5, px: 3 }}>
            <Box sx={{ mb: 5 }}>
              <ImageUploader
                imageUrl={watch('avatarUrl')}
                maxSize={3145728}
                acceptedFileTypes={['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp']}
                onUploadSuccess={(url) => {
                  setValue('avatarUrl', url, { shouldValidate: true, shouldDirty: true });
                }}
                onDeleteSuccess={() => {
                  setValue('avatarUrl', '', { shouldValidate: true, shouldDirty: true });
                }}
              />

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
                {t('form.fields.avatar.helperText')}
              </Typography>
            </Box>

            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {t('form.fields.roles.label')}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                  {currentProfile.roles?.map((role) => (
                    <Label key={role.id} color="primary">
                      {role.name}
                    </Label>
                  ))}
                </Box>
              </Box>

              <Divider sx={{ borderStyle: 'dashed' }} />

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {t('form.fields.status.label')}
                </Typography>
                {renderStatusLabel(
                  currentProfile.isActive,
                  t('status.active'),
                  t('status.inactive')
                )}
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={3}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                {t('sections.personalInfo')}
              </Typography>

              <Box
                sx={{
                  rowGap: 3,
                  columnGap: 2,
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
                }}
              >
                <Field.Text name="names" label={t('form.fields.names.label')} />
                <Field.Text name="lastnames" label={t('form.fields.lastnames.label')} />
                <Field.Text name="tel" label={t('form.fields.tel.label')} />

                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                    {t('form.fields.email.label')}
                  </Typography>
                  <Typography variant="subtitle2">{currentProfile.email}</Typography>
                </Box>

                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                    {t('form.fields.documentId.label')}
                  </Typography>
                  <Typography variant="subtitle2">{currentProfile.documentId}</Typography>
                </Box>
              </Box>
            </Card>

            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                {t('sections.security')}
              </Typography>

              <Box
                sx={{
                  rowGap: 2.5,
                  columnGap: 2,
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.75 }}>
                    {t('form.fields.biometric.label')}
                  </Typography>
                  {renderStatusLabel(
                    currentProfile.biometricIsActive,
                    t('status.enabled'),
                    t('status.disabled')
                  )}
                </Box>

                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.75 }}>
                    {t('form.fields.twoFactor.label')}
                  </Typography>
                  {renderStatusLabel(
                    currentProfile.twoFactorAuthIsActive,
                    t('status.enabled'),
                    t('status.disabled')
                  )}
                </Box>

                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.75 }}>
                    {t('form.fields.googleLinked.label')}
                  </Typography>
                  {renderLinkedLabel(currentProfile.hasGoogleLinked)}
                </Box>

                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.75 }}>
                    {t('form.fields.microsoftLinked.label')}
                  </Typography>
                  {renderLinkedLabel(currentProfile.hasMicrosoftLinked)}
                </Box>
              </Box>
            </Card>

            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                {t('sections.accountInfo')}
              </Typography>

              <Box
                sx={{
                  rowGap: 2,
                  columnGap: 2,
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                    {t('form.fields.createdAt.label')}
                  </Typography>
                  <Typography variant="subtitle2">{fDateTime(currentProfile.createdAt)}</Typography>
                </Box>

                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                    {t('form.fields.updatedAt.label')}
                  </Typography>
                  <Typography variant="subtitle2">{fDateTime(currentProfile.updatedAt)}</Typography>
                </Box>
              </Box>
            </Card>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="contained" loading={isSubmitting}>
                {t('form.actions.save')}
              </Button>
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </Form>
  );
}
