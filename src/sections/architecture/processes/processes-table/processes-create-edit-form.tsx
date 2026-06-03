import type { IProcessTable } from 'src/types/architecture/process';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { GetActionTypesPaginationService } from 'src/services/architecture/catalogs/actionTypes.service';
import { GetPeriodsPaginationService } from 'src/services/architecture/catalogs/periods.service';
import { GetProcessTypesPaginationService } from 'src/services/architecture/catalogs/processTypes.service';
import {
  GetProcessFlowService,
  SaveOrUpdateProcessTableService
} from 'src/services/architecture/process/processTable.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export type ProcessTableCreateSchemaType = {
  nomenclature?: string;
  name: string;
  description: string;
  result: string;
  requiresOLA: boolean;
  periodicity: number;
  workload: number;
  cost: number;
  context: string;
  status: number;
  scheduleTask: boolean;
  startDate?: string;
  endDate?: string;
  projectStatus: number;
  processTypeId: number;
  periodId: number;
  timeUnitId: number;
  superiorProcessId: number | null;
  sistemRequirement?: string;
  taskStartDate?: string;
  taskDeadline?: string;
  fulfillmentAction?: number;
  taskType?: number;
  reminder?: number;
};

// ----------------------------------------------------------------------

type Props = {
  currentProcess?: IProcessTable;
  onClose?: () => void;
};

export function ProcessCreateEditForm({ currentProcess, onClose }: Props) {
  const router = useRouter();
  const { t } = useTranslate('architecture');

  const [processTypes, setProcessTypes] = useState<any[]>([]);
  const [processes, setProcesses] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [actionTypes, setActionTypes] = useState<any[]>([]);
  const [, setLoadingOptions] = useState(false);

  const REMINDER_OPTIONS = [
    { value: 1, label: '1 día' },
    { value: 3, label: '3 días' },
    { value: 7, label: '7 días' },
    { value: 15, label: '15 días' },
    { value: 30, label: '30 días' },
  ];

  // Mocked options since services were not found
  const STATUS_OPTIONS = [
    { value: 1, label: t('process.table.status.active') },
    { value: 0, label: t('process.table.status.inactive') },
  ];

  const YES_NO_OPTIONS = [
    { value: true, label: t('process.table.form.options.yes') },
    { value: false, label: t('process.table.form.options.no') },
  ];

  useEffect(() => {
    const loadOptions = async () => {
      setLoadingOptions(true);
      try {
        const normalizeList = (raw: any): any[] => {
          if (Array.isArray(raw) && Array.isArray(raw[0])) return raw[0];
          if (Array.isArray(raw)) return raw;
          return raw?.data || [];
        };

        const [typesRes, processesRes, periodsRes, actionTypesRes] = await Promise.allSettled([
          GetProcessTypesPaginationService({ page: 1, perPage: 100 }),
          GetProcessFlowService(),
          GetPeriodsPaginationService({ page: 1, perPage: 100 }),
          GetActionTypesPaginationService({ page: 1, perPage: 100 }),
        ]);

        if (typesRes.status === 'fulfilled') {
          setProcessTypes(normalizeList(typesRes.value.data));
        }
        if (processesRes.status === 'fulfilled') {
          const pd = processesRes.value.data || [];
          setProcesses(Array.isArray(pd) ? pd : []);
        }
        if (periodsRes.status === 'fulfilled') {
          setPeriods(normalizeList(periodsRes.value.data));
        }
        if (actionTypesRes.status === 'fulfilled') {
          setActionTypes(normalizeList(actionTypesRes.value.data));
        }
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, []);

  const ProcessTableCreateSchema = z.object({
    superiorProcessId: z.number().nullable(),
    nomenclature: z.string().optional(),
    name: z.string().min(1, { message: t('process.table.form.fields.name.required') }),
    processTypeId: z.number().min(1, { message: t('process.table.form.fields.processTypeId.required') }),
    requiresOLA: z.boolean(),
    scheduleTask: z.boolean(),
    
    status: z.number(),
    context: z.string().optional(),
    description: z.string().min(1, { message: t('process.table.form.fields.description.required') }),
    result: z.string().min(1, { message: t('process.table.form.fields.result.required') }),
    sistemRequirement: z.string().optional(),

    periodicity: z.number().min(0),
    workload: z.number().min(0),
    timeUnitId: z.number().optional(),
    cost: z.number().min(0),
    
    // Hidden/Defaulted but required for payload
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    projectStatus: z.number().default(1),
    periodId: z.number().optional(),

    // Task scheduling fields (conditional on scheduleTask = true)
    taskStartDate: z.string().optional(),
    taskDeadline: z.string().optional(),
    fulfillmentAction: z.number().optional(),
    taskType: z.number().optional(),
    reminder: z.number().optional(),
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
    context: '',
    status: 1,
    scheduleTask: false,
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    projectStatus: 1,
    processTypeId: 0,
    periodId: 0,
    timeUnitId: 0,
    superiorProcessId: null,
    sistemRequirement: '',
    taskStartDate: '',
    taskDeadline: '',
    fulfillmentAction: 0,
    taskType: 0,
    reminder: 0,
  };

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(ProcessTableCreateSchema),
    defaultValues,
    values: currentProcess ? {
      nomenclature: currentProcess.nomenclature ?? '',
      name: currentProcess.name ?? '',
      description: currentProcess.description ?? '',
      result: currentProcess.result ?? '',
      requiresOLA: currentProcess.requiresOLA ?? false,
      periodicity: currentProcess.periodicity ?? 0,
      workload: currentProcess.workload ?? 0,
      cost: currentProcess.cost ?? 0,
      context: currentProcess.context ?? '',
      status: currentProcess.status ?? 1,
      scheduleTask: currentProcess.scheduleTask ?? false,
      startDate: currentProcess.startDate ?? new Date().toISOString(),
      endDate: currentProcess.endDate ?? new Date().toISOString(),
      projectStatus: currentProcess.projectStatus ?? 1,
      processTypeId: (currentProcess as any).processType?.id || 0,
      periodId: (currentProcess as any).period?.id || 0,
      timeUnitId: (currentProcess as any).timeUnit?.id ?? 0,
      superiorProcessId: (currentProcess as any).superiorProcess?.id ?? null,
      sistemRequirement: currentProcess.sistemRequirement ?? '',
      taskStartDate: currentProcess.taskStartDate ?? '',
      taskDeadline: currentProcess.taskDeadline ?? '',
      fulfillmentAction: Number((currentProcess as any).fulfillmentAction) || 0,
      taskType: currentProcess.taskType ?? 0,
      reminder: currentProcess.reminder ?? 0,
    } : undefined,
  });

  const {
    reset,
    watch,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const scheduleTaskValue = watch('scheduleTask');
  const showTaskFields = scheduleTaskValue === true || (scheduleTaskValue as any) === 'true';

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload = {
        nomenclature: data.nomenclature,
        name: data.name,
        description: data.description,
        result: data.result,
        requiresOLA: data.requiresOLA,
        periodicity: Number(data.periodicity),
        workload: Number(data.workload),
        cost: Number(data.cost),
        context: data.context,
        status: Number(data.status),
        scheduleTask: data.scheduleTask,
        startDate: data.startDate, // "2024-01-01T09:00:00Z"
        endDate: data.endDate, // "2024-12-31T18:00:00Z"
        projectStatus: data.projectStatus,
        
        processType: {
          id: Number(data.processTypeId)
        },
        period: data.periodId ? { id: Number(data.periodId) } : null,
        timeUnit: data.timeUnitId ? { id: Number(data.timeUnitId) } : null,
        superiorProcess: data.superiorProcessId ? {
          id: Number(data.superiorProcessId)
        } : null,
        taskStartDate: data.scheduleTask ? (data.taskStartDate || null) : null,
        taskDeadline: data.scheduleTask ? (data.taskDeadline || null) : null,
        fulfillmentAction: data.scheduleTask ? (Number(data.fulfillmentAction) || null) : null,
        taskType: data.scheduleTask ? (Number(data.taskType) || null) : null,
        reminder: data.scheduleTask ? (Number(data.reminder) || null) : null,
      };

      await SaveOrUpdateProcessTableService(
        payload,
        currentProcess?.id
      );

      reset();
      toast.success(currentProcess ? t('process.table.messages.updateSuccess') : t('process.table.messages.createSuccess'));
      if (onClose) onClose();
      else router.push(paths.dashboard.architecture.processesTable);
    } catch (error) {
      console.error('Error saving process:', error);
      toast.error(t('process.table.messages.saveError'));
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack sx={{ height: 1 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 2, py: 2, borderBottom: (theme) => `1px solid ${theme.vars.palette.divider}` }}
        >
          <Typography variant="h6">
            {currentProcess ? t('process.table.actions.edit') : t('process.table.actions.create')}
          </Typography>
          {onClose && (
            <IconButton onClick={onClose}>
              <Iconify icon="mingcute:close-line" />
            </IconButton>
          )}
        </Stack>

        <Scrollbar sx={{ flexGrow: 1 }}>
          <Stack spacing={3} sx={{ p: 3 }}>
            {/* Image 1 Fields */}
            <Field.Select
              name="superiorProcessId"
              label={t('process.table.form.fields.superiorProcessId.label')}
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value={0} sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                {t('process.table.form.options.select')}
              </MenuItem>
              {processes.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  {option.label || option.name}
                </MenuItem>
              ))}
            </Field.Select>

            <Field.Text
              name="nomenclature"
              label={t('process.table.form.fields.nomenclature.label')}
              required
            />

            <Field.Text
              name="name"
              label={t('process.table.form.fields.name.label')}
              required
            />

            <Field.Select
              name="processTypeId"
              label={t('process.table.form.fields.processTypeId.label')}
              required
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value={0} sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                {t('process.table.form.options.select')}
              </MenuItem>
              {processTypes.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  {option.name}
                </MenuItem>
              ))}
            </Field.Select>

            <Field.Select
              name="requiresOLA"
              label={t('process.table.form.fields.requiresOLA.label')}
              required
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                {t('process.table.form.options.select')}
              </MenuItem>
              {YES_NO_OPTIONS.map((option) => (
                <MenuItem key={String(option.value)} value={option.value as any}>
                  {option.label}
                </MenuItem>
              ))}
            </Field.Select>

            <Field.Select
              name="scheduleTask"
              label={t('process.table.form.fields.scheduleTask.label')}
              required
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                {t('process.table.form.options.select')}
              </MenuItem>
              {YES_NO_OPTIONS.map((option) => (
                <MenuItem key={String(option.value)} value={option.value as any}>
                  {option.label}
                </MenuItem>
              ))}
            </Field.Select>

            {showTaskFields && (
              <>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <Field.DatePicker
                    name="taskStartDate"
                    label={t('process.table.form.fields.taskStartDate.label')}
                    slotProps={{ textField: { required: true } }}
                  />
                  <Field.DatePicker
                    name="taskDeadline"
                    label={t('process.table.form.fields.taskDeadline.label')}
                    slotProps={{ textField: { required: true } }}
                  />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <Field.Select
                    name="fulfillmentAction"
                    label={t('process.table.form.fields.fulfillmentAction.label')}
                    required
                    InputLabelProps={{ shrink: true }}
                  >
                    <MenuItem value={0} sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                      {t('process.table.form.options.select')}
                    </MenuItem>
                    {actionTypes.map((option) => (
                      <MenuItem key={option.id} value={option.id}>
                        {option.name}
                      </MenuItem>
                    ))}
                  </Field.Select>
                </Box>

                <Field.Select
                  name="taskType"
                  label={t('process.table.form.fields.taskType.label')}
                  required
                  InputLabelProps={{ shrink: true }}
                >
                  <MenuItem value={0} sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                    {t('process.table.form.options.select')}
                  </MenuItem>
                  {actionTypes.map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.name}
                    </MenuItem>
                  ))}
                </Field.Select>

                <Field.Select
                  name="reminder"
                  label={t('process.table.form.fields.reminder.label')}
                  required
                  InputLabelProps={{ shrink: true }}
                >
                  <MenuItem value={0} sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                    {t('process.table.form.options.select')}
                  </MenuItem>
                  {REMINDER_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Field.Select>
              </>
            )}

            <Divider sx={{ borderStyle: 'dashed' }} />

            {/* Image 2 Fields */}
            <Field.Select
              name="status"
              label={t('process.table.form.fields.status.label')}
              required
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value={0} sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                {t('process.table.form.options.select')}
              </MenuItem>
              {STATUS_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Field.Select>

            <Field.Text
              name="context"
              label={t('process.table.form.fields.context.label')}
            />

            <Field.Text
              name="description"
              label={t('process.table.form.fields.description.label')}
              multiline
              minRows={3}
            />

            <Field.Text
              name="result"
              label={t('process.table.form.fields.result.label')}
              multiline
              minRows={3}
            />

            <Field.Text
              name="sistemRequirement"
              label={t('process.table.form.fields.sistemRequirement.label')}
              multiline
              minRows={3}
            />

            <Typography variant="subtitle1" sx={{ mt: 2 }}>
              {t('process.table.form.sections.workloadBalance')}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: -2 }}>
              {t('process.table.form.sections.optional')}
            </Typography>

            {/* Image 3 Fields */}
            <Field.Text
              name="periodicity"
              label={t('process.table.form.fields.periodicity.label')}
              type="number"
            />

            <Field.Text
              name="workload"
              label={t('process.table.form.fields.workload.label')}
              type="number"
            />

            <Field.Select
              name="periodId"
              label={t('process.table.form.fields.periodId.label')}
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value={0} sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                {t('process.table.form.options.select')}
              </MenuItem>
              {periods.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  {option.name}
                </MenuItem>
              ))}
            </Field.Select>

            <Field.Text
              name="cost"
              label={t('process.table.form.fields.cost.label')}
              type="number"
            />
          </Stack>
        </Scrollbar>

        <Stack
          direction="row"
          spacing={2}
          sx={{
            p: 3,
            borderTop: (theme) => `1px solid ${theme.vars.palette.divider}`,
          }}
        >
          <LoadingButton
            type="submit"
            variant="contained"
            loading={isSubmitting}
            fullWidth
          >
            {t('process.table.actions.save')}
          </LoadingButton>

          <Button
            variant="outlined"
            onClick={() => reset()}
            fullWidth
          >
            {t('process.table.actions.clear')}
          </Button>

          <Button
            variant="outlined"
            color="inherit"
            onClick={onClose}
            fullWidth
          >
            {t('process.table.actions.cancel')}
          </Button>
        </Stack>
      </Stack>
    </Form>
  );
}


