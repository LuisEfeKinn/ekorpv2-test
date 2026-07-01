import type { ILearningCategories, ILearningCategoryIcon, ILearningCategoryType } from 'src/types/learning';

import * as z from 'zod';
import { useMemo, useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import {
  GetLearningCategoryIconsService,
  GetLearningCategoryTypesService,
  SaveOrUpdateLearningCategoriesService,
} from 'src/services/learning/categories.service';

import { toast } from 'src/components/snackbar';
import { Form } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const LearningCategoriesSchema = z.object({
  name: z.string().min(1),
  abreviation: z.string().optional(),
  description: z.string().optional().nullable(),
  categoryTypeId: z.string().optional().nullable(),
  iconId: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  active: z.boolean(),
});

type FormData = z.infer<typeof LearningCategoriesSchema>;

type Props = {
  currentLearningCategory?: ILearningCategories;
};

export function LearningCategoriesCreateEditForm({ currentLearningCategory }: Props) {
  const router = useRouter();
  const { t } = useTranslate('learning');
  const isEdit = !!currentLearningCategory;

  const [iconOptions, setIconOptions] = useState<ILearningCategoryIcon[]>([]);
  const [typeOptions, setTypeOptions] = useState<ILearningCategoryType[]>([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoadingCatalogs(true);
      try {
        const [iconsRes, typesRes] = await Promise.all([
          GetLearningCategoryIconsService(),
          GetLearningCategoryTypesService(),
        ]);
        setIconOptions(iconsRes.data?.rows ?? []);
        setTypeOptions(typesRes.data?.rows ?? []);
      } finally {
        setLoadingCatalogs(false);
      }
    };
    load();
  }, []);

  const defaultValues: FormData = useMemo(
    () => ({
      name: currentLearningCategory?.name ?? '',
      abreviation: currentLearningCategory?.abreviation ?? '',
      description: currentLearningCategory?.description ?? '',
      categoryTypeId: currentLearningCategory?.categoryTypeId ?? null,
      iconId: currentLearningCategory?.iconId ?? null,
      color: currentLearningCategory?.color ?? null,
      active: currentLearningCategory?.active ?? true,
    }),
    [currentLearningCategory]
  );

  const methods = useForm<FormData>({
    mode: 'onSubmit',
    resolver: zodResolver(LearningCategoriesSchema),
    defaultValues,
    values: defaultValues,
  });

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = methods;

  const watchedIconId = watch('iconId');
  const watchedColor = watch('color');

  const selectedIcon = useMemo(
    () => iconOptions.find((i) => String(i.id) === String(watchedIconId)) ?? null,
    [iconOptions, watchedIconId]
  );

  const onSubmit = handleSubmit(async (data) => {
    try {
      await SaveOrUpdateLearningCategoriesService(
        {
          name: data.name,
          abreviation: data.abreviation || undefined,
          description: data.description || null,
          categoryTypeId: data.categoryTypeId ? Number(data.categoryTypeId) : undefined,
          iconId: data.iconId ? Number(data.iconId) : undefined,
          color: data.color || null,
          active: data.active,
        },
        currentLearningCategory?.id
      );

      toast.success(
        isEdit
          ? t('learningCategories.messages.updateSuccess')
          : t('learningCategories.messages.createSuccess')
      );
      router.push(paths.dashboard.learning.learningCategories);
    } catch {
      toast.error(t('learningCategories.messages.saveError'));
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={3}>
        {/* ── Detalles ── */}
        <Card>
          <Stack spacing={3} sx={{ p: 3 }}>
            <Typography variant="h6">{t('learningCategories.form.sections.details')}</Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label={t('learningCategories.form.fields.name.label')}
                      error={!!errors.name}
                      helperText={errors.name ? t('learningCategories.form.name.required') : undefined}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="abreviation"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label={t('learningCategories.form.fields.abreviation.label')}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ''}
                      fullWidth
                      multiline
                      rows={3}
                      label={t('learningCategories.form.fields.description.label')}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="categoryTypeId"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      options={typeOptions}
                      getOptionLabel={(o) => o.name}
                      value={typeOptions.find((o) => o.id === field.value) ?? null}
                      onChange={(_e, val) => field.onChange(val?.id ?? null)}
                      loading={loadingCatalogs}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={t('learningCategories.form.fields.categoryType.label')}
                        />
                      )}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="color"
                  control={control}
                  render={({ field }) => (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box
                        component="input"
                        type="color"
                        value={field.value || '#1890FF'}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          field.onChange(e.target.value)
                        }
                        sx={{
                          width: 56,
                          height: 56,
                          border: 'none',
                          borderRadius: 1,
                          cursor: 'pointer',
                          p: 0.5,
                          bgcolor: 'background.paper',
                          border: (theme) => `1px solid ${theme.palette.divider}`,
                          flexShrink: 0,
                        }}
                      />
                      <TextField
                        fullWidth
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        label={t('learningCategories.form.fields.color.label')}
                        placeholder="#FF5733"
                        inputProps={{ maxLength: 7 }}
                      />
                    </Stack>
                  )}
                />
              </Grid>
            </Grid>

            <Controller
              name="active"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  }
                  label={t('learningCategories.form.fields.active.label')}
                />
              )}
            />
          </Stack>
        </Card>

        {/* ── Selector de ícono ── */}
        <Card>
          <Stack spacing={2} sx={{ p: 3 }}>
            <Typography variant="h6">{t('learningCategories.form.fields.icon.label')}</Typography>

            {/* Preview del ícono seleccionado */}
            {selectedIcon && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: 1.5,
                  bgcolor: watchedColor || 'primary.lighter',
                  width: 'fit-content',
                }}
              >
                <Iconify
                  icon={`solar:${selectedIcon.icon}-bold`}
                  width={32}
                  sx={{ color: watchedColor ? 'white' : 'primary.main' }}
                />
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{ color: watchedColor ? 'white' : 'primary.main' }}
                >
                  {selectedIcon.name}
                </Typography>
              </Box>
            )}

            {loadingCatalogs ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={32} />
              </Box>
            ) : (
              <Controller
                name="iconId"
                control={control}
                render={({ field }) => (
                  <Grid container spacing={1}>
                    {iconOptions.map((iconItem) => {
                      const isSelected = String(field.value) === String(iconItem.id);
                      return (
                        <Grid size={{ xs: 4, sm: 3, md: 2 }} key={iconItem.id}>
                          <Box
                            onClick={() => field.onChange(isSelected ? null : String(iconItem.id))}
                            sx={{
                              p: 1.5,
                              borderRadius: 1.5,
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: 0.75,
                              border: '2px solid',
                              borderColor: isSelected ? 'primary.main' : 'transparent',
                              bgcolor: isSelected ? 'primary.lighter' : 'background.neutral',
                              transition: 'all 0.15s',
                              '&:hover': {
                                borderColor: 'primary.light',
                                bgcolor: 'action.hover',
                              },
                            }}
                          >
                            <Iconify
                              icon={`solar:${iconItem.icon}-bold`}
                              width={28}
                              sx={{ color: isSelected ? 'primary.main' : 'text.secondary' }}
                            />
                            <Typography
                              variant="caption"
                              textAlign="center"
                              noWrap
                              sx={{
                                maxWidth: '100%',
                                color: isSelected ? 'primary.main' : 'text.secondary',
                                fontWeight: isSelected ? 600 : 400,
                              }}
                            >
                              {iconItem.name}
                            </Typography>
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                )}
              />
            )}
          </Stack>
        </Card>

        {/* ── Acciones ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button size="medium" variant="soft" color="inherit" onClick={() => router.back()}>
            {t('learningCategories.actions.cancel')}
          </Button>
          <Button
            size="medium"
            type="submit"
            variant="contained"
            loading={isSubmitting}
            loadingIndicator={t('learningCategories.actions.saving')}
          >
            {isEdit ? t('learningCategories.actions.update') : t('learningCategories.actions.create')}
          </Button>
        </Box>
      </Stack>
    </Form>
  );
}
