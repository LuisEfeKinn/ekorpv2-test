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
  GetOrganizationalUnitByIdService,
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

type OrganizationalUnitTypeRecord = { id: number | string; name: string };

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

  const getOrgUnitTypeIdFromUnit = useCallback((unit: IOrganizationalUnit | null | undefined) => {
    const direct = unit?.orgUnitTypeId;
    if (direct !== null && direct !== undefined && String(direct).trim().length > 0) return String(direct);

    if (unit && typeof unit === 'object') {
      const record = unit as unknown as Record<string, unknown>;
      const fromObj =
        record.orgUnitType && typeof record.orgUnitType === 'object'
          ? (record.orgUnitType as Record<string, unknown>).id
          : undefined;
      if (fromObj !== null && fromObj !== undefined && String(fromObj).trim().length > 0) return String(fromObj);
    }

    return '';
  }, []);

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
      orgUnitTypeId: getOrgUnitTypeIdFromUnit(currentOrganizationalUnit),
      expectedResults: currentOrganizationalUnit?.expectedResults ?? '',
    }),
    [currentOrganizationalUnit, getOrgUnitTypeIdFromUnit]
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

  const normalizeUnitByIdResponse = useCallback((raw: unknown): Record<string, unknown> | null => {
    if (!raw || typeof raw !== 'object') return null;
    const obj = raw as Record<string, unknown>;

    const first = obj.data;
    if (first && typeof first === 'object') {
      const firstObj = first as Record<string, unknown>;
      const second = firstObj.data;
      if (second && typeof second === 'object') return second as Record<string, unknown>;
      return firstObj;
    }

    return obj;
  }, []);

  useEffect(() => {
    if (open) {
      if (isEdit && currentOrganizationalUnit?.id) {
        // First reset to default values (from row) so user sees something immediately
        reset(defaultValues);
        
        GetOrganizationalUnitByIdService(currentOrganizationalUnit.id)
          .then((response) => {
            const data = normalizeUnitByIdResponse(response?.data);
            if (data) {
              // Prepare merged values, preferring API data but falling back to defaultValues (row data)
              // This prevents fields from disappearing if API returns null/undefined
              const mergedValues = {
                name: (data.name as string | undefined) || defaultValues.name,
                code: (data.code as string | undefined) || defaultValues.code,
                description: (data.description as string | undefined) || defaultValues.description,
                expectedResults:
                  (data.expectedResults as string | undefined) ??
                  (data.expected_results as string | undefined) ??
                  defaultValues.expectedResults,
                parentId:
                  data.parent && typeof data.parent === 'object' && (data.parent as Record<string, unknown>).id
                    ? String((data.parent as Record<string, unknown>).id)
                    : data.parentId
                      ? String(data.parentId)
                      : defaultValues.parentId,
                orgUnitTypeId:
                  data.orgUnitTypeId
                    ? String(data.orgUnitTypeId)
                    : data.orgUnitType && typeof data.orgUnitType === 'object' && (data.orgUnitType as Record<string, unknown>).id
                      ? String((data.orgUnitType as Record<string, unknown>).id)
                      : defaultValues.orgUnitTypeId,
              };

              // Ensure the selected parent is in the options list
              if (data.parent && typeof data.parent === 'object' && (data.parent as Record<string, unknown>).id) {
                const parent = data.parent as Record<string, unknown>;
                const parentId = String(parent.id);
                const parentLabel = String(parent.name ?? parent.code ?? `#${parentId}`);
                setParentOptions((prev) => 
                  prev.some((opt) => opt.value === parentId) 
                    ? prev 
                    : [{ value: parentId, label: parentLabel }, ...prev]
                );
              }

              // Ensure the selected orgUnitType is in the options list
              if (mergedValues.orgUnitTypeId) {
                const typeId = mergedValues.orgUnitTypeId;
                const typeLabel =
                  data.orgUnitType && typeof data.orgUnitType === 'object'
                    ? String((data.orgUnitType as Record<string, unknown>).name ?? `#${typeId}`)
                    : `#${typeId}`;
                setOrgUnitTypeOptions((prev) =>
                  prev.some((opt) => opt.value === typeId)
                    ? prev
                    : [{ value: typeId, label: typeLabel }, ...prev]
                );
              }

              // Update form with merged values
              reset(mergedValues);
            }
          })
          .catch((error) => {
            console.error(error);
            // If API fails, we still have the defaultValues from the first reset
            toast.error(t('organization.messages.loadError'));
          });
      } else {
        reset(defaultValues);
      }
    }
  }, [
    currentOrganizationalUnit?.id,
    defaultValues,
    isEdit,
    normalizeUnitByIdResponse,
    open,
    reset,
    t,
  ]);

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
      const raw: unknown = res?.data;

      const isOrgUnitType = (value: unknown): value is OrganizationalUnitTypeRecord => {
        if (!value || typeof value !== 'object') return false;
        const record = value as Record<string, unknown>;
        const id = record.id;
        return (typeof id === 'number' || typeof id === 'string') && typeof record.name === 'string';
      };

      const normalizeOrgUnitTypes = (value: unknown): OrganizationalUnitTypeRecord[] => {
        if (Array.isArray(value)) {
          if (value.length === 2 && Array.isArray(value[0])) return value[0].filter(isOrgUnitType);
          return value.filter(isOrgUnitType);
        }

        if (value && typeof value === 'object') {
          const record = value as Record<string, unknown>;
          if (Array.isArray(record.data)) return record.data.filter(isOrgUnitType);
          if (record.data && typeof record.data === 'object') {
            const nested = record.data as Record<string, unknown>;
            if (Array.isArray(nested.data)) return nested.data.filter(isOrgUnitType);
          }
        }

        return [];
      };

      const list = normalizeOrgUnitTypes(raw);
      const opts: Option[] = list.map((it) => ({ value: String(it.id), label: it.name }));
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
      const payload: {
        name: string;
        code: string;
        description: string;
        color: string;
        orgUnitTypeId: number;
        expectedResults: string;
        parentId?: number;
      } = {
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
        isEdit ? t('organization.actions.updateSuccess') : t('organization.actions.createSuccess')
      );
    } catch {
      toast.error(t('organization.actions.saveError'));
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
            <Typography variant="h6">{isEdit ? t('organization.form.titles.edit') : t('organization.form.titles.create')}</Typography>

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
