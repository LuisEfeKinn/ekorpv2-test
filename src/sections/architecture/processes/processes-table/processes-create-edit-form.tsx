import type { IProcessTable } from 'src/types/architecture/process';
import type { PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import type { PickerValidDate } from '@mui/x-date-pickers/models';

import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useState, useEffect, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import FormGroup from '@mui/material/FormGroup';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import FormControlLabel from '@mui/material/FormControlLabel';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { GetActionTypesPaginationService } from 'src/services/architecture/catalogs/actionTypes.service';
import { GetPeriodsPaginationService } from 'src/services/architecture/catalogs/periods.service';
import { GetProcessTypesPaginationService } from 'src/services/architecture/catalogs/processTypes.service';
import { GetTimeUnitsPaginationService } from 'src/services/architecture/catalogs/timeUnits.service';
import {
  GetProcessFlowService,
  SaveOrUpdateProcessTableService
} from 'src/services/architecture/process/processTable.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

function ServerDay(
  props: PickersDayProps & { selectedDays?: Dayjs[] }
) {
  const { day, outsideCurrentMonth, selectedDays = [], ...other } = props;
  const isSelected =
    !outsideCurrentMonth &&
    selectedDays.some((d: Dayjs) => d.isSame(day as PickerValidDate, 'day'));

  return (
    <PickersDay
      {...other}
      day={day}
      outsideCurrentMonth={outsideCurrentMonth}
      selected={isSelected}
    />
  );
}

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
  selectedDay?: number;
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
  const [timeUnits, setTimeUnits] = useState<any[]>([]);
  const [, setLoadingOptions] = useState(false);

  // Sub-selector local state (array types managed outside react-hook-form)
  const [selectedWeekDays, setSelectedWeekDays] = useState<string[]>([]);
  const [selectedMultiDates, setSelectedMultiDates] = useState<Dayjs[]>([]);

  const PERIODICITY_OPTIONS = [
    { value: 2, label: '2. A Diario' },
    { value: 3, label: '3. Semanal' },
    { value: 4, label: '4. Quincenal' },
    { value: 5, label: '5. Mensual' },
    { value: 6, label: '6. Bimensual' },
    { value: 7, label: '7. Trimestral' },
    { value: 8, label: '8. Semestral' },
    { value: 9, label: '9. Anual' },
    { value: 10, label: '10. Quinquenal' },
  ];

  const WEEK_DAYS = [
    { value: 'lun', label: 'Lun.' },
    { value: 'mar', label: 'Mar.' },
    { value: 'mie', label: 'Mié.' },
    { value: 'jue', label: 'Jue.' },
    { value: 'vie', label: 'Vie.' },
    { value: 'sab', label: 'Sáb.' },
    { value: 'dom', label: 'Dom.' },
  ];

  const REMINDER_OPTIONS = [
    { value: 1, label: '1 día' },
    { value: 3, label: '3 días' },
    { value: 7, label: '7 días' },
    { value: 15, label: '15 días' },
    { value: 30, label: '30 días' },
  ];

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

        const [typesRes, processesRes, periodsRes, actionTypesRes, timeUnitsRes] =
          await Promise.allSettled([
            GetProcessTypesPaginationService({ page: 1, perPage: 100 }),
            GetProcessFlowService(),
            GetPeriodsPaginationService({ page: 1, perPage: 100 }),
            GetActionTypesPaginationService({ page: 1, perPage: 100 }),
            GetTimeUnitsPaginationService({ page: 1, perPage: 100 }),
          ]);

        if (typesRes.status === 'fulfilled') setProcessTypes(normalizeList(typesRes.value.data));
        if (processesRes.status === 'fulfilled') {
          const pd = processesRes.value.data || [];
          setProcesses(Array.isArray(pd) ? pd : []);
        }
        if (periodsRes.status === 'fulfilled') setPeriods(normalizeList(periodsRes.value.data));
        if (actionTypesRes.status === 'fulfilled')
          setActionTypes(normalizeList(actionTypesRes.value.data));
        if (timeUnitsRes.status === 'fulfilled')
          setTimeUnits(normalizeList(timeUnitsRes.value.data));
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
    processTypeId: z.number().min(1, {
      message: t('process.table.form.fields.processTypeId.required'),
    }),
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
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    projectStatus: z.number().default(1),
    periodId: z.number().optional(),
    taskStartDate: z.string().optional(),
    taskDeadline: z.string().optional(),
    fulfillmentAction: z.number().optional(),
    taskType: z.number().optional(),
    reminder: z.number().optional(),
    selectedDay: z.number().optional(),
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
    selectedDay: 0,
  };

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(ProcessTableCreateSchema),
    defaultValues,
    values: currentProcess
      ? {
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
          periodId: (currentProcess as any).period?.id ?? 0,
          timeUnitId: (currentProcess as any).timeUnit?.id ?? 0,
          superiorProcessId: (currentProcess as any).superiorProcess?.id ?? null,
          sistemRequirement: currentProcess.sistemRequirement ?? '',
          taskStartDate: currentProcess.taskStartDate ?? '',
          taskDeadline: currentProcess.taskDeadline ?? '',
          fulfillmentAction: Number((currentProcess as any).fulfillmentAction) || 0,
          taskType: currentProcess.taskType ?? 0,
          reminder: currentProcess.reminder ?? 0,
          selectedDay: (currentProcess as any).selectedDay ?? 0,
        }
      : undefined,
  });

  const {
    reset,
    watch,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const scheduleTaskValue = watch('scheduleTask');
  const showTaskFields = scheduleTaskValue === true || (scheduleTaskValue as any) === 'true';
  const periodIdValue = Number(watch('periodId')) || 0;

  // Reset sub-selectors when period changes
  useEffect(() => {
    setSelectedWeekDays([]);
    setSelectedMultiDates([]);
  }, [periodIdValue]);

  const handleReset = useCallback(() => {
    reset();
    setSelectedWeekDays([]);
    setSelectedMultiDates([]);
  }, [reset]);

  // Sub-selector derived values
  const getDayOptions = (max: number) =>
    Array.from({ length: max }, (_, i) => ({ value: i + 1, label: String(i + 1) }));

  const getMaxDatesForPeriod = (id: number): number => {
    if (id === 7) return 4;
    if (id === 8) return 2;
    return 1; // 9=Anual, 10=Quinquenal, others
  };

  const showWeekSelector = periodIdValue === 3;
  const showDaySelector = periodIdValue === 4 || periodIdValue === 5 || periodIdValue === 6;
  const showMultiDateSelector = periodIdValue >= 7;
  const dayOptionsMax = periodIdValue === 4 ? 15 : periodIdValue === 5 ? 31 : 60;

  const handleWeekDayToggle = (day: string) => {
    setSelectedWeekDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleMultiDateChange = (newDate: Dayjs | null) => {
    if (!newDate) return;
    const maxDates = getMaxDatesForPeriod(periodIdValue);
    const already = selectedMultiDates.some((d) => d.isSame(newDate, 'day'));
    if (already) {
      setSelectedMultiDates((prev) => prev.filter((d) => !d.isSame(newDate, 'day')));
    } else if (selectedMultiDates.length < maxDates) {
      setSelectedMultiDates((prev) => [...prev, newDate]);
    }
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload = {
        nomenclature: data.nomenclature,
        name: data.name,
        description: data.description,
        result: data.result,
        requiresOLA: data.requiresOLA,
        workload: Number(data.workload),
        cost: Number(data.cost),
        context: data.context,
        status: Number(data.status),
        scheduleTask: data.scheduleTask,
        startDate: data.startDate,
        endDate: data.endDate,
        projectStatus: data.projectStatus,
        processType: { id: Number(data.processTypeId) },
        periodicity: data.scheduleTask && data.periodId
          ? Number(data.periodId)
          : Number(data.periodicity),
        timeUnit: data.timeUnitId ? { id: Number(data.timeUnitId) } : null,
        superiorProcess: data.superiorProcessId
          ? { id: Number(data.superiorProcessId) }
          : null,
        taskStartDate: data.scheduleTask ? data.taskStartDate || null : null,
        taskDeadline: data.scheduleTask ? data.taskDeadline || null : null,
        fulfillmentAction: data.scheduleTask
          ? Number(data.fulfillmentAction) || null
          : null,
        taskType: data.scheduleTask ? Number(data.taskType) || null : null,
        reminder: data.scheduleTask ? Number(data.reminder) || null : null,
        selectedDay:
          data.scheduleTask && showDaySelector
            ? Number(data.selectedDay) || null
            : null,
        selectedWeekDays:
          data.scheduleTask && showWeekSelector && selectedWeekDays.length
            ? selectedWeekDays.join(',')
            : null,
        selectedMultiDates:
          data.scheduleTask && showMultiDateSelector && selectedMultiDates.length
            ? selectedMultiDates.map((d) => d.format('YYYY-MM-DD')).join(',')
            : null,
      };

      await SaveOrUpdateProcessTableService(payload, currentProcess?.id);

      handleReset();
      toast.success(
        currentProcess
          ? t('process.table.messages.updateSuccess')
          : t('process.table.messages.createSuccess')
      );
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
          sx={{
            px: 2,
            py: 2,
            borderBottom: (theme) => `1px solid ${theme.vars.palette.divider}`,
          }}
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

            {/* ── Task scheduling section (visible only when scheduleTask = true) ── */}
            {showTaskFields && (
              <>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: 2,
                  }}
                >
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

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: 2,
                  }}
                >
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

                {/* Periodicidad (scheduling frequency — static list, posts as flat number) */}
                <Field.Select
                  name="periodId"
                  label={t('process.table.form.fields.periodId.label')}
                  required
                  InputLabelProps={{ shrink: true }}
                >
                  <MenuItem value={0} sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                    {t('process.table.form.options.select')}
                  </MenuItem>
                  {PERIODICITY_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Field.Select>

                {/* ── Sub-selector based on periodId ── */}

                {/* ID 3: Semanal → week day checkboxes */}
                {showWeekSelector && (
                  <Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                      {t('process.table.form.options.select')}
                    </Typography>
                    <FormGroup row>
                      {WEEK_DAYS.map((day) => (
                        <FormControlLabel
                          key={day.value}
                          control={
                            <Checkbox
                              size="small"
                              checked={selectedWeekDays.includes(day.value)}
                              onChange={() => handleWeekDayToggle(day.value)}
                            />
                          }
                          label={day.label}
                          sx={{ mr: 0.5 }}
                        />
                      ))}
                    </FormGroup>
                  </Box>
                )}

                {/* ID 4/5/6: Quincenal/Mensual/Bimensual → day number selector */}
                {showDaySelector && (
                  <Field.Select
                    name="selectedDay"
                    label={t('process.table.form.options.select')}
                    required
                    InputLabelProps={{ shrink: true }}
                  >
                    <MenuItem value={0} sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                      {t('process.table.form.options.select')}
                    </MenuItem>
                    {getDayOptions(dayOptionsMax).map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Field.Select>
                )}

                {/* ID ≥7: Trimestral/Semestral/Anual/Quinquenal → multi-date calendar */}
                {showMultiDateSelector && (
                  <Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                      {`${t('process.table.form.options.select')} (máx. ${getMaxDatesForPeriod(periodIdValue)})`}
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={selectedMultiDates.map((d) => d.format('D/M/YY')).join(', ')}
                      InputProps={{ readOnly: true }}
                      placeholder={t('process.table.form.options.select')}
                      sx={{ mb: 1 }}
                    />
                    <DateCalendar
                      value={null}
                      onChange={handleMultiDateChange}
                      slots={{ day: ServerDay }}
                      slotProps={{ day: { selectedDays: selectedMultiDates } as any }}
                    />
                  </Box>
                )}
              </>
            )}

            <Divider sx={{ borderStyle: 'dashed' }} />

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

            <Field.Text name="context" label={t('process.table.form.fields.context.label')} />

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
              name="timeUnitId"
              label={t('process.table.form.fields.timeUnitId.label')}
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value={0} sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                {t('process.table.form.options.select')}
              </MenuItem>
              {timeUnits.map((option) => (
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

          <Button variant="outlined" onClick={handleReset} fullWidth>
            {t('process.table.actions.clear')}
          </Button>

          <Button variant="outlined" color="inherit" onClick={onClose} fullWidth>
            {t('process.table.actions.cancel')}
          </Button>
        </Stack>
      </Stack>
    </Form>
  );
}
