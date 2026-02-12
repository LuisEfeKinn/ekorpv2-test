import type { IRole } from 'src/types/roles';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { SaveOrUpdateRolesService } from 'src/services/security/roles.service';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export type RoleCreateSchemaType = {
  name: string;
  description: string;
};

// ----------------------------------------------------------------------

type Props = {
  currentRole?: IRole;
};

export function RoleCreateEditForm({ currentRole }: Props) {
  const router = useRouter();
  const { t } = useTranslate('security');

  const RoleCreateSchema = z.object({
    name: z
      .string()
      .min(1, { message: t('roles.form.validation.nameRequired') })
      .min(2, { message: t('roles.form.validation.nameMinLength') })
      .max(50, { message: t('roles.form.validation.nameMaxLength') }),
    description: z
      .string()
      .min(1, { message: t('roles.form.validation.descriptionRequired') })
      .max(200, { message: t('roles.form.validation.descriptionMaxLength') }),
  });

  const defaultValues: RoleCreateSchemaType = {
    name: '',
    description: '',
  };

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(RoleCreateSchema),
    defaultValues,
    values: currentRole,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const response = await SaveOrUpdateRolesService(
        data,
        currentRole?.id
      );
      
      if (response.data.statusCode === 200 || response.data.statusCode === 201) {
        reset();
        toast.success(
          currentRole 
            ? t('roles.messages.success.updated') 
            : t('roles.messages.success.created')
        );
        router.push(paths.dashboard.security.roles);
      }
    } catch (error) {
      console.error('Error saving role:', error);
      toast.error(
        currentRole 
          ? t('roles.messages.error.updating') 
          : t('roles.messages.error.creating')
      );
    }
  });

  const renderDetails = () => (
    <Card>
      <Stack spacing={3} sx={{ p: 3 }}>
        <Typography variant="h6">
          {t('roles.form.sections.details')}
        </Typography>

        <Box sx={{ display: 'grid', gap: 2 }}>
          <Field.Text 
            name="name" 
            label={t('roles.form.fields.name.label')} 
            helperText={t('roles.form.fields.name.helperText')}
          />

          <Field.Text 
            name="description" 
            label={t('roles.form.fields.description.label')} 
            helperText={t('roles.form.fields.description.helperText')}
            multiline
            rows={4}
          />
        </Box>
      </Stack>
    </Card>
  );

  const renderActions = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: 'flex-start' }}>
      <Button
        size="medium"
        variant="soft"
        color="inherit"
        onClick={() => router.back()}
      >
        {t('roles.actions.cancel')}
      </Button>

      <Button
        size="medium"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator={t('roles.actions.save')}
      >
        {currentRole ? t('roles.actions.update') : t('roles.actions.create')}
      </Button>
    </Box>
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={3}>
        {renderDetails()}
        {renderActions()}
      </Stack>
    </Form>
  );
}