import type { IProcessTable } from 'src/types/architecture/process';

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
import { SaveOrUpdateProcessTableService } from 'src/services/architecture/process/processTable.service';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export type ProcessTableCreateSchemaType = {
  nomenclature?: string;
  name: string;
  description: string;
  result: string;
  requiresOLA?: boolean;
  periodicity?: number;
  workload?: number;
  cost?: number;
  startDate?: string;
  endDate?: string;
  taskDeadline?: string;
  taskStartDate?: string;
  taskUpdateDate?: string;
  fulfillmentAction?: string;
  sistemRequirement?: string;
};

// ----------------------------------------------------------------------

type Props = {
  currentProcess?: IProcessTable;
};

export function ProcessCreateEditForm({ currentProcess }: Props) {
  const router = useRouter();
  const { t } = useTranslate('architecture');

  const ProcessTableCreateSchema = z.object({
    nomenclature: z.string().optional(),
    name: z.string().min(1, { message: t('process.table.form.fields.name.required') }),
    description: z.string().min(1, { message: t('process.table.form.fields.description.required') }),
    result: z.string().min(1, { message: t('process.table.form.fields.result.required') }),
    requiresOLA: z.boolean().optional(),
    periodicity: z.number().optional(),
    workload: z.number().optional(),
    cost: z.number().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    taskDeadline: z.string().optional(),
    taskStartDate: z.string().optional(),
    taskUpdateDate: z.string().optional(),
    fulfillmentAction: z.string().optional(),
    sistemRequirement: z.string().optional(),
  });

  const defaultValues: ProcessTableCreateSchemaType = {
    nomenclature: '',
    name: '',
    description: '',
    result: '',
    requiresOLA: false,
    periodicity: 0,
    workload: 0,
    cost: 0,
  };

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(ProcessTableCreateSchema),
    defaultValues,
    values: currentProcess ? {
      nomenclature: currentProcess.nomenclature,
      name: currentProcess.name,
      description: currentProcess.description,
      result: currentProcess.result,
      requiresOLA: currentProcess.requiresOLA,
      periodicity: currentProcess.periodicity,
      workload: currentProcess.workload,
      cost: currentProcess.cost,
      startDate: currentProcess.startDate ?? undefined,
      endDate: currentProcess.endDate ?? undefined,
      taskDeadline: currentProcess.taskDeadline ?? undefined,
      taskStartDate: currentProcess.taskStartDate ?? undefined,
      taskUpdateDate: currentProcess.taskUpdateDate ?? undefined,
      fulfillmentAction: currentProcess.fulfillmentAction ?? undefined,
      sistemRequirement: currentProcess.sistemRequirement ?? undefined,
    } : undefined,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await SaveOrUpdateProcessTableService(
        data,
        currentProcess?.id
      );

      reset();
      toast.success(currentProcess ? t('process.table.messages.updateSuccess') : t('process.table.messages.createSuccess'));
      router.push(paths.dashboard.architecture.processesTable); // Ruta de retorno
    } catch (error) {
      console.error('Error saving position:', error);
      toast.error(t('process.table.messages.saveError'));
    }
  });

  const renderDetails = () => (
    <Card>
      <Stack spacing={3} sx={{ p: 3 }}>
        <Typography variant="h6">{t('process.table.form.sections.details')}</Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <Field.Text
            name="nomenclature"
            label={t('process.table.form.fields.nomenclature.label')}
            helperText={t('process.table.form.fields.nomenclature.helperText')}
          />

          <Field.Text
            name="name"
            label={t('process.table.form.fields.name.label')}
            helperText={t('process.table.form.fields.name.helperText')}
          />
        </Box>

        <Field.Text
          name="description"
          label={t('process.table.form.fields.description.label')}
          helperText={t('process.table.form.fields.description.helperText')}
          multiline
          minRows={3}
        />

        <Field.Text
          name="result"
          label={t('process.table.form.fields.result.label')}
          helperText={t('process.table.form.fields.result.helperText')}
          multiline
          minRows={3}
        />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <Field.Switch
            name="requiresOLA"
            label={t('process.table.form.fields.requiresOLA.label')}
            helperText={t('process.table.form.fields.requiresOLA.helperText')}
          />

          <Field.Text
            name="periodicity"
            label={t('process.table.form.fields.periodicity.label')}
            helperText={t('process.table.form.fields.periodicity.helperText')}
            type="number"
            slotProps={{
              inputLabel: { shrink: true },
            }}
          />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <Field.Text
            name="workload"
            label={t('process.table.form.fields.workload.label')}
            helperText={t('process.table.form.fields.workload.helperText')}
            type="number"
            slotProps={{
              inputLabel: { shrink: true },
            }}
          />

          <Field.Text
            name="cost"
            label={t('process.table.form.fields.cost.label')}
            helperText={t('process.table.form.fields.cost.helperText')}
            type="number"
            slotProps={{
              inputLabel: { shrink: true },
            }}
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
        {t('process.table.actions.cancel')}
      </Button>

      <Button
        size="medium"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator={t('process.table.actions.saving')}
      >
        {currentProcess ? t('process.table.actions.update') : t('process.table.actions.create')}
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