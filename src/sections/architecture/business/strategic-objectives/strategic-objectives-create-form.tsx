import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

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

export function StrategicObjectivesCreateForm() {
  const router = useRouter();

  const [objectiveTypeOptions, setObjectiveTypeOptions] = useState<Option[]>([]);
  const [objectiveOptions, setObjectiveOptions] = useState<Option[]>([]);

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, { message: 'El nombre es obligatorio' }),
        code: z.string().min(1, { message: 'El código es obligatorio' }),
        description: z.string().min(1, { message: 'La descripción es obligatoria' }),
        objectiveLevel: z.number().min(1, { message: 'El nivel es obligatorio' }),
        objectiveTypeId: z.number().optional().nullable(),
        startDate: z.string().min(1, { message: 'La fecha de redacción es obligatoria' }),
        endDate: z.string().min(1, { message: 'La fecha de expiración es obligatoria' }),
        measurementForm: z.string().min(1, { message: 'La forma de medición es obligatoria' }),
        consequencesOfNotAchieving: z
          .string()
          .min(1, { message: 'Las consecuencias de no lograrlo son obligatorias' }),
        participantId: z.string().optional(),
        superiorObjectiveId: z.number().optional().nullable(),
      }),
    []
  );

  const methods = useForm<FormValues>({
    mode: 'onSubmit',
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      objectiveLevel: 0,
      objectiveTypeId: null,
      startDate: '',
      endDate: '',
      measurementForm: '',
      consequencesOfNotAchieving: '',
      participantId: '',
      superiorObjectiveId: null,
    },
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const loadObjectiveTypes = useCallback(async () => {
    try {
      const res = await GetObjectiveTypesPaginationService({ page: 1, perPage: 1000 });
      const raw = res?.data;
      const list = Array.isArray(raw)
        ? raw
        : raw && typeof raw === 'object' && Array.isArray((raw as any).data)
          ? ((raw as any).data as any[])
          : [];

      const opts = list
        .map((it) => ({ value: Number(it?.id), label: String(it?.name ?? it?.code ?? `#${it?.id}`) }))
        .filter((it) => Number.isFinite(it.value) && it.value > 0);

      setObjectiveTypeOptions(opts);
    } catch {
      setObjectiveTypeOptions([]);
    }
  }, []);

  const loadObjectives = useCallback(async () => {
    try {
      const res = await GetObjectivesPaginationService({ page: 1, perPage: 1000 });
      const raw = res?.data;
      const list = Array.isArray(raw)
        ? raw
        : raw && typeof raw === 'object' && Array.isArray((raw as any).data)
          ? ((raw as any).data as any[])
          : [];

      const opts = list
        .map((it) => ({ value: Number(it?.id), label: String(it?.name ?? it?.code ?? `#${it?.id}`) }))
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

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload: any = {
        name: data.name,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        measurementForm: data.measurementForm,
        consequencesOfNotAchieving: data.consequencesOfNotAchieving,
        objectiveLevel: Number(data.objectiveLevel),
        code: data.code,
      };

      if (data.participantId?.trim()) payload.participantId = data.participantId.trim();
      if (data.superiorObjectiveId) payload.superiorObjective = { id: Number(data.superiorObjectiveId) };
      if (data.objectiveTypeId) payload.objectiveType = { id: Number(data.objectiveTypeId) };

      await SaveOrUpdateObjectivesService(payload);
      reset();
      toast.success('Objetivo estratégico creado con éxito');
      router.push(paths.dashboard.architecture.strategicObjectivesTable);
    } catch {
      toast.error('Error al guardar el objetivo estratégico');
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={3}>
        <Card>
          <Stack spacing={3} sx={{ p: 3 }}>
            <Typography variant="h6">Detalles</Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <Field.Text name="name" label="Nombre" />
              <Field.Text name="code" label="Código" />
            </Box>

            <Field.Text name="description" label="Descripción" multiline minRows={3} />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <Field.Select name="objectiveLevel" label="Nivel">
                <MenuItem value={0} disabled>
                  Seleccione
                </MenuItem>
                {[1, 2, 3, 4, 5].map((level) => (
                  <MenuItem key={level} value={level}>
                    {level}
                  </MenuItem>
                ))}
              </Field.Select>

              <Field.Select name="objectiveTypeId" label="Tipo">
                <MenuItem value={0}>Seleccione</MenuItem>
                {objectiveTypeOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Field.Select>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <Field.DatePicker name="startDate" label="Fecha de Redacción" />
              <Field.DatePicker name="endDate" label="Fecha de Expiración" />
            </Box>

            <Field.Text name="measurementForm" label="Forma de Medición" multiline minRows={3} />
            <Field.Text name="consequencesOfNotAchieving" label="Consecuencias de no lograrlo" multiline minRows={3} />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <Field.Text name="participantId" label="Participante" />

              <Field.Select name="superiorObjectiveId" label="Objetivo superior">
                <MenuItem value={0}>Seleccione</MenuItem>
                {objectiveOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Field.Select>
            </Box>
          </Stack>
        </Card>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: 'flex-start' }}>
          <Button size="medium" variant="soft" color="inherit" onClick={() => router.back()}>
            Cancelar
          </Button>

          <Button
            size="medium"
            type="submit"
            variant="contained"
            loading={isSubmitting}
            loadingIndicator="Guardando..."
          >
            Guardar
          </Button>
        </Box>
      </Stack>
    </Form>
  );
}
