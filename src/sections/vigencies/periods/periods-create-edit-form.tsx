import type { IPeriod } from 'src/types/organization';

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
import { SaveOrUpdatePeriodsService } from 'src/services/organization/vigencies.service';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export type PeriodCreateSchemaType = {
  name: string;
  abbreviation: string;
  startDate: Date | null;
  endDate: Date | null;
  percentage: number;
  isActive: boolean;
};

// ----------------------------------------------------------------------

type Props = {
  vigencyId: string;
  currentPeriod?: IPeriod;
};

export function PeriodsCreateEditForm({ vigencyId, currentPeriod }: Props) {
  const router = useRouter();
  const { t } = useTranslate('organization');

  const PeriodsSchema = z.object({
    name: z.string().min(1, { message: t('periods.form.name.required') }),
    abbreviation: z.string().min(1, { message: t('periods.form.abbreviation.required') }),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    percentage: z.coerce.number().min(0).max(100, { message: t('periods.form.percentage.helperText') }),
    isActive: z.boolean(),
  });

  const defaultValues: PeriodCreateSchemaType = {
    name: currentPeriod?.name || '',
    abbreviation: currentPeriod?.abbreviation || '',
    startDate: currentPeriod?.startDate ? new Date(currentPeriod.startDate) : null,
    endDate: currentPeriod?.endDate ? new Date(currentPeriod.endDate) : null,
    percentage: currentPeriod?.percentage || 0,
    isActive: currentPeriod?.isActive ?? true,
  };

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(PeriodsSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    const payload = {
      vigencyId: Number(vigencyId),
      name: data.name,
      abbreviation: data.abbreviation,
      startDate: data.startDate ? data.startDate.toISOString() : '',
      endDate: data.endDate ? data.endDate.toISOString() : '',
      percentage: data.percentage,
      isActive: data.isActive,
    };
    
    try {
      await SaveOrUpdatePeriodsService(payload, currentPeriod?.id);
      reset();
      toast.success(currentPeriod ? t('periods.messages.success.updateSuccess') : t('periods.messages.success.createSuccess'));
      router.push(paths.dashboard.organizations.vigenciesPeriods(vigencyId));
    } catch (error) {
      console.error('Error saving period:', error);
      toast.error(t('periods.messages.error.saveError'));
    }
  });

  const renderDetails = () => (
    <Card>
      <Stack spacing={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'grid', gap: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2 }}>
            <Field.Text
              name="name"
              label={t('periods.form.name.label')}
              placeholder={t('periods.form.name.placeholder')}
            />

            <Field.Text
              name="abbreviation"
              label={t('periods.form.abbreviation.label')}
              placeholder={t('periods.form.abbreviation.placeholder')}
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <Field.DatePicker
              name="startDate"
              label={t('periods.form.startDate.label')}
            />

            <Field.DatePicker
              name="endDate"
              label={t('periods.form.endDate.label')}
            />
          </Box>

          <Field.Text
            name="percentage"
            label={t('periods.form.percentage.label')}
            type="number"
            placeholder={t('periods.form.percentage.placeholder')}
            helperText={t('periods.form.percentage.helperText')}
            InputProps={{
              endAdornment: '%',
            }}
          />

          <Field.Switch
            name="isActive"
            label={t('periods.form.isActive.label')}
            helperText={t('periods.form.isActive.helperText')}
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
        {t('periods.form.actions.cancel')}
      </Button>
      <Button
        size="medium"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator={t('periods.form.actions.saving')}
      >
        {t('periods.form.actions.save')}
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
