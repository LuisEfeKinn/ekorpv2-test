'use client';

import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import {
  GetDocumentsListService,
  GetIndicatorsListService,
  SaveToolDocumentRelationService,
  SaveToolIndicatorRelationService,
} from 'src/services/architecture/tools/toolsRelations.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  toolId: string;
  kind: 'document' | 'indicator';
};

type Option = { value: number; label: string };

export function ToolsRelationsDrawer({ open, onClose, onSuccess, toolId, kind }: Props) {
  const { t } = useTranslate('architecture');
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<Option[]>([]);

  const isDocument = kind === 'document';
  const title = isDocument
    ? t('tools.relations.document.title')
    : t('tools.relations.indicator.title');
  
  const labelSelect = isDocument
    ? t('tools.relations.document.select')
    : t('tools.relations.indicator.select');

  const Schema = useMemo(
    () =>
      zod.object({
        elementId: zod.number().min(1, { message: t('tools.relations.common.selectElement') }),
        observations: zod.string().optional(),
      }),
    [t]
  );

  const methods = useForm({
    resolver: zodResolver(Schema),
    defaultValues: {
      elementId: 0,
      observations: '',
    },
  });

  const { reset, handleSubmit } = methods;

  const loadOptions = useCallback(async () => {
    try {
      let response;
      if (isDocument) {
        response = await GetDocumentsListService({ page: 1, perPage: 1000 });
      } else {
        response = await GetIndicatorsListService({ page: 1, perPage: 1000 });
      }

      const raw = response?.data;
      const list = Array.isArray(raw)
        ? raw
        : raw && typeof raw === 'object' && Array.isArray((raw as any).data)
          ? ((raw as any).data as any[])
          : [];

      const opts = list
        .map((it) => ({
          value: Number(it?.id),
          label: String(it?.name || it?.title || it?.indicatorName || `#${it?.id}`),
        }))
        .filter((it) => Number.isFinite(it.value) && it.value > 0);

      setOptions(opts);
    } catch (error) {
      console.error(error);
      setOptions([]);
    }
  }, [isDocument]);

  useEffect(() => {
    if (open) {
      reset();
      loadOptions();
    }
  }, [open, reset, loadOptions]);

  const onSubmit = handleSubmit(async (data) => {
    if (!toolId) return;

    try {
      setLoading(true);

      if (isDocument) {
        await SaveToolDocumentRelationService({
          observations: data.observations,
          tool: { id: Number(toolId) },
          document: { id: data.elementId },
        });
      } else {
        await SaveToolIndicatorRelationService({
          observations: data.observations,
          tool: { id: Number(toolId) },
          indicator: { id: data.elementId },
        });
      }

      toast.success(t('tools.relations.common.saveSuccess'));
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(t('tools.relations.common.saveError'));
    } finally {
      setLoading(false);
    }
  });

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 480 } }}>
      <Box sx={{ px: 3, py: 3 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          {title}
        </Typography>

        <Form methods={methods} onSubmit={onSubmit}>
          <Stack spacing={3}>
            <Field.Select name="elementId" label={labelSelect}>
              <MenuItem value={0} disabled>
                {t('tools.relations.common.select')}
              </MenuItem>
              {options.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Field.Select>

            <Field.Text
              name="observations"
              label={t('tools.relations.common.observations', { defaultValue: 'Observaciones' })}
              multiline
              minRows={3}
            />

            <Stack direction="row" spacing={1.5} sx={{ pt: 2 }}>
              <Button variant="outlined" onClick={onClose} disabled={loading} fullWidth>
                {t('tools.relations.common.cancel')}
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                fullWidth
                startIcon={
                  loading ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <Iconify icon="mingcute:add-line" />
                  )
                }
              >
                {t('tools.relations.common.relate')}
              </Button>
            </Stack>
          </Stack>
        </Form>
      </Box>
    </Drawer>
  );
}
