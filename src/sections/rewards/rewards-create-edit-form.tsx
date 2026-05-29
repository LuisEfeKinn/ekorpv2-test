import type { IReward, IRewardCategory } from 'src/types/rewards';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useMemo, useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { SaveOrUpdateRewardsService } from 'src/services/rewards/rewards.service';
import { GetRewardCategoryPaginationService } from 'src/services/rewards/rewardCategory.service';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { ImageUploader } from 'src/components/image-uploader';

// ----------------------------------------------------------------------

export type RewardCreateSchemaType = {
  name: string;
  description: string;
  pointsRequired: number;
  stockTotal: number;
  categoryRewardId: IRewardCategory | null;
  isActive: boolean;
  startDate: string;
  endDate: string;
  imageUrl: string;
};

// ----------------------------------------------------------------------

type Props = {
  currentReward?: IReward;
};

const formatDateInputValue = (value?: string) => value?.slice(0, 10) || '';

export function RewardsCreateEditForm({ currentReward }: Props) {
  const router = useRouter();
  const { t } = useTranslate('rewards');

  const [categoryOptions, setCategoryOptions] = useState<IRewardCategory[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);

  // Función para cargar categorías (lazy loading)
  const loadCategories = async (search: string = '') => {
    setCategoryLoading(true);
    try {
      const res = await GetRewardCategoryPaginationService({ page: 1, perPage: 50, search }) as { data?: { data: IRewardCategory[] } };
      setCategoryOptions(res.data?.data || []);
    } finally {
      setCategoryLoading(false);
    }
  };

  const RewardsSchema = z.object({
    name: z.string().min(1, { message: t('rewards.form.name.required') }),
    description: z.string().min(1, { message: t('rewards.form.description.required') }),
    pointsRequired: z.number().min(1, { message: t('rewards.form.pointsRequired.required') }),
    stockTotal: z.number().min(0, { message: t('rewards.form.stockTotal.required') }),
    categoryRewardId: z.custom<IRewardCategory>().nullable().refine(val => val !== null, { message: t('rewards.form.category.required') }),
    isActive: z.boolean(),
    startDate: z.string().min(1, { message: t('rewards.form.startDate.required') }),
    endDate: z.string().min(1, { message: t('rewards.form.endDate.required') }),
    imageUrl: z.string().min(1, { message: t('rewards.form.imageUrl.required') }),
  });

  const defaultValues: RewardCreateSchemaType = useMemo(
    () => ({
      name: currentReward?.name || '',
      description: currentReward?.description || '',
      pointsRequired: currentReward?.pointsRequired || 0,
      stockTotal: currentReward?.stockAvailable || 0,
      categoryRewardId: currentReward?.categoryReward
        ? ({
            id: currentReward.categoryReward.id,
            name: currentReward.categoryReward.name,
          } as IRewardCategory)
        : null,
      isActive: currentReward?.isActive ?? true,
      startDate: formatDateInputValue(currentReward?.startDate),
      endDate: formatDateInputValue(currentReward?.endDate),
      imageUrl: currentReward?.imageUrl || '',
    }),
    [currentReward]
  );

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(RewardsSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = methods;

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const onSubmit = handleSubmit(async (data) => {
    const categoryObj = data.categoryRewardId;
    
    const payload = {
      name: data.name,
      description: data.description,
      pointsRequired: data.pointsRequired,
      stockTotal: data.stockTotal,
      categoryRewardId: categoryObj ? Number(categoryObj.id) : 0,
      isActive: data.isActive,
      startDate: data.startDate,
      endDate: data.endDate,
      imageUrl: data.imageUrl || '',
    };
    
    try {
      await SaveOrUpdateRewardsService(payload, currentReward?.id);
      reset();
      toast.success(currentReward ? t('rewards.messages.success.updateSuccess') : t('rewards.messages.success.createSuccess'));
      router.push(paths.dashboard.rewards.rewards);
    } catch (error) {
      console.error('Error saving reward:', error);
      toast.error(t('rewards.messages.error.saveError'));
    }
  });

  const renderDetails = () => (
    <Card>
      <Stack spacing={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'grid', gap: 2 }}>
          <Field.Text
            name="name"
            label={t('rewards.form.fields.name.label')}
            helperText={t('rewards.form.fields.name.helperText')}
          />

          <Field.Text
            name="description"
            label={t('rewards.form.fields.description.label')}
            helperText={t('rewards.form.fields.description.helperText')}
            multiline
            rows={3}
          />

          <Field.Autocomplete
            name="categoryRewardId"
            label={t('rewards.form.fields.category.label')}
            options={categoryOptions}
            loading={categoryLoading}
            getOptionLabel={(option: IRewardCategory | string) => 
              typeof option === 'string' ? option : option?.name || ''
            }
            isOptionEqualToValue={(option: IRewardCategory, value: IRewardCategory) => 
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

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Field.Text
              name="pointsRequired"
              label={t('rewards.form.fields.pointsRequired.label')}
              type="number"
              helperText={t('rewards.form.fields.pointsRequired.helperText')}
              onChange={(e) => {
                const value = e.target.value;
                methods.setValue('pointsRequired', value === '' ? 0 : Number(value));
              }}
            />

            <Field.Text
              name="stockTotal"
              label={t('rewards.form.fields.stockTotal.label')}
              type="number"
              helperText={t('rewards.form.fields.stockTotal.helperText')}
              onChange={(e) => {
                const value = e.target.value;
                methods.setValue('stockTotal', value === '' ? 0 : Number(value));
              }}
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Field.Text
              name="startDate"
              label={t('rewards.form.fields.startDate.label')}
              type="date"
              InputLabelProps={{ shrink: true }}
            />

            <Field.Text
              name="endDate"
              label={t('rewards.form.fields.endDate.label')}
              type="date"
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
              {t('rewards.form.fields.imageUrl.label')}
            </Typography>

            <Box sx={{ width: '100%', maxWidth: 420, mx: 'auto' }}>
              <ImageUploader
                imageUrl={watch('imageUrl')}
                placeholderText={t('rewards.form.fields.imageUrl.placeholder')}
                height={300}
                imageFit="contain"
                onUploadSuccess={(url) => {
                  setValue('imageUrl', url, { shouldValidate: true, shouldDirty: true });
                }}
                onDeleteSuccess={() => {
                  setValue('imageUrl', '', { shouldValidate: true, shouldDirty: true });
                }}
              />
            </Box>

            <Typography
              variant="caption"
              sx={{
                mt: 1.5,
                display: 'block',
                color: errors.imageUrl ? 'error.main' : 'text.secondary',
                textAlign: 'center',
              }}
            >
              {errors.imageUrl?.message || t('rewards.form.fields.imageUrl.helperText')}
            </Typography>
          </Box>

          <Field.Switch
            name="isActive"
            label={t('rewards.form.fields.isActive.label')}
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
        {t('rewards.form.actions.cancel')}
      </Button>
      <Button
        size="medium"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator={t('rewards.form.actions.saving')}
      >
        {currentReward ? t('rewards.form.actions.update') : t('rewards.form.actions.create')}
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