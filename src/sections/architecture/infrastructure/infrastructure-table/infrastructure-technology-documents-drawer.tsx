'use client';

import type { Theme, SxProps } from '@mui/material/styles';

import { useMemo, useState, useEffect, useCallback } from 'react';

import {
  Stack,
  Drawer,
  Button,
  Divider,
  TextField,
  Typography,
  IconButton,
  Autocomplete,
  CircularProgress,
} from '@mui/material';

import { useTranslate } from 'src/locales';
import { GetDocumentsListService } from 'src/services/architecture/tools/toolsRelations.service';
import {
  SaveTechnologyDocumentRelationService,
  UpdateTechnologyDocumentRelationService,
  GetTechnologyDocumentRelationByIdService,
} from 'src/services/architecture/infrastructure/technologyDocuments.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

type Option = { id: number; label: string };

type Props = {
  open: boolean;
  onClose: () => void;
  technologyId: number;
  technologyLabel?: string;
  relationId?: number | null;
  onSuccess?: () => void;
  sx?: SxProps<Theme>;
};

function normalizeList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    if (Array.isArray(raw[0])) return raw[0];
    return raw;
  }
  if (raw && typeof raw === 'object') {
    const maybe = raw as Record<string, unknown>;
    if (Array.isArray(maybe.data)) return maybe.data;
    if (maybe.data && typeof maybe.data === 'object') {
      const inner = maybe.data as Record<string, unknown>;
      if (Array.isArray(inner.data)) return inner.data;
      if (Array.isArray(inner.items)) return inner.items;
    }
    if (Array.isArray(maybe.items)) return maybe.items;
  }
  return [];
}

export function InfrastructureTechnologyDocumentsDrawer({ open, onClose, technologyId, technologyLabel, relationId, onSuccess, sx }: Props) {
  const { t } = useTranslate('architecture');

  const [saving, setSaving] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [relationLoading, setRelationLoading] = useState(false);
  const [options, setOptions] = useState<Option[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [observations, setObservations] = useState('');

  const isEditing = relationId != null;

  const selectedOption = useMemo(
    () => (selectedId == null ? null : options.find((o) => o.id === selectedId) ?? null),
    [options, selectedId]
  );

  const loadList = useCallback(async () => {
    try {
      setListLoading(true);
      const res = await GetDocumentsListService({ page: 1, perPage: 1000 });
      const list = normalizeList((res as { data?: unknown })?.data);
      const mapped: Option[] = list
        .map((it) => {
          if (!it || typeof it !== 'object') return null;
          const rec = it as Record<string, unknown>;
          const id = Number(rec.id);
          if (!Number.isFinite(id)) return null;
          return { id, label: String(rec.name ?? rec.label ?? `#${id}`) };
        })
        .filter((o): o is Option => Boolean(o));
      setOptions(mapped);
    } catch {
      setOptions([]);
      toast.error(t('infrastructure.map.technologyDocuments.messages.listLoadError'));
    } finally {
      setListLoading(false);
    }
  }, [t]);

  const resetForm = useCallback(() => {
    setSelectedId(null);
    setObservations('');
  }, []);

  const loadRelation = useCallback(async () => {
    if (relationId == null) return;
    try {
      setRelationLoading(true);
      const res = await GetTechnologyDocumentRelationByIdService(relationId);
      const rec = (res as { data?: unknown })?.data as
        | { document?: { id?: unknown }; observations?: unknown } | undefined;
      const docId = Number(rec?.document?.id);
      if (Number.isFinite(docId)) setSelectedId(docId);
      setObservations(String(rec?.observations ?? ''));
    } catch {
      toast.error(t('infrastructure.map.technologyDocuments.messages.loadError'));
    } finally {
      setRelationLoading(false);
    }
  }, [relationId, t]);

  useEffect(() => {
    if (!open) return () => {};
    resetForm();
    loadList();
    loadRelation();
    return () => {};
  }, [loadList, loadRelation, open, resetForm]);

  const handleSubmit = useCallback(async () => {
    if (selectedId == null) {
      toast.error(t('infrastructure.map.technologyDocuments.form.validation.required'));
      return;
    }
    if (!observations.trim()) {
      toast.error(t('infrastructure.map.technologyDocuments.form.validation.observationsRequired'));
      return;
    }
    try {
      setSaving(true);
      const payload = {
        observations: observations.trim(),
        document: { id: selectedId },
        technology: { id: technologyId },
      };
      if (relationId != null) {
        await UpdateTechnologyDocumentRelationService(relationId, payload);
        toast.success(t('infrastructure.map.technologyDocuments.messages.updated'));
      } else {
        await SaveTechnologyDocumentRelationService(payload);
        toast.success(t('infrastructure.map.technologyDocuments.messages.created'));
      }
      onSuccess?.();
      onClose();
    } catch {
      toast.error(t('infrastructure.map.technologyDocuments.messages.saveError'));
    } finally {
      setSaving(false);
    }
  }, [observations, onClose, onSuccess, relationId, selectedId, t, technologyId]);

  const title = technologyLabel
    ? t('infrastructure.map.technologyDocuments.titleWithTechnology', { technology: technologyLabel })
    : t('infrastructure.map.technologyDocuments.title');

  return (
    <Drawer open={open} onClose={onClose} anchor="right" PaperProps={{ sx: { width: { xs: 1, sm: 520, md: 680 }, ...sx } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, py: 2 }}>
        <Stack spacing={0.5}>
          <Typography variant="h6">{title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('infrastructure.map.technologyDocuments.subtitle')}
          </Typography>
        </Stack>
        <IconButton onClick={onClose}>
          <Iconify icon="solar:close-circle-bold" />
        </IconButton>
      </Stack>

      <Divider />

      <Stack spacing={2.5} sx={{ px: 3, py: 2.5 }}>
        <Typography variant="subtitle2">{t('infrastructure.map.technologyDocuments.form.title')}</Typography>

        <Autocomplete
          options={options}
          value={selectedOption}
          onChange={(_, value) => setSelectedId(value?.id ?? null)}
          getOptionLabel={(o) => o.label}
          loading={listLoading}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('infrastructure.map.technologyDocuments.form.fields.document')}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {listLoading ? <CircularProgress color="inherit" size={18} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          disabled={saving || relationLoading}
        />

        <TextField
          label={t('infrastructure.map.technologyDocuments.form.fields.observations')}
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          disabled={saving || relationLoading}
          multiline
          minRows={3}
          InputLabelProps={{ shrink: true }}
          InputProps={{ notched: true }}
        />

        <Stack direction="row" spacing={1.5} justifyContent="flex-end">
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving || relationLoading}
            startIcon={
              saving ? <CircularProgress size={18} color="inherit" /> : <Iconify icon="solar:check-circle-bold" />
            }
          >
            {isEditing ? t('infrastructure.map.technologyDocuments.actions.update') : t('infrastructure.map.technologyDocuments.actions.create')}
          </Button>
        </Stack>
      </Stack>
    </Drawer>
  );
}
