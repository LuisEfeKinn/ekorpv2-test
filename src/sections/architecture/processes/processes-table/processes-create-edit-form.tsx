import type { IProcessTable } from 'src/types/architecture/process';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

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
  const [loadingOptions, setLoadingOptions] = useState(false);

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
        const [typesRes, processesRes, periodsRes] = await Promise.all([
          GetProcessTypesPaginationService({ page: 1, perPage: 100 }),
          GetProcessFlowService(),
          GetPeriodsPaginationService({ page: 1, perPage: 100 })
        ]);

        // Handle structure [[{...}], count] or standard array
        let typesData = [];
        const rawTypesData = typesRes.data;

        if (Array.isArray(rawTypesData) && Array.isArray(rawTypesData[0])) {
          typesData = rawTypesData[0];
        } else if (Array.isArray(rawTypesData)) {
          typesData = rawTypesData;
        } else {
          typesData = rawTypesData?.data || [];
        }

        let periodsData = [];
        const rawPeriodsData = periodsRes.data;

        if (Array.isArray(rawPeriodsData) && Array.isArray(rawPeriodsData[0])) {
          periodsData = rawPeriodsData[0];
        } else if (Array.isArray(rawPeriodsData)) {
          periodsData = rawPeriodsData;
        } else {
          periodsData = rawPeriodsData?.data || [];
        }

        const processesData = processesRes.data || [];

        setProcessTypes(typesData);
        setPeriods(periodsData);
        setProcesses(Array.isArray(processesData) ? processesData : []);
      } catch (error) {
        console.error('Error loading options:', error);
        toast.error('Error al cargar opciones');
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
  };

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(ProcessTableCreateSchema),
    defaultValues,
    values: currentProcess ? {
      // Map currentProcess to form values if editing (omitted for brevity as focus is on create)
      ...defaultValues,
      // ... implementation for edit mapping would go here
    } : undefined,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

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
        } : null
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


