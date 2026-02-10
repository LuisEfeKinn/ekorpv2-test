import type { ILearningCategories } from 'src/types/learning';

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
import { SaveOrUpdateLearningCategoriesService } from 'src/services/learning/categories.service';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export type LearningCategoriesCreateSchemaType = {
  name: string;
  abreviation?: string;
  logo?: string | null;
};

// ----------------------------------------------------------------------

type Props = {
  currentLearningCategory?: ILearningCategories;
};

export function LearningCategoriesCreateEditForm({ currentLearningCategory }: Props) {
  const router = useRouter();
  const { t } = useTranslate('learning');

  const LearningCategoriesCreateSchema = z.object({
    name: z.string().min(1, { message: t('learningCategories.form.name.required') }),
    abreviation: z.string().optional(),
    logo: z.string().optional().nullable(),
  });

  const defaultValues: LearningCategoriesCreateSchemaType = {
    name: '',
    abreviation: '',
    logo: null
  };

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(LearningCategoriesCreateSchema),
    defaultValues,
    values: currentLearningCategory,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await SaveOrUpdateLearningCategoriesService(
        data,
        currentLearningCategory?.id
      );

      reset();
      toast.success(currentLearningCategory ? t('learningCategories.messages.updateSuccess') : t('learningCategories.messages.createSuccess'));
      router.push(paths.dashboard.learning.learningCategories); // Ruta de retorno
    } catch (error) {
      console.error('Error saving learning category:', error);
      toast.error(t('learningCategories.messages.saveError'));
    }
  });

  const renderDetails = () => (
    <Card>
      <Stack spacing={3} sx={{ p: 3 }}>
        <Typography variant="h6">{t('learningCategories.form.sections.details')}</Typography>

        <Box sx={{ display: 'grid', gap: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Field.Text
              name="name"
              label={t('learningCategories.form.fields.name.label')}
              helperText={t('learningCategories.form.fields.name.helperText')}
            />

            <Field.Text
              name="abreviation"
              label={t('learningCategories.form.fields.abreviation.label')}
              helperText={t('learningCategories.form.fields.abreviation.helperText')}
            />
          </Box>

          <Field.Text
            name="logo"
            label={t('learningCategories.form.fields.logo.label')}
            helperText={t('learningCategories.form.fields.logo.helperText')}
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
        {t('learningCategories.actions.cancel')}
      </Button>

      <Button
        size="medium"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator={t('learningCategories.actions.saving')}
      >
        {currentLearningCategory ? t('learningCategories.actions.update') : t('learningCategories.actions.create')}
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