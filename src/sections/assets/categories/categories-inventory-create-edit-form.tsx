import type { ICategoriesInventory } from 'src/types/assets';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { SaveOrUpdateCategoriesService } from 'src/services/assets/categories.service';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export type CategoriesInventorySchemaType = {
  name: string;
  isActive: boolean;
};

// ----------------------------------------------------------------------

type Props = {
  currentCategory?: ICategoriesInventory;
};

export function CategoriesInventoryCreateEditForm({ currentCategory }: Props) {
  const router = useRouter();
  const { t } = useTranslate('assets');

  const CategoriesInventorySchema = z.object({
    name: z.string().min(1, { message: t('categories.form.name.required') }),
    isActive: z.boolean(),
  });

  const defaultValues: CategoriesInventorySchemaType = {
    name: currentCategory?.name || '',
    isActive: currentCategory?.isActive ?? true,
  };

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(CategoriesInventorySchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    const payload = {
      name: data.name,
      isActive: data.isActive,
    };
    
    try {
      await SaveOrUpdateCategoriesService(payload, currentCategory?.id);
      reset();
      toast.success(currentCategory ? t('categories.messages.success.updateSuccess') : t('categories.messages.success.createSuccess'));
      router.push(paths.dashboard.assets.inventoryCategories);
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(t('categories.messages.error.saveError'));
    }
  });

  const renderDetails = () => (
    <Card>
      <Stack spacing={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'grid', gap: 2 }}>
          <Field.Text
            name="name"
            label={t('categories.form.fields.name.label')}
            helperText={t('categories.form.fields.name.helperText')}
          />
          <Field.Switch
            name="isActive"
            label={t('categories.form.fields.isActive.label')}
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
        {t('categories.form.actions.cancel')}
      </Button>
      <Button
        size="medium"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator={t('categories.form.actions.saving')}
      >
        {currentCategory ? t('categories.form.actions.update') : t('categories.form.actions.create')}
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