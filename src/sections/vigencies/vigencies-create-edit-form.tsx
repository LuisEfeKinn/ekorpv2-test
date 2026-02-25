import type { IVigency } from 'src/types/organization';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fDate } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';
import { SaveOrUpdateVigenciesService } from 'src/services/organization/vigencies.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';
import { ConfirmDialog } from 'src/components/custom-dialog';

// ----------------------------------------------------------------------

export type VigencyCreateSchemaType = {
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
};

// ----------------------------------------------------------------------

type Props = {
  currentVigency?: IVigency;
};

export function VigenciesCreateEditForm({ currentVigency }: Props) {
  const router = useRouter();
  const { t } = useTranslate('organization');
  const confirmDialog = useBoolean();

  const VigenciesSchema = z.object({
    name: z.string().min(1, { message: t('vigencies.form.name.required') }),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    isActive: z.boolean(),
  });

  const defaultValues: VigencyCreateSchemaType = {
    name: currentVigency?.name || '',
    startDate: currentVigency?.startDate ? new Date(currentVigency.startDate) : new Date(),
    endDate: currentVigency?.endDate ? new Date(currentVigency.endDate) : new Date(),
    isActive: currentVigency?.isActive ?? true,
  };

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(VigenciesSchema),
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
      startDate: data.startDate ? data.startDate.toISOString() : '',
      endDate: data.endDate ? data.endDate.toISOString() : '',
      isActive: data.isActive,
    };
    
    try {
      await SaveOrUpdateVigenciesService(payload, currentVigency?.id);
      reset();
      toast.success(currentVigency ? t('vigencies.messages.success.updateSuccess') : t('vigencies.messages.success.createSuccess'));
      router.push(paths.dashboard.organizations.vigencies);
    } catch (error) {
      console.error('Error saving vigency:', error);
      toast.error(t('vigencies.messages.error.saveError'));
    }
  });

  const handleManagePeriods = () => {
    confirmDialog.onTrue();
  };

  const handleConfirmManagePeriods = handleSubmit(async (data) => {
    const payload = {
      name: data.name,
      startDate: data.startDate ? data.startDate.toISOString() : '',
      endDate: data.endDate ? data.endDate.toISOString() : '',
      isActive: data.isActive,
    };
    
    try {
      const response: any = await SaveOrUpdateVigenciesService(payload, currentVigency?.id);
      
      let vigencyId: string;
      
      if (currentVigency?.id) {
        // Estamos editando, usamos el ID existente
        vigencyId = currentVigency.id;
      } else {
        // Estamos creando, tomamos el rowId de la respuesta
        if (response?.data?.data?.rowId) {
          vigencyId = response.data.data.rowId;
        } else {
          toast.error(t('vigencies.messages.error.saveError'));
          confirmDialog.onFalse();
          return;
        }
      }

      toast.success(currentVigency ? t('vigencies.messages.success.updateSuccess') : t('vigencies.messages.success.createSuccess'));
      confirmDialog.onFalse();
      router.push(paths.dashboard.organizations.vigenciesPeriods(vigencyId));
    } catch (error) {
      console.error('Error saving vigency:', error);
      toast.error(t('vigencies.messages.error.saveError'));
      confirmDialog.onFalse();
    }
  });

  const renderDetails = () => (
    <Card>
      <Stack spacing={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'grid', gap: 2 }}>
          <Field.Text
            name="name"
            label={t('vigencies.form.name.label')}
            placeholder={t('vigencies.form.name.placeholder')}
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <Field.DatePicker
              name="startDate"
              label={t('vigencies.form.startDate.label')}
            />

            <Field.DatePicker
              name="endDate"
              label={t('vigencies.form.endDate.label')}
            />
          </Box>

          <Field.Switch
            name="isActive"
            label={t('vigencies.form.isActive.label')}
            helperText={t('vigencies.form.isActive.helperText')}
          />
        </Box>

        {/* Botón Gestionar Periodos */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', pt: 2 }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<Iconify icon="solar:settings-bold" />}
            onClick={handleManagePeriods}
          >
            {t('vigencies.form.actions.managePeriods')}
          </Button>
        </Box>

        {/* Lista de Periodos si existen */}
        {currentVigency?.periods && currentVigency.periods.length > 0 && (
          <>
            <Divider sx={{ borderStyle: 'dashed' }} />
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {t('periods.title')} ({currentVigency.periods.length})
              </Typography>
              <Stack spacing={1.5}>
                {currentVigency.periods.map((period) => (
                  <Box
                    key={period.id}
                    sx={{
                      p: 2,
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 1,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                      <Typography variant="subtitle2">{period.name}</Typography>
                      <Chip label={period.abbreviation} size="small" color="default" />
                      <Chip
                        label={`${period.percentage}%`}
                        size="small"
                        color="info"
                        variant="soft"
                      />
                      <Chip
                        label={period.isActive ? t('periods.status.active') : t('periods.status.inactive')}
                        size="small"
                        color={period.isActive ? 'success' : 'default'}
                        variant="soft"
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {fDate(period.startDate)} - {fDate(period.endDate)}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          </>
        )}
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
        {t('vigencies.form.actions.cancel')}
      </Button>
      <Button
        size="medium"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator={t('vigencies.form.actions.saving')}
      >
        {t('vigencies.form.actions.save')}
      </Button>
    </Box>
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={3}>
        {renderDetails()}
        {renderActions()}
      </Stack>

      <ConfirmDialog
        open={confirmDialog.value}
        onClose={confirmDialog.onFalse}
        title={t('vigencies.form.confirmDialog.title')}
        content={t('vigencies.form.confirmDialog.content')}
        action={
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmManagePeriods}
            disabled={isSubmitting}
          >
            {t('vigencies.form.confirmDialog.confirm')}
          </Button>
        }
      />
    </Form>
  );
}