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
import { GetDataTablePaginationService } from 'src/services/architecture/data/dataTable.service';
import {
  SaveSystemDataRelationService,
  UpdateSystemDataRelationService,
  GetSystemDataRelationByIdService,
} from 'src/services/architecture/data/systemData.service';

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

export function ApplicationSystemDataDrawer({
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
  const [dataLoading, setDataLoading] = useState(false);
  const [relationLoading, setRelationLoading] = useState(false);

  const [dataOptions, setDataOptions] = useState<Option[]>([]);

  const [selectedDataId, setSelectedDataId] = useState<number | null>(null);
  const [observations, setObservations] = useState('');

  const isEditing = relationId != null;

  const selectedDataOption = useMemo(() => {
    if (selectedDataId == null) return null;
    return dataOptions.find((o) => o.id === selectedDataId) ?? null;
  }, [dataOptions, selectedDataId]);

  const loadDataAssets = useCallback(async () => {
    try {
      setDataLoading(true);
      const res = await GetDataTablePaginationService({ page: 1, perPage: 1000 });
      const list = normalizeList((res as { data?: unknown })?.data);

      const mapped: Option[] = list
        .map((it) => {
          if (!it || typeof it !== 'object') return null;
          const rec = it as Record<string, unknown>;
          const id = Number(rec.id);
          if (!Number.isFinite(id)) return null;
          const label = String(rec.name ?? rec.label ?? `#${id}`);
          return { id, label };
        })
        .filter((o): o is Option => Boolean(o));

      setDataOptions(mapped);
    } catch {
      setDataOptions([]);
      toast.error(t('application.map.systemData.messages.dataLoadError'));
    } finally {
      setDataLoading(false);
    }
  }, [t]);

  const resetForm = useCallback(() => {
    setSelectedDataId(null);
    setObservations('');
  }, []);

  const loadRelationById = useCallback(async () => {
    if (relationId == null) return;
    try {
      setRelationLoading(true);
      const res = await GetSystemDataRelationByIdService(relationId);
      const rec = (res as { data?: unknown })?.data as
        | {
            observations?: unknown;
            system?: { id?: unknown } | null;
            systemId?: unknown;
            data?: { id?: unknown } | null;
            dataId?: unknown;
            data_id?: unknown;
          }
        | undefined;

      const sysId = Number((rec as { systemId?: unknown } | undefined)?.systemId ?? rec?.system?.id);
      const dataId = Number(
        (rec as { dataId?: unknown; data_id?: unknown } | undefined)?.dataId ??
          (rec as { data_id?: unknown } | undefined)?.data_id ??
          rec?.data?.id
      );

      if (!Number.isFinite(dataId) || !Number.isFinite(sysId) || sysId !== systemId) {
        toast.error(t('application.map.systemData.messages.loadError'));
        return;
      }

      setSelectedDataId(dataId);
      setObservations(String(rec?.observations ?? ''));
    } catch {
      toast.error(t('application.map.systemData.messages.loadError'));
    } finally {
      setRelationLoading(false);
    }
  }, [relationId, systemId, t]);

  useEffect(() => {
    if (!open) return () => {};

    resetForm();
    loadDataAssets();
    loadRelationById();
    return () => {};
  }, [loadDataAssets, loadRelationById, open, resetForm]);

  const handleSubmit = useCallback(async () => {
    if (selectedDataId == null) {
      toast.error(t('application.map.systemData.form.validation.dataRequired'));
      return;
    }

    try {
      setSaving(true);

      const payload = {
        observations: observations.trim() ? observations.trim() : undefined,
        system: { id: systemId },
        data: { id: selectedDataId },
      };

      if (relationId != null) {
        await UpdateSystemDataRelationService(relationId, payload);
        toast.success(t('application.map.systemData.messages.updated'));
      } else {
        await SaveSystemDataRelationService(payload);
        toast.success(t('application.map.systemData.messages.created'));
      }

      onSuccess?.();
      onClose();
    } catch {
      toast.error(t('application.map.systemData.messages.saveError'));
    } finally {
      setSaving(false);
    }
  }, [observations, onClose, onSuccess, relationId, selectedDataId, systemId, t]);

  const title = systemLabel
    ? t('application.map.systemData.titleWithSystem', { system: systemLabel })
    : t('application.map.systemData.title');

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
            {t('application.map.systemData.subtitle')}
          </Typography>
        </Stack>

        <IconButton onClick={onClose} aria-label={t('application.map.systemData.actions.close')}>
          <Iconify icon="solar:close-circle-bold" />
        </IconButton>
      </Stack>

      <Divider />

      <Stack spacing={2.5} sx={{ px: 3, py: 2.5 }}>
        <Typography variant="subtitle2">{t('application.map.systemData.form.title')}</Typography>

        <Autocomplete
          options={dataOptions}
          value={selectedDataOption}
          onChange={(_, value) => setSelectedDataId(value?.id ?? null)}
          getOptionLabel={(option) => option.label}
          loading={dataLoading}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('application.map.systemData.form.fields.data')}
              placeholder={t('application.map.systemData.form.fields.data')}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {dataLoading ? <CircularProgress color="inherit" size={18} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          disabled={saving || relationLoading}
        />

        <TextField
          label={t('application.map.systemData.form.fields.observations')}
          placeholder={t('application.map.systemData.form.fields.observations')}
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
            {isEditing ? t('application.map.systemData.actions.update') : t('application.map.systemData.actions.create')}
          </Button>
        </Stack>
      </Stack>
    </Drawer>
  );
}
