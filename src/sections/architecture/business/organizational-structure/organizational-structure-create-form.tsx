import type { IOrganizationalUnit } from 'src/types/organization';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import {
  SaveOrUpdateOrganizationalUnitService,
  GetOrganizationalUnitPaginationService,
  normalizeOrganizationalUnitListResponse,
} from 'src/services/organization/organizationalUnit.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { Form, Field } from 'src/components/hook-form';

type Option = { value: string; label: string };

type FormValues = {
  name: string;
  code: string;
  description: string;
  color: string;
  parentId?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentOrganizationalUnit?: IOrganizationalUnit | null;
};

export function OrganizationalStructureCreateEditDrawer({ open, onClose, onSuccess, currentOrganizationalUnit }: Props) {
  const [parentOptions, setParentOptions] = useState<Option[]>([]);
  const isEdit = Boolean(currentOrganizationalUnit?.id);

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

  const defaultValues = useMemo<FormValues>(
    () => ({
      name: currentOrganizationalUnit?.name ?? '',
      code: currentOrganizationalUnit?.code ?? '',
      description: currentOrganizationalUnit?.description ?? '',
      color: currentOrganizationalUnit?.color ?? '#0000FF',
      parentId: currentOrganizationalUnit?.parent?.id ? String(currentOrganizationalUnit.parent.id) : '',
    }),
    [currentOrganizationalUnit]
  );

  const methods = useForm<FormValues>({
    mode: 'onSubmit',
    resolver: zodResolver(schema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [open, defaultValues, reset]);

  const loadParents = useCallback(async () => {
    try {
      const res = await GetOrganizationalUnitPaginationService({ page: 1, perPage: 1000 });
      const raw = res?.data as any;
      const list = normalizeOrganizationalUnitListResponse(raw);

      const opts = (list || [])
        .filter((it) => String(it.id) !== String(currentOrganizationalUnit?.id ?? ''))
        .map((it) => ({ value: String(it.id), label: String(it.name || it.code || `#${it.id}`) }))
        .filter((it) => it.value);

      setParentOptions(opts);
    } catch {
      setParentOptions([]);
    }
  }, [currentOrganizationalUnit?.id]);

  useEffect(() => {
    if (open) {
      loadParents();
    }
  }, [open, loadParents]);

  useEffect(() => {
    const parent = currentOrganizationalUnit?.parent;
    if (!parent?.id) return;
    const value = String(parent.id);
    const label = String(parent.name ?? parent.code ?? `#${value}`);
    setParentOptions((prev) => (prev.some((opt) => opt.value === value) ? prev : [{ value, label }, ...prev]));
  }, [currentOrganizationalUnit?.parent]);

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

      await SaveOrUpdateOrganizationalUnitService(payload, currentOrganizationalUnit?.id);
      
      reset();
      onSuccess();
      onClose();
      
      toast.success(
        isEdit ? 'Estructura organizacional actualizada con éxito' : 'Estructura organizacional creada con éxito'
      );
    } catch {
      toast.error('Error al guardar la estructura organizacional');
    }
  });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor="right"
      slotProps={{ backdrop: { invisible: true } }}
      PaperProps={{ sx: { width: { xs: 1, md: 480 } } }}
    >
      <Form methods={methods} onSubmit={onSubmit}>
        <Stack sx={{ height: 1, display: 'flex', flexDirection: 'column' }}>
          <Box
            sx={{
              p: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: (theme) => `solid 1px ${theme.vars.palette.divider}`,
            }}
          >
            <Typography variant="h6">{isEdit ? 'Editar estructura organizacional' : 'Crear estructura organizacional'}</Typography>

            <IconButton onClick={onClose}>
              <Iconify icon="mingcute:close-line" />
            </IconButton>
          </Box>

          <Scrollbar sx={{ flexGrow: 1, p: 2.5 }}>
            <Stack spacing={3}>
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
          </Scrollbar>

          <Box sx={{ p: 2.5, display: 'flex', gap: 2, borderTop: (theme) => `solid 1px ${theme.vars.palette.divider}` }}>
            <Button fullWidth variant="soft" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              fullWidth
              type="submit"
              variant="contained"
              loading={isSubmitting}
            >
              {isEdit ? 'Guardar cambios' : 'Guardar'}
            </Button>
          </Box>
        </Stack>
      </Form>
    </Drawer>
  );
}
