import type { IRewardsRuleType } from 'src/types/rewards';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { SaveOrUpdateRewardRuleTypeService } from 'src/services/rewards/ruleType.service';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export type RewardsRuleTypesCreateSchemaType = {
  name: string;
  abreviation?: string;
  description?: string;
};

// ----------------------------------------------------------------------

type Props = {
  currentRuleType?: IRewardsRuleType;
};

export function RewardsRuleTypesCreateEditForm({ currentRuleType }: Props) {
  const router = useRouter();
  const { t } = useTranslate('rewards');

  const RewardsRuleTypesCreateSchema = z.object({
    name: z.string().min(1, { message: t('rewards-rule-types.form.name.required') }),
    abreviation: z.string().optional(),
  });

  const defaultValues: RewardsRuleTypesCreateSchemaType = {
    name: '',
    abreviation: '',
  };

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(RewardsRuleTypesCreateSchema),
    defaultValues,
    values: currentRuleType,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const response = await SaveOrUpdateRewardRuleTypeService(
        data,
        currentRuleType?.id
      );

      if (response.data.statusCode === 200 || response.data.statusCode === 201) {
        reset();
        toast.success(currentRuleType ? t('rewards-rule-types.messages.updateSuccess') : t('rewards-rule-types.messages.createSuccess'));
        router.push(paths.dashboard.rewards.rewardsRuleType); // Ruta de retorno
      }
    } catch (error) {
      console.error('Error saving rule type:', error);
      toast.error(t('rewards-rule-types.messages.saveError'));
    }
  });

  const renderDetails = () => (
    <Card>
      <Stack spacing={3} sx={{ p: 3 }}>
        <Typography variant="h6">{t('rewards-rule-types.form.sections.details')}</Typography>
        <Field.Text
          name="name"
          label={t('rewards-rule-types.form.fields.name.label')}
          helperText={t('rewards-rule-types.form.fields.name.helperText')}
          fullWidth
        />

        <Field.Text
          name="description"
          label={t('rewards-rule-types.form.fields.description.label')}
          helperText={t('rewards-rule-types.form.fields.description.helperText')}
          fullWidth
        />
      </Stack>
    </Card>
  );

  const renderActions = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
      <Button
        size="large"
        variant="soft"
        color="inherit"
        onClick={() => router.back()}
      >
        {t('rewards-rule-types.actions.cancel')}
      </Button>

      <Button
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator={t('rewards-rule-types.actions.saving')}
      >
        {currentRuleType ? t('rewards-rule-types.actions.update') : t('rewards-rule-types.actions.create')}
      </Button>
    </Box>
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={3}>
            {renderDetails()}
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3}>
            {renderActions()}
          </Stack>
        </Grid>
      </Grid>
    </Form>
  );
}