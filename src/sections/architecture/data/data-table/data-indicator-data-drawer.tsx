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
import { GetIndicatorsListService } from 'src/services/architecture/tools/toolsRelations.service';
import {
  SaveDataIndicatorRelationService,
  UpdateDataIndicatorRelationService,
  GetDataIndicatorRelationByIdService,
} from 'src/services/architecture/data/dataIndicator.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

type Option = { id: number; label: string };

type Props = {
  open: boolean;
  onClose: () => void;
  dataId: number;
  dataLabel?: string;
  relationId?: number | null;
  onSuccess?: () => void;
  excludeIds?: number[];
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

export function DataIndicatorDataDrawer({ open, onClose, dataId, dataLabel, relationId, onSuccess, excludeIds, sx }: Props) {
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
      const res = await GetIndicatorsListService({ page: 1, perPage: 1000 });
      const list = normalizeList((res as { data?: unknown })?.data);
      const mapped: Option[] = list
        .map((it) => {
          if (!it || typeof it !== 'object') return null;
          const rec = it as Record<string, unknown>;
          const id = Number(rec.id);
          if (!Number.isFinite(id)) return null;
          const label = String(rec.indicatorName ?? rec.name ?? rec.label ?? `#${id}`);
          return { id, label };
        })
        .filter((o): o is Option => Boolean(o));
      const finalOptions = !isEditing && excludeIds?.length ? mapped.filter((o) => !excludeIds.includes(o.id)) : mapped;
      setOptions(finalOptions);
    } catch {
      setOptions([]);
      toast.error(t('data.map.indicatorData.messages.listLoadError'));
    } finally {
      setListLoading(false);
    }
  }, [excludeIds, isEditing, t]);

  const resetForm = useCallback(() => {
    setSelectedId(null);
    setObservations('');
  }, []);

  const loadRelation = useCallback(async () => {
    if (relationId == null) return;
    try {
      setRelationLoading(true);
      const res = await GetDataIndicatorRelationByIdService(relationId);
      const rec = (res as { data?: unknown })?.data as
        | { indicator?: { id?: unknown }; observations?: unknown } | undefined;
      const indicatorId = Number(rec?.indicator?.id);
      if (Number.isFinite(indicatorId)) setSelectedId(indicatorId);
      setObservations(String(rec?.observations ?? ''));
    } catch {
      toast.error(t('data.map.indicatorData.messages.loadError'));
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
      toast.error(t('data.map.indicatorData.form.validation.required'));
      return;
    }
    try {
      setSaving(true);
      const payload = {
        observations: observations.trim() || undefined,
        indicator: { id: selectedId },
        data: { id: dataId },
      };
      if (relationId != null) {
        await UpdateDataIndicatorRelationService(relationId, payload);
        toast.success(t('data.map.indicatorData.messages.updated'));
      } else {
        await SaveDataIndicatorRelationService(payload);
        toast.success(t('data.map.indicatorData.messages.created'));
      }
      onSuccess?.();
      onClose();
    } catch {
      toast.error(t('data.map.indicatorData.messages.saveError'));
    } finally {
      setSaving(false);
    }
  }, [dataId, observations, onClose, onSuccess, relationId, selectedId, t]);

  const title = dataLabel
    ? t('data.map.indicatorData.titleWithData', { data: dataLabel })
    : t('data.map.indicatorData.title');

  return (
    <Drawer open={open} onClose={onClose} anchor="right" PaperProps={{ sx: { width: { xs: 1, sm: 520, md: 680 }, ...sx } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, py: 2 }}>
        <Stack spacing={0.5}>
          <Typography variant="h6">{title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('data.map.indicatorData.subtitle')}
          </Typography>
        </Stack>
        <IconButton onClick={onClose}>
          <Iconify icon="solar:close-circle-bold" />
        </IconButton>
      </Stack>

      <Divider />

      <Stack spacing={2.5} sx={{ px: 3, py: 2.5 }}>
        <Typography variant="subtitle2">{t('data.map.indicatorData.form.title')}</Typography>

        <Autocomplete
          options={options}
          value={selectedOption}
          onChange={(_, value) => setSelectedId(value?.id ?? null)}
          getOptionLabel={(o) => o.label}
          loading={listLoading}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('data.map.indicatorData.form.fields.indicator')}
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
          label={t('data.map.indicatorData.form.fields.observations')}
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          disabled={saving || relationLoading}
          multiline
          minRows={3}
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
            {isEditing ? t('data.map.indicatorData.actions.update') : t('data.map.indicatorData.actions.create')}
          </Button>
        </Stack>
      </Stack>
    </Drawer>
  );
}
