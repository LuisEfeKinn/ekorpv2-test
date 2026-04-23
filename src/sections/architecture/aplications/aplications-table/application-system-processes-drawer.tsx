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
import { GetProcessTablePaginationService } from 'src/services/architecture/process/processTable.service';
import {
  SaveSystemProcessService,
  UpdateSystemProcessService,
  GetSystemProcessRelationByIdService,
} from 'src/services/architecture/process/processRelations.service';

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

export function ApplicationSystemProcessesDrawer({
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
  const [processesLoading, setProcessesLoading] = useState(false);
  const [relationLoading, setRelationLoading] = useState(false);

  const [processOptions, setProcessOptions] = useState<Option[]>([]);

  const [selectedProcessId, setSelectedProcessId] = useState<number | null>(null);
  const [observations, setObservations] = useState('');

  const isEditing = relationId != null;

  const selectedProcessOption = useMemo(() => {
    if (selectedProcessId == null) return null;
    return processOptions.find((o) => o.id === selectedProcessId) ?? null;
  }, [processOptions, selectedProcessId]);

  const loadProcesses = useCallback(async () => {
    try {
      setProcessesLoading(true);
      const res = await GetProcessTablePaginationService({ page: 1, perPage: 1000 });
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

      setProcessOptions(mapped);
    } catch {
      setProcessOptions([]);
      toast.error(t('application.map.systemProcesses.messages.processesLoadError'));
    } finally {
      setProcessesLoading(false);
    }
  }, [t]);

  const resetForm = useCallback(() => {
    setSelectedProcessId(null);
    setObservations('');
  }, []);

  const loadRelationById = useCallback(async () => {
    if (relationId == null) return;
    try {
      setRelationLoading(true);
      const res = await GetSystemProcessRelationByIdService(relationId);
      const rec = (res as { data?: unknown })?.data as
        | { id?: unknown; observations?: unknown; process?: { id?: unknown }; system?: { id?: unknown } }
        | undefined;

      const processId = Number(rec?.process?.id);
      const sysId = Number(rec?.system?.id);

      if (!Number.isFinite(processId) || !Number.isFinite(sysId) || sysId !== systemId) {
        toast.error(t('application.map.systemProcesses.messages.loadError'));
        return;
      }

      setSelectedProcessId(processId);
      setObservations(String(rec?.observations ?? ''));
    } catch {
      toast.error(t('application.map.systemProcesses.messages.loadError'));
    } finally {
      setRelationLoading(false);
    }
  }, [relationId, systemId, t]);

  useEffect(() => {
    if (!open) return () => {};

    resetForm();
    loadProcesses();
    loadRelationById();
    return () => {};
  }, [loadProcesses, loadRelationById, open, resetForm]);

  const handleSubmit = useCallback(async () => {
    if (selectedProcessId == null) {
      toast.error(t('application.map.systemProcesses.form.validation.processRequired'));
      return;
    }

    try {
      setSaving(true);

      const payload = {
        observations: observations.trim() ? observations.trim() : undefined,
        system: { id: systemId },
        process: { id: selectedProcessId },
      };

      if (relationId != null) {
        await UpdateSystemProcessService(relationId, payload);
        toast.success(t('application.map.systemProcesses.messages.updated'));
      } else {
        await SaveSystemProcessService(payload);
        toast.success(t('application.map.systemProcesses.messages.created'));
      }

      onSuccess?.();
      onClose();
    } catch {
      toast.error(t('application.map.systemProcesses.messages.saveError'));
    } finally {
      setSaving(false);
    }
  }, [observations, onClose, onSuccess, relationId, selectedProcessId, systemId, t]);

  const title = systemLabel
    ? t('application.map.systemProcesses.titleWithSystem', { system: systemLabel })
    : t('application.map.systemProcesses.title');

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
            {t('application.map.systemProcesses.subtitle')}
          </Typography>
        </Stack>

        <IconButton onClick={onClose} aria-label={t('application.map.systemProcesses.actions.close')}>
          <Iconify icon="solar:close-circle-bold" />
        </IconButton>
      </Stack>

      <Divider />

      <Stack spacing={2.5} sx={{ px: 3, py: 2.5 }}>
        <Typography variant="subtitle2">{t('application.map.systemProcesses.form.title')}</Typography>

        <Autocomplete
          options={processOptions}
          value={selectedProcessOption}
          onChange={(_, value) => setSelectedProcessId(value?.id ?? null)}
          getOptionLabel={(option) => option.label}
          loading={processesLoading}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('application.map.systemProcesses.form.fields.process')}
              placeholder={t('application.map.systemProcesses.form.fields.process')}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {processesLoading ? <CircularProgress color="inherit" size={18} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          disabled={saving || relationLoading}
        />

        <TextField
          label={t('application.map.systemProcesses.form.fields.observations')}
          placeholder={t('application.map.systemProcesses.form.fields.observations')}
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
            {isEditing ? t('application.map.systemProcesses.actions.update') : t('application.map.systemProcesses.actions.create')}
          </Button>
        </Stack>
      </Stack>
    </Drawer>
  );
}
