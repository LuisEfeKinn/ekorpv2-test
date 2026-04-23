'use client';

import type { Theme, SxProps } from '@mui/material/styles';

import { useMemo, useState, useEffect, useCallback } from 'react';

import {
  Stack,
  Button,
  Drawer,
  Divider,
  TextField,
  IconButton,
  Typography,
  Autocomplete,
  CircularProgress,
} from '@mui/material';

import { useTranslate } from 'src/locales';
import { GetIndicatorsListService } from 'src/services/architecture/tools/toolsRelations.service';
import {
  SaveSystemIndicatorRelationService,
  UpdateSystemIndicatorRelationService,
  GetSystemIndicatorRelationByIdService,
} from 'src/services/architecture/indicators/systemIndicators.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

type Option = { id: number; label: string };

type Props = {
  open: boolean;
  onClose: () => void;
  systemId: number;
  systemLabel?: string;
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

export function ApplicationSystemIndicatorsDrawer({
  open,
  onClose,
  systemId,
  systemLabel,
  relationId,
  onSuccess,
  sx,
}: Props) {
  const { t } = useTranslate('architecture');

  const [saving, setSaving] = useState(false);
  const [indicatorsLoading, setIndicatorsLoading] = useState(false);
  const [relationLoading, setRelationLoading] = useState(false);

  const [indicatorOptions, setIndicatorOptions] = useState<Option[]>([]);

  const [selectedIndicatorId, setSelectedIndicatorId] = useState<number | null>(null);
  const [observations, setObservations] = useState('');

  const isEditing = relationId != null;

  const selectedIndicatorOption = useMemo(() => {
    if (selectedIndicatorId == null) return null;
    return indicatorOptions.find((o) => o.id === selectedIndicatorId) ?? null;
  }, [indicatorOptions, selectedIndicatorId]);

  const resetForm = useCallback(() => {
    setSelectedIndicatorId(null);
    setObservations('');
  }, []);

  const loadIndicators = useCallback(async () => {
    try {
      setIndicatorsLoading(true);
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

      setIndicatorOptions(mapped);
    } catch {
      setIndicatorOptions([]);
      toast.error(t('application.map.systemIndicators.messages.indicatorsLoadError'));
    } finally {
      setIndicatorsLoading(false);
    }
  }, [t]);

  const loadRelationById = useCallback(async () => {
    if (relationId == null) return;
    try {
      setRelationLoading(true);
      const res = await GetSystemIndicatorRelationByIdService(relationId);
      const rec = (res as { data?: unknown })?.data as
        | {
            observations?: unknown;
            system?: { id?: unknown } | null;
            systemId?: unknown;
            indicator?: { id?: unknown } | null;
            indicatorId?: unknown;
            indicator_id?: unknown;
          }
        | undefined;

      const sysId = Number((rec as { systemId?: unknown } | undefined)?.systemId ?? rec?.system?.id);
      const indicatorId = Number(
        (rec as { indicatorId?: unknown; indicator_id?: unknown } | undefined)?.indicatorId ??
          (rec as { indicator_id?: unknown } | undefined)?.indicator_id ??
          rec?.indicator?.id
      );

      if (!Number.isFinite(indicatorId) || !Number.isFinite(sysId) || sysId !== systemId) {
        toast.error(t('application.map.systemIndicators.messages.loadError'));
        return;
      }

      setSelectedIndicatorId(indicatorId);
      setObservations(String(rec?.observations ?? ''));
    } catch {
      toast.error(t('application.map.systemIndicators.messages.loadError'));
    } finally {
      setRelationLoading(false);
    }
  }, [relationId, systemId, t]);

  useEffect(() => {
    if (!open) return () => {};

    resetForm();
    loadIndicators();
    loadRelationById();
    return () => {};
  }, [loadIndicators, loadRelationById, open, resetForm]);

  const handleSubmit = useCallback(async () => {
    if (selectedIndicatorId == null) {
      toast.error(t('application.map.systemIndicators.form.validation.indicatorRequired'));
      return;
    }

    try {
      setSaving(true);
      const payload = {
        observations: observations.trim() ? observations.trim() : undefined,
        system: { id: systemId },
        indicator: { id: selectedIndicatorId },
      };

      if (relationId != null) {
        await UpdateSystemIndicatorRelationService(relationId, payload);
        toast.success(t('application.map.systemIndicators.messages.updated'));
      } else {
        await SaveSystemIndicatorRelationService(payload);
        toast.success(t('application.map.systemIndicators.messages.created'));
      }

      onSuccess?.();
      onClose();
    } catch {
      toast.error(t('application.map.systemIndicators.messages.saveError'));
    } finally {
      setSaving(false);
    }
  }, [observations, onClose, onSuccess, relationId, selectedIndicatorId, systemId, t]);

  const title = systemLabel
    ? t('application.map.systemIndicators.titleWithSystem', { system: systemLabel })
    : t('application.map.systemIndicators.title');

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor="right"
      PaperProps={{ sx: { width: { xs: 1, sm: 520, md: 680 }, ...sx } }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, py: 2 }}>
        <Stack spacing={0.5}>
          <Typography variant="h6">{title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('application.map.systemIndicators.subtitle')}
          </Typography>
        </Stack>

        <IconButton onClick={onClose} aria-label={t('application.map.systemIndicators.actions.close')}>
          <Iconify icon="solar:close-circle-bold" />
        </IconButton>
      </Stack>

      <Divider />

      <Stack spacing={2.5} sx={{ px: 3, py: 2.5 }}>
        <Typography variant="subtitle2">{t('application.map.systemIndicators.form.title')}</Typography>

        <Autocomplete
          options={indicatorOptions}
          value={selectedIndicatorOption}
          onChange={(_, value) => setSelectedIndicatorId(value?.id ?? null)}
          getOptionLabel={(option) => option.label}
          loading={indicatorsLoading}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('application.map.systemIndicators.form.fields.indicator')}
              placeholder={t('application.map.systemIndicators.form.fields.indicator')}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {indicatorsLoading ? <CircularProgress color="inherit" size={18} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          disabled={saving || relationLoading}
        />

        <TextField
          label={t('application.map.systemIndicators.form.fields.observations')}
          placeholder={t('application.map.systemIndicators.form.fields.observations')}
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
            {isEditing
              ? t('application.map.systemIndicators.actions.update')
              : t('application.map.systemIndicators.actions.create')}
          </Button>
        </Stack>
      </Stack>
    </Drawer>
  );
}

