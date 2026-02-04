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

import {
  SaveOrUpdateOrganizationalUnitService,
  GetOrganizationalUnitPaginationService,
  normalizeOrganizationalUnitListResponse,
} from 'src/services/organization/organizationalUnit.service';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

type Option = { value: string; label: string };

type FormValues = {
  name: string;
  code: string;
  description: string;
  color: string;
  parentId?: string;
};

export function OrganizationalStructureCreateForm() {
  const router = useRouter();
  const [parentOptions, setParentOptions] = useState<Option[]>([]);

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, { message: 'El nombre es obligatorio' }),
        code: z.string().min(1, { message: 'El código es obligatorio' }),
        description: z.string().min(1, { message: 'La descripción es obligatoria' }),
        color: z.string().min(1, { message: 'El color es obligatorio' }),
        parentId: z.string().optional(),
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
      color: '#0000FF',
      parentId: '',
    },
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const loadParents = useCallback(async () => {
    try {
      const res = await GetOrganizationalUnitPaginationService({ page: 1, perPage: 1000 });
      const raw = res?.data as any;
      const list = normalizeOrganizationalUnitListResponse(raw);

      const opts = (list || [])
        .map((it) => ({ value: String(it.id), label: String(it.name || it.code || `#${it.id}`) }))
        .filter((it) => it.value);

      setParentOptions(opts);
    } catch {
      setParentOptions([]);
    }
  }, []);

  useEffect(() => {
    loadParents();
  }, [loadParents]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const parentIdValue = data.parentId?.trim();
      const parentIdNumber = parentIdValue && /^[0-9]+$/.test(parentIdValue) ? Number(parentIdValue) : parentIdValue;

      const payload: any = {
        name: data.name,
        code: data.code,
        description: data.description,
        color: data.color,
      };

      if (parentIdValue) payload.parentId = parentIdNumber;

      await SaveOrUpdateOrganizationalUnitService(payload);
      reset();
      toast.success('Estructura organizacional creada con éxito');
      router.push(paths.dashboard.architecture.organizationalStructureTable);
    } catch {
      toast.error('Error al guardar la estructura organizacional');
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
              <Field.Text name="color" label="Color" type="color" slotProps={{ inputLabel: { shrink: true } }} />

              <Field.Select name="parentId" label="Estructura Organizacional Superior">
                <MenuItem value="">Seleccione</MenuItem>
                {parentOptions.map((opt) => (
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
