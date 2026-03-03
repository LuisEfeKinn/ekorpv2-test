import type { IRewardsRule, IRewardsRuleType } from 'src/types/rewards';

import * as z from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { SaveOrUpdateRewardRuleService } from 'src/services/rewards/rules.service';
import { GetRewardRuleTypePaginationService } from 'src/services/rewards/ruleType.service';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export type RewardRulesCreateSchemaType = {
  name: string;
  description: string;
  points: number;
  typeRuleId: IRewardsRuleType | null;
  isActive: boolean;
};

// ----------------------------------------------------------------------

type Props = {
  currentRewardRule?: IRewardsRule;
};

export function RewardRulesCreateEditForm({ currentRewardRule }: Props) {
  const router = useRouter();
  const { t } = useTranslate('rewards');

  const [categoryOptions, setCategoryOptions] = useState<IRewardsRuleType[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);

  // Función para cargar categorías (lazy loading)
  const loadCategories = async (search: string = '') => {
    setCategoryLoading(true);
    try {
      const res = await GetRewardRuleTypePaginationService({ page: 1, perPage: 50, search }) as { data?: { data: IRewardsRuleType[] } };
      setCategoryOptions(res.data?.data || []);
    } finally {
      setCategoryLoading(false);
    }
  };

  const RewardsSchema = z.object({
    name: z.string().min(1, { message: t('reward-rules.form.name.required') }),
    description: z.string().min(1, { message: t('reward-rules.form.description.required') }),
    points: z.number().min(1, { message: t('reward-rules.form.points.required') }),
    typeRuleId: z.custom<IRewardsRuleType>().nullable().refine(val => val !== null, { message: t('reward-rules.form.typeRule.required') }),
    isActive: z.boolean(),
  });

  const defaultValues: RewardRulesCreateSchemaType = {
    name: currentRewardRule?.name || '',
    description: currentRewardRule?.description || '',
    points: currentRewardRule?.points || 0,
    typeRuleId: currentRewardRule?.typeRule ? {
      id: currentRewardRule.typeRule.id,
      name: currentRewardRule.typeRule.name
    } as IRewardsRuleType : null,
    isActive: currentRewardRule?.isActive ?? true,
  };

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(RewardsSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    const typeRuleObj = methods.watch('typeRuleId');

    const payload = {
      name: data.name,
      description: data.description,
      points: data.points,
      typeRuleId: typeRuleObj ? Number(typeRuleObj.id) : 0,
      isActive: data.isActive,
    };

    try {
      await SaveOrUpdateRewardRuleService(payload, currentRewardRule?.id);
      reset();
      toast.success(currentRewardRule ? t('reward-rules.messages.success.updateSuccess') : t('reward-rules.messages.success.createSuccess'));
      router.push(paths.dashboard.rewards.rewardsRules);
    } catch (error) {
      console.error('Error saving reward rule:', error);
      toast.error(t('reward-rules.messages.error.saveError'));
    }
  });

  const renderDetails = () => (
    <Card>
      <Stack spacing={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'grid', gap: 2 }}>
          <Field.Text
            name="name"
            label={t('reward-rules.form.fields.name.label')}
            helperText={t('reward-rules.form.fields.name.helperText')}
          />

          <Field.Text
            name="description"
            label={t('reward-rules.form.fields.description.label')}
            helperText={t('reward-rules.form.fields.description.helperText')}
            multiline
            rows={3}
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Field.Autocomplete
              name="typeRuleId"
              label={t('reward-rules.form.fields.typeRule.label')}
              options={categoryOptions}
              loading={categoryLoading}
              getOptionLabel={(option: IRewardsRuleType | string) =>
                typeof option === 'string' ? option : option?.name || ''
              }
              isOptionEqualToValue={(option: IRewardsRuleType, value: IRewardsRuleType) =>
                option.id === value.id
              }
              onOpen={() => {
                if (categoryOptions.length === 0) {
                  loadCategories();
                }
              }}
              onInputChange={(event, value) => {
                if (event && value) {
                  loadCategories(value);
                }
              }}
              filterOptions={(options) => options}
            />

            <Field.Text
              name="points"
              label={t('reward-rules.form.fields.points.label')}
              type="number"
              helperText={t('reward-rules.form.fields.points.helperText')}
              onChange={(e) => {
                const value = e.target.value;
                methods.setValue('points', value === '' ? 0 : Number(value));
              }}
            />
          </Box>

          <Field.Switch
            name="isActive"
            label={t('reward-rules.form.fields.isActive.label')}
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
        {t('reward-rules.form.actions.cancel')}
      </Button>
      <Button
        size="medium"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator={t('reward-rules.form.actions.saving')}
      >
        {currentRewardRule ? t('reward-rules.form.actions.update') : t('reward-rules.form.actions.create')}
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