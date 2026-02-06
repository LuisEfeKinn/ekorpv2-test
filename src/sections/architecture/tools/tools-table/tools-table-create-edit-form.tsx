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

import { useTranslate } from 'src/locales';
import { GetToolTypesPaginationService } from 'src/services/architecture/catalogs/toolTypes.service';
import { SaveOrUpdateToolsTableService, GetToolsTablePaginationService } from 'src/services/architecture/tools/toolsTable.service';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

type FormValues = {
  name: string;
  code: string;
  description: string;
  toolTypeId: number;
  superiorToolId?: number | null;
};

type Option = { value: number; label: string };

export function ToolsTableCreateEditForm() {
  const router = useRouter();
  const { t } = useTranslate('architecture');

  const [toolTypeOptions, setToolTypeOptions] = useState<Option[]>([]);
  const [superiorToolOptions, setSuperiorToolOptions] = useState<Option[]>([]);

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, { message: t('tools.table.form.fields.name.required') }),
        code: z.string().min(1, { message: t('tools.table.form.fields.code.required') }),
        description: z.string().min(1, { message: t('tools.table.form.fields.description.required') }),
        toolTypeId: z.number().min(1, { message: t('tools.table.form.fields.riskType.required') }),
        superiorToolId: z.number().optional().nullable(),
      }),
    [t]
  );

  const methods = useForm<FormValues>({
    mode: 'onSubmit',
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      toolTypeId: 0,
      superiorToolId: null,
    },
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const loadToolTypes = useCallback(async () => {
    try {
      const res = await GetToolTypesPaginationService({ page: 1, perPage: 1000 });
      const raw = res?.data;

      const list = Array.isArray(raw)
        ? raw
        : raw && typeof raw === 'object' && Array.isArray((raw as any).data)
          ? ((raw as any).data as any[])
          : [];

      const opts = list
        .map((it) => ({ value: Number(it?.id), label: String(it?.name ?? it?.code ?? `#${it?.id}`) }))
        .filter((it) => Number.isFinite(it.value) && it.value > 0);

      setToolTypeOptions(opts);
    } catch {
      setToolTypeOptions([]);
    }
  }, []);

  const loadSuperiorTools = useCallback(async () => {
    try {
      const res = await GetToolsTablePaginationService({ page: 1, perPage: 1000 });
      const raw = res?.data;

      const list = Array.isArray(raw)
        ? raw
        : raw && typeof raw === 'object' && Array.isArray((raw as any).data)
          ? ((raw as any).data as any[])
          : [];

      const opts = list
        .map((it) => ({ value: Number(it?.id), label: String(it?.name ?? it?.code ?? `#${it?.id}`) }))
        .filter((it) => Number.isFinite(it.value) && it.value > 0);

      setSuperiorToolOptions(opts);
    } catch {
      setSuperiorToolOptions([]);
    }
  }, []);

  useEffect(() => {
    loadToolTypes();
    loadSuperiorTools();
  }, [loadToolTypes, loadSuperiorTools]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload: any = {
        name: data.name,
        description: data.description,
        code: data.code,
      };

      if (data.toolTypeId) payload.toolType = { id: Number(data.toolTypeId) };
      if (data.superiorToolId) payload.superiorTool = { id: Number(data.superiorToolId) };

      await SaveOrUpdateToolsTableService(payload);
      reset();
      toast.success(t('tools.table.messages.createSuccess'));
      router.push(paths.dashboard.architecture.toolsTable);
    } catch {
      toast.error(t('tools.table.messages.saveError'));
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={3}>
        <Card>
          <Stack spacing={3} sx={{ p: 3 }}>
            <Typography variant="h6">{t('tools.table.form.sections.details')}</Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <Field.Text name="name" label={t('tools.table.form.fields.name.label')} />
              <Field.Text name="code" label={t('tools.table.form.fields.code.label')} />
            </Box>

            <Field.Text
              name="description"
              label={t('tools.table.form.fields.description.label')}
              multiline
              minRows={3}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <Field.Select
                name="toolTypeId"
                label={t('tools.table.form.fields.riskType.label')}
              >
                <MenuItem value={0} disabled>
                  {t('tools.table.form.fields.riskType.placeholder')}
                </MenuItem>
                {toolTypeOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Field.Select>

              <Field.Select
                name="superiorToolId"
                label={t('tools.table.form.fields.superiorRisk.label')}
              >
                <MenuItem value={0}>{t('common.none', { defaultValue: 'Ninguno' })}</MenuItem>
                {superiorToolOptions.map((opt) => (
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
            {t('tools.table.actions.cancel')}
          </Button>

          <Button
            size="medium"
            type="submit"
            variant="contained"
            loading={isSubmitting}
            loadingIndicator={t('tools.table.actions.saving')}
          >
            {t('tools.table.actions.save')}
          </Button>
        </Box>
      </Stack>
    </Form>
  );
}
