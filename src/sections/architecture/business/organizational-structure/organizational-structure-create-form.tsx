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

import { useTranslate } from 'src/locales';
import { GetOrganizationalUnitTypesPaginationService } from 'src/services/architecture/catalogs/organizationalUnitTypes.service';
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
  parentId?: string;
  orgUnitTypeId: string;
  expectedResults: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentOrganizationalUnit?: IOrganizationalUnit | null;
};

export function OrganizationalStructureCreateEditDrawer({ open, onClose, onSuccess, currentOrganizationalUnit }: Props) {
  const { t } = useTranslate('organization');
  const [parentOptions, setParentOptions] = useState<Option[]>([]);
  const [orgUnitTypeOptions, setOrgUnitTypeOptions] = useState<Option[]>([]);
  const isEdit = Boolean(currentOrganizationalUnit?.id);

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, { message: t('organization.form.fields.name.required') }),
        code: z.string().min(1, { message: t('organization.form.fields.code.required') }),
        description: z.string().min(1, { message: t('organization.form.fields.description.required') }),
        parentId: z.string().optional(),
        orgUnitTypeId: z.string().min(1, { message: t('organization.form.fields.orgUnitTypeId.required') }),
        expectedResults: z.string().min(1, { message: t('organization.form.fields.expectedResults.required') }),
      }),
    [t]
  );

  const defaultValues = useMemo<FormValues>(
    () => ({
      name: currentOrganizationalUnit?.name ?? '',
      code: currentOrganizationalUnit?.code ?? '',
      description: currentOrganizationalUnit?.description ?? '',
      parentId: currentOrganizationalUnit?.parent?.id ? String(currentOrganizationalUnit.parent.id) : '',
      orgUnitTypeId: currentOrganizationalUnit?.orgUnitTypeId ? String(currentOrganizationalUnit.orgUnitTypeId) : '',
      expectedResults: currentOrganizationalUnit?.expectedResults ?? '',
    }),
    [currentOrganizationalUnit]
  );

  const methods = useForm<FormValues>({
    mode: 'all',
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

  const loadOrgUnitTypes = useCallback(async () => {
    try {
      const res = await GetOrganizationalUnitTypesPaginationService({ page: 1, perPage: 1000 });
      const raw = res?.data as any;
      
      let list: any[] = [];
      
      // Check for [items[], count] pattern (NestJS standard pagination often returns this)
      if (Array.isArray(raw) && raw.length === 2 && Array.isArray(raw[0]) && typeof raw[1] === 'number') {
        list = raw[0];
      }
      // Check if it is a simple array
      else if (Array.isArray(raw)) {
        list = raw;
      } 
      // Check for { data: [...] } pattern
      else if (raw?.data && Array.isArray(raw.data)) {
        list = raw.data;
      }

      const opts = list.map((it: any) => ({ value: String(it.id), label: it.name }));
      setOrgUnitTypeOptions(opts);
    } catch (error) {
      console.error(error);
      setOrgUnitTypeOptions([]);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadParents();
      loadOrgUnitTypes();
    }
  }, [open, loadParents, loadOrgUnitTypes]);

  useEffect(() => {
    const parent = currentOrganizationalUnit?.parent;
    if (!parent?.id) return;
    const value = String(parent.id);
    const label = String(parent.name ?? parent.code ?? `#${value}`);
    setParentOptions((prev) => (prev.some((opt) => opt.value === value) ? prev : [{ value, label }, ...prev]));
  }, [currentOrganizationalUnit?.parent]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload: any = {
        name: data.name,
        code: data.code,
        description: data.description,
        color: '',
        orgUnitTypeId: Number(data.orgUnitTypeId),
        expectedResults: data.expectedResults,
      };

      if (data.parentId && data.parentId !== '') {
        payload.parentId = Number(data.parentId);
      }

      await SaveOrUpdateOrganizationalUnitService(payload, currentOrganizationalUnit?.id);
      
      reset();
      onSuccess();
      onClose();
      
      toast.success(
        isEdit ? t('organization.updateSuccess') : t('organization.createSuccess')
      );
    } catch {
      toast.error(t('organization.saveError'));
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
            <Typography variant="h6">{isEdit ? t('organization.titles.edit') : t('organization.titles.create')}</Typography>

            <IconButton onClick={onClose}>
              <Iconify icon="mingcute:close-line" />
            </IconButton>
          </Box>

          <Scrollbar sx={{ flexGrow: 1, p: 2.5 }}>
            <Stack spacing={3}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <Field.Text name="name" label={t('organization.form.fields.name.label')} />
                <Field.Text name="code" label={t('organization.form.fields.code.label')} />
              </Box>

              <Field.Text name="description" label={t('organization.form.fields.description.label')} multiline minRows={3} />
              
              <Field.Text name="expectedResults" label={t('organization.form.fields.expectedResults.label')} multiline minRows={3} />

              <Field.Select name="orgUnitTypeId" label={t('organization.form.fields.orgUnitTypeId.label')}>
                <MenuItem value="">{t('organization.form.fields.orgUnitTypeId.placeholder')}</MenuItem>
                {orgUnitTypeOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Field.Select>

              <Field.Select name="parentId" label={t('organization.form.fields.parentId.label')}>
                <MenuItem value="">{t('organization.form.fields.parentId.placeholder')}</MenuItem>
                {parentOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Field.Select>
            </Stack>
          </Scrollbar>

          <Box sx={{ p: 2.5, display: 'flex', gap: 2, borderTop: (theme) => `solid 1px ${theme.vars.palette.divider}` }}>
            <Button fullWidth variant="soft" onClick={onClose}>
              {t('organization.actions.cancel')}
            </Button>
            <Button
              fullWidth
              type="submit"
              variant="contained"
              loading={isSubmitting}
            >
              {isEdit ? t('organization.actions.save') : t('organization.actions.save')}
            </Button>
          </Box>
        </Stack>
      </Form>
    </Drawer>
  );
}
