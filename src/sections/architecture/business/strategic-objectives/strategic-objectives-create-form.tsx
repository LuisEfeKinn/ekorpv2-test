import type { IStrategicObjective } from 'src/types/architecture/strategic-objectives';

import * as z from 'zod';
import dayjs from 'dayjs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { GetObjectiveTypesPaginationService } from 'src/services/architecture/catalogs/objectiveTypes.service';
import { SaveOrUpdateObjectivesService, GetObjectivesPaginationService } from 'src/services/architecture/business/objectives.service';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

type Option = { value: number; label: string };

type FormValues = {
  name: string;
  code: string;
  description: string;
  objectiveLevel: number;
  objectiveTypeId?: number | null;
  startDate: string;
  endDate: string;
  measurementForm: string;
  consequencesOfNotAchieving: string;
  participantId?: string;
  superiorObjectiveId?: number | null;
};

type Props = {
  onSuccess?: () => void;
  onCancel?: () => void;
  currentObjective?: IStrategicObjective | null;
};

export function StrategicObjectivesCreateForm({ onSuccess, onCancel, currentObjective }: Props) {
  const { t } = useTranslate('architecture');
  const router = useRouter();

  const [objectiveTypeOptions, setObjectiveTypeOptions] = useState<Option[]>([]);
  const [objectiveOptions, setObjectiveOptions] = useState<Option[]>([]);
  const isEdit = Boolean(currentObjective?.id);

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, { message: t('strategicObjectives.table.form.messages.nameRequired') }),
        code: z.string().min(1, { message: t('strategicObjectives.table.form.messages.codeRequired') }),
        description: z.string().min(1, { message: t('strategicObjectives.table.form.messages.descriptionRequired') }),
        objectiveLevel: z.number().min(1, { message: t('strategicObjectives.table.form.messages.levelRequired') }),
        objectiveTypeId: z.number().optional().nullable(),
        startDate: z.string().min(1, { message: t('strategicObjectives.table.form.messages.startDateRequired') }),
        endDate: z.string().min(1, { message: t('strategicObjectives.table.form.messages.endDateRequired') }),
        measurementForm: z.string().min(1, { message: t('strategicObjectives.table.form.messages.measurementFormRequired') }),
        consequencesOfNotAchieving: z
          .string()
          .min(1, { message: t('strategicObjectives.table.form.messages.consequencesRequired') }),
        participantId: z.string().optional(),
        superiorObjectiveId: z.number().optional().nullable(),
      }),
    [t]
  );

  const defaultValues = useMemo<FormValues>(() => ({
    name: currentObjective?.name ?? '',
    code: currentObjective?.code ?? '',
    description: currentObjective?.description ?? '',
    objectiveLevel: currentObjective?.objectiveLevel ?? 0,
    objectiveTypeId: currentObjective?.objectiveType?.id ?? null,
    startDate: currentObjective?.startDate ?? '',
    endDate: currentObjective?.endDate ?? '',
    measurementForm: currentObjective?.measurementForm ?? '',
    consequencesOfNotAchieving: currentObjective?.consequencesOfNotAchieving ?? '',
    participantId: currentObjective?.participantId ?? '',
    superiorObjectiveId: currentObjective?.superiorObjective?.id ?? null,
  }), [currentObjective]);

  const methods = useForm<FormValues>({
    mode: 'onSubmit',
    resolver: zodResolver(schema),
    defaultValues,
  });

  const {
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const watchStartDate = watch('startDate');

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const loadObjectiveTypes = useCallback(async () => {
    try {
      const res = await GetObjectiveTypesPaginationService({ page: 1, perPage: 1000 });
      const raw = res?.data;

      let list: any[] = [];
      if (Array.isArray(raw)) {
        // Handle [[items], count] format
        if (raw.length > 0 && Array.isArray(raw[0])) {
          list = raw[0];
        } else {
          list = raw;
        }
      } else if (raw && typeof raw === 'object' && Array.isArray((raw as any).data)) {
        list = (raw as any).data;
      }

      const opts = list
        .map((it) => ({
          value: Number(it?.id),
          label: String(it?.typeName ?? it?.name ?? it?.code ?? `#${it?.id}`)
        }))
        .filter((it) => Number.isFinite(it.value) && it.value > 0);

      setObjectiveTypeOptions(opts);
    } catch {
      setObjectiveTypeOptions([]);
    }
  }, []);

  const loadObjectives = useCallback(async () => {
    try {
      const res = await GetObjectivesPaginationService({});
      const raw = res?.data;

      let list: any[] = [];
      if (Array.isArray(raw)) {
        // Handle [[items], count] format
        if (raw.length > 0 && Array.isArray(raw[0])) {
          list = raw[0];
        } else {
          list = raw;
        }
      } else if (raw && typeof raw === 'object' && Array.isArray((raw as any).data)) {
        list = (raw as any).data;
      }

      const opts = list
        .map((it) => ({ value: Number(it?.id), label: String(it?.name ?? `#${it?.id}`) }))
        .filter((it) => Number.isFinite(it.value) && it.value > 0);

      setObjectiveOptions(opts);
    } catch {
      setObjectiveOptions([]);
    }
  }, []);

  useEffect(() => {
    loadObjectiveTypes();
    loadObjectives();
  }, [loadObjectiveTypes, loadObjectives]);

  useEffect(() => {
    if (currentObjective?.objectiveType?.id) {
      const value = Number(currentObjective.objectiveType.id);
      const label = String(currentObjective.objectiveType.typeName ?? currentObjective.objectiveType.typeCode ?? `#${value}`);
      setObjectiveTypeOptions((prev) =>
        prev.some((opt) => opt.value === value) ? prev : [{ value, label }, ...prev]
      );
    }
  }, [currentObjective?.objectiveType]);

  useEffect(() => {
    if (currentObjective?.superiorObjective?.id) {
      const value = Number(currentObjective.superiorObjective.id);
      const label = String(currentObjective.superiorObjective.name ?? currentObjective.superiorObjective.code ?? `#${value}`);
      setObjectiveOptions((prev) =>
        prev.some((opt) => opt.value === value) ? prev : [{ value, label }, ...prev]
      );
    }
  }, [currentObjective?.superiorObjective]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const start = data.startDate ? dayjs(data.startDate) : null;
      const end = data.endDate ? dayjs(data.endDate) : null;

      if (start && end && end.isBefore(start, 'day')) {
        toast.error(t('strategicObjectives.table.form.messages.dateError'));
        return;
      }

      const payload: any = {
        name: data.name,
        description: data.description,
        startDate: start ? start.format('YYYY-MM-DD') : null,
        endDate: end ? end.format('YYYY-MM-DD') : null,
        measurementForm: data.measurementForm,
        consequencesOfNotAchieving: data.consequencesOfNotAchieving,
        objectiveLevel: Number(data.objectiveLevel),
        code: data.code,
      };

      if (data.participantId?.trim()) payload.participantId = Number(data.participantId.trim());
      if (data.superiorObjectiveId) payload.superiorObjective = { id: Number(data.superiorObjectiveId) };
      if (data.objectiveTypeId) payload.objectiveType = { id: Number(data.objectiveTypeId) };

      await SaveOrUpdateObjectivesService(payload, currentObjective?.id);
      if (!isEdit) {
        reset();
      }
      toast.success(isEdit ? t('strategicObjectives.table.form.messages.updateSuccess') : t('strategicObjectives.table.form.messages.createSuccess'));
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(paths.dashboard.architecture.strategicObjectivesTable);
      }
    } catch (error: any) {
      console.error('Error saving strategic objective:', error);
      const rawMessage = error?.response?.data?.message ?? error?.message;
      const messages = Array.isArray(rawMessage) ? rawMessage : [rawMessage];
      const duplicateMessage = messages.find((m: unknown) => {
        if (typeof m !== 'string') return false;
        const lower = m.toLowerCase();
        return lower.includes('ya existe') || lower.includes('already exists');
      });
      if (duplicateMessage) {
        toast.error(t('strategicObjectives.table.form.messages.duplicateError'));
      } else {
        toast.error(t('strategicObjectives.table.form.messages.saveError'));
      }
    }
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        {isEdit ? t('strategicObjectives.table.form.titleEdit') : t('strategicObjectives.table.form.titleCreate')}
      </Typography>

      <Form methods={methods} onSubmit={onSubmit}>
        <Stack spacing={3}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Field.Text name="name" label={t('strategicObjectives.table.form.fields.name')} required />
            <Field.Text name="code" label={t('strategicObjectives.table.form.fields.code')} required />
          </Box>

          <Field.Text name="description" label={t('strategicObjectives.table.form.fields.description')} required multiline minRows={3} />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Field.Select
              name="objectiveLevel"
              label={t('strategicObjectives.table.form.fields.level')}
              required
              onChange={(event) => {
                const value = Number(event.target.value);
                setValue('objectiveLevel', value, { shouldValidate: true });
              }}
            >
              <MenuItem value={0} disabled>
                {t('strategicObjectives.table.form.selectPlaceholder')}
              </MenuItem>
              {[1, 2, 3, 4, 5].map((level) => (
                <MenuItem key={level} value={level}>
                  {level}
                </MenuItem>
              ))}
            </Field.Select>

            <Field.Select
              name="objectiveTypeId"
              label={t('strategicObjectives.table.form.fields.type')}
              slotProps={{
                select: {
                  MenuProps: {
                    slotProps: {
                      paper: {
                        sx: { maxHeight: 320, maxWidth: 420 },
                      },
                    },
                  },
                },
              }}
              onChange={(event) => {
                const value = Number(event.target.value);
                setValue('objectiveTypeId', value || null, { shouldValidate: true });
              }}
            >
              <MenuItem value={0}>{t('strategicObjectives.table.form.selectPlaceholder')}</MenuItem>
              {objectiveTypeOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Field.Select>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Field.DatePicker
              name="startDate"
              label={t('strategicObjectives.table.form.fields.startDate')}
              minDate={dayjs()}
              slotProps={{ textField: { required: true } }}
            />
            <Field.DatePicker
              name="endDate"
              label={t('strategicObjectives.table.form.fields.endDate')}
              minDate={watchStartDate ? dayjs(watchStartDate) : dayjs()}
              slotProps={{ textField: { required: true } }}
            />
          </Box>

          <Field.Text
            name="measurementForm"
            label={t('strategicObjectives.table.form.fields.measurementForm')}
            required
            multiline
            minRows={3}
            InputLabelProps={{ shrink: true }}
          />
          <Field.Text
            name="consequencesOfNotAchieving"
            label={t('strategicObjectives.table.form.fields.consequencesOfNotAchieving')}
            required
            multiline
            minRows={3}
            InputLabelProps={{ shrink: true }}
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Field.Select
              name="superiorObjectiveId"
              label={t('strategicObjectives.table.form.fields.superiorObjective')}
              onChange={(event) => {
                const value = Number(event.target.value);
                setValue('superiorObjectiveId', value || null, { shouldValidate: true });
              }}
            >
              <MenuItem value={0}>{t('strategicObjectives.table.form.selectPlaceholder')}</MenuItem>
              {objectiveOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Field.Select>
          </Box>

          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ pt: 3 }}>
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => {
                if (onCancel) {
                  onCancel();
                } else {
                  router.back();
                }
              }}
            >
              {t('strategicObjectives.table.form.actions.cancel')}
            </Button>

            <Button
              type="submit"
              variant="contained"
              loading={isSubmitting}
            >
              {t('strategicObjectives.table.form.actions.save')}
            </Button>
          </Stack>
        </Stack>
      </Form>
    </Box>
  );
}
