import type { IRewardsCategories } from 'src/types/rewards';

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
import { SaveOrUpdateRewardCategoryService } from 'src/services/rewards/rewardCategory.service';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export type RewardsCategoriesCreateSchemaType = {
  name: string;
  abreviation?: string;
  description?: string;
};

// ----------------------------------------------------------------------

type Props = {
  currentCategory?: IRewardsCategories;
};

export function RewardsCategoriesCreateEditForm({ currentCategory }: Props) {
  const router = useRouter();
  const { t } = useTranslate('rewards');

  const RewardsCategoriesCreateSchema = z.object({
    name: z.string().min(1, { message: t('rewards-categories.form.name.required') }),
    abreviation: z.string().optional(),
  });

  const defaultValues: RewardsCategoriesCreateSchemaType = {
    name: '',
    abreviation: '',
  };

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(RewardsCategoriesCreateSchema),
    defaultValues,
    values: currentCategory,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const response = await SaveOrUpdateRewardCategoryService(
        data,
        currentCategory?.id
      );

      if (response.data.statusCode === 200 || response.data.statusCode === 201) {
        reset();
        toast.success(currentCategory ? t('rewards-categories.messages.updateSuccess') : t('rewards-categories.messages.createSuccess'));
        router.push(paths.dashboard.rewards.rewardsCategories); // Ruta de retorno
      }
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(t('rewards-categories.messages.saveError'));
    }
  });

  const renderDetails = () => (
    <Card>
      <Stack spacing={3} sx={{ p: 3 }}>
        <Typography variant="h6">{t('rewards-categories.form.sections.details')}</Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <Field.Text
            name="name"
            label={t('rewards-categories.form.fields.name.label')}
            helperText={t('rewards-categories.form.fields.name.helperText')}
          />

          <Field.Text
            name="abreviation"
            label={t('rewards-categories.form.fields.abreviation.label')}
            helperText={t('rewards-categories.form.fields.abreviation.helperText')}
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
        {t('rewards-categories.actions.cancel')}
      </Button>

      <Button
        size="medium"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator={t('rewards-categories.actions.saving')}
      >
        {currentCategory ? t('rewards-categories.actions.update') : t('rewards-categories.actions.create')}
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