import type { IEmploymentType } from 'src/types/employees';

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
import { SaveOrUpdateTypeEmploymentService } from 'src/services/employees/employment-type.service';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export type EmploymentTypeCreateSchemaType = {
  name: string;
};

// ----------------------------------------------------------------------

type Props = {
  currentEmploymentType?: IEmploymentType;
};

export function EmploymentTypeCreateEditForm({ currentEmploymentType }: Props) {
  const router = useRouter();
  const { t } = useTranslate('employees');

  const EmploymentTypeCreateSchema = z.object({
    name: z.string().min(1, { message: t('employment-type.form.name.required') }),
  });

  const defaultValues: EmploymentTypeCreateSchemaType = {
    name: '',
  };

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(EmploymentTypeCreateSchema),
    defaultValues,
    values: currentEmploymentType,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const response = await SaveOrUpdateTypeEmploymentService(
        data,
        currentEmploymentType?.id
      );
      
      if (response.data.statusCode === 200 || response.data.statusCode === 201) {
        reset();
        toast.success(currentEmploymentType ? t('employment-type.messages.updateSuccess') : t('employment-type.messages.createSuccess'));
        router.push(paths.dashboard.employees.typeEmployment); // Ajustar la ruta según tu configuración
      }
    } catch (error) {
      console.error('Error saving employment type:', error);
      toast.error(t('employment-type.messages.saveError'));
    }
  });

  const renderDetails = () => (
    <Card>
      <Stack spacing={3} sx={{ p: 3 }}>
        <Typography variant="h6">{t('employment-type.form.sections.details')}</Typography>

        <Field.Text 
          name="name" 
          label={t('employment-type.form.fields.name.label')} 
          helperText={t('employment-type.form.fields.name.helperText')}
        />
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
        {t('employment-type.actions.cancel')}
      </Button>

      <Button
        size="medium"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator={t('employment-type.actions.saving')}
      >
        {currentEmploymentType ? t('employment-type.actions.update') : t('employment-type.actions.create')}
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