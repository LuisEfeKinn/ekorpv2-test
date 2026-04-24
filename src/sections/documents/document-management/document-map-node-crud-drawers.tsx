'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import { GetJobsPaginationService } from 'src/services/architecture/business/jobs.service';
import { GetObjectivesPaginationService } from 'src/services/architecture/business/objectives.service';
import {
  DeleteDocumentObjectiveRelationService,
  GetDocumentObjectiveRelationByIdService,
  SaveDocumentObjectiveRelationService,
  UpdateDocumentObjectiveRelationService,
} from 'src/services/architecture/business/objectiveRelations.service';
import {
  DeleteJobDocumentRelationService,
  GetJobDocumentRelationByIdService,
  SaveJobDocumentRelationService,
  UpdateJobDocumentRelationService,
} from 'src/services/architecture/business/jobRelations.service';
import { GetProcessTablePaginationService } from 'src/services/architecture/process/processTable.service';
import {
  DeleteProcessDocumentService,
  GetProcessDocumentByIdService,
  SaveProcessDocumentService,
  UpdateProcessDocumentService,
  type SaveProcessDocumentPayload,
  type ProcessDocumentRelation,
} from 'src/services/architecture/process/processRelations.service';
import { GetToolsTablePaginationService } from 'src/services/architecture/tools/toolsTable.service';
import {
  DeleteToolDocumentRelationService,
  GetToolDocumentRelationByIdService,
  SaveToolDocumentRelationService,
  UpdateToolDocumentRelationService,
  type ToolDocumentRelation,
} from 'src/services/architecture/tools/toolsRelations.service';
import {
  DeleteOrganizationalUnitDocumentService,
  GetOrganizationalUnitDocumentByIdService,
  GetOrganizationalUnitPaginationService,
  SaveOrganizationalUnitDocumentService,
  UpdateOrganizationalUnitDocumentService,
  normalizeOrganizationalUnitListResponse,
  type OrganizationalUnitDocumentRelation,
} from 'src/services/organization/organizationalUnit.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

export type DocumentMapRelationKind = 'process' | 'job' | 'objective' | 'organizationalUnit' | 'tool';

type DrawerMode = 'create' | 'edit';

type Option = { id: number; label: string };

type TargetInfo = {
  label?: string;
  relationId?: number | null;
  payload?: unknown;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  kind: DocumentMapRelationKind;
  mode: DrawerMode;
  documentId: number;
  target?: TargetInfo | null;
  existingRelatedIds?: number[];
};

type RelationDefaults = {
  relatedId: number | null;
  observations: string;
};

const MAX_VARCHAR_LENGTH = 255;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function coerceId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function normalizeList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    if (raw.length > 0 && Array.isArray(raw[0])) return raw[0];
    return raw;
  }
  if (!isRecord(raw)) return [];
  if (Array.isArray(raw.data)) return raw.data;
  if (isRecord(raw.data)) {
    const inner = raw.data as Record<string, unknown>;
    if (Array.isArray(inner.data)) return inner.data;
    if (Array.isArray(inner.items)) return inner.items;
  }
  if (Array.isArray((raw as { items?: unknown }).items)) return (raw as { items: unknown[] }).items;
  return [];
}

function unwrapRelationPayload(raw: unknown): Record<string, unknown> | null {
  let current: unknown = raw;

  for (let i = 0; i < 4; i += 1) {
    if (!isRecord(current)) break;
    if (!('data' in current)) break;

    const next = (current as { data?: unknown }).data;
    if (!isRecord(next)) break;
    current = next;
  }

  return isRecord(current) ? current : null;
}

function extractDefaults(kind: DocumentMapRelationKind, payload: unknown): RelationDefaults {
  if (!isRecord(payload)) return { relatedId: null, observations: '' };

  const observations = typeof payload.observations === 'string' ? payload.observations : '';

  if (kind === 'process') {
    const id = coerceId(payload.processId) ?? coerceId((payload.process as { id?: unknown } | undefined)?.id);
    return { relatedId: id, observations };
  }

  if (kind === 'job') {
    const id = coerceId(payload.jobId) ?? coerceId((payload.job as { id?: unknown } | undefined)?.id);
    return { relatedId: id, observations };
  }

  if (kind === 'objective') {
    const id = coerceId(payload.objectiveId) ?? coerceId((payload.objective as { id?: unknown } | undefined)?.id);
    return { relatedId: id, observations };
  }

  if (kind === 'organizationalUnit') {
    const id =
      coerceId(payload.organizationalUnitId) ??
      coerceId((payload.organizationalUnit as { id?: unknown } | undefined)?.id);
    return { relatedId: id, observations };
  }

  const id = coerceId(payload.toolId) ?? coerceId((payload.tool as { id?: unknown } | undefined)?.id);
  return { relatedId: id, observations };
}

function labelForOption(obj: unknown): string {
  if (!isRecord(obj)) return '';
  const name =
    (typeof obj.name === 'string' && obj.name) ||
    (typeof obj.label === 'string' && obj.label) ||
    (typeof obj.title === 'string' && obj.title) ||
    (typeof obj.indicatorName === 'string' && obj.indicatorName) ||
    '';
  const code = typeof obj.code === 'string' ? obj.code : '';
  return `${name || ''}${code ? ` (${code})` : ''}`.trim();
}

export function DocumentMapNodeCrudDrawer({
  open,
  onClose,
  onSuccess,
  kind,
  mode,
  documentId,
  target,
  existingRelatedIds,
}: Props) {
  const { t } = useTranslate('documents');
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [options, setOptions] = useState<Option[]>([]);

  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<RelationDefaults>({ relatedId: null, observations: '' });

  const [editingRelationLabel, setEditingRelationLabel] = useState<string>('');

  const relationId = target?.relationId ?? null;
  const targetLabel = target?.label ?? '';

  const drawerTitle = useMemo(() => {
    const base =
      kind === 'process'
        ? t('documentManagement.map.relations.kinds.process')
        : kind === 'job'
          ? t('documentManagement.map.relations.kinds.job')
          : kind === 'objective'
            ? t('documentManagement.map.relations.kinds.objective')
            : kind === 'organizationalUnit'
              ? t('documentManagement.map.relations.kinds.organizationalUnit')
              : t('documentManagement.map.relations.kinds.tool');

    return mode === 'edit'
      ? t('documentManagement.map.relations.titles.edit', { entity: base })
      : t('documentManagement.map.relations.titles.create', { entity: base });
  }, [kind, mode, t]);

  const selectLabel = useMemo(() => {
    if (kind === 'process') return t('documentManagement.map.relations.fields.process');
    if (kind === 'job') return t('documentManagement.map.relations.fields.job');
    if (kind === 'objective') return t('documentManagement.map.relations.fields.objective');
    if (kind === 'organizationalUnit') return t('documentManagement.map.relations.fields.organizationalUnit');
    return t('documentManagement.map.relations.fields.tool');
  }, [kind, t]);

  const mergedOptions = useMemo(() => {
    const selectedId = form.relatedId;
    if (mode !== 'edit' || selectedId == null) return options;

    const exists = options.some((o) => o.id === selectedId);
    if (exists) return options;

    const label = (editingRelationLabel || targetLabel || `#${selectedId}`).trim();
    return [{ id: selectedId, label }, ...options];
  }, [editingRelationLabel, form.relatedId, mode, options, targetLabel]);

  const selectedOption = useMemo(
    () => mergedOptions.find((o) => o.id === form.relatedId) ?? null,
    [form.relatedId, mergedOptions]
  );

  const filteredOptions = useMemo(() => {
    const excluded = new Set<number>(existingRelatedIds ?? []);
    if (mode === 'edit' && form.relatedId != null) excluded.delete(form.relatedId);
    return excluded.size ? mergedOptions.filter((o) => !excluded.has(o.id)) : mergedOptions;
  }, [existingRelatedIds, form.relatedId, mergedOptions, mode]);

  const loadOptions = useCallback(async () => {
    try {
      setOptionsLoading(true);

      if (kind === 'organizationalUnit') {
        const res = await GetOrganizationalUnitPaginationService({ page: 1, perPage: 1000 });
        const list = normalizeOrganizationalUnitListResponse(res?.data);
        const mapped = list
          .map((it) => ({ id: Number(it?.id), label: `${String(it?.name ?? `#${it?.id}`)}` }))
          .filter((it) => Number.isFinite(it.id) && it.id > 0);
        setOptions(mapped);
        return;
      }

      const res =
        kind === 'process'
          ? await GetProcessTablePaginationService({ page: 1, perPage: 1000 })
          : kind === 'job'
            ? await GetJobsPaginationService({ page: 1, perPage: 1000 })
            : kind === 'objective'
              ? await GetObjectivesPaginationService({ page: 1, perPage: 1000 })
              : await GetToolsTablePaginationService({ page: 1, perPage: 1000 });

      const list = normalizeList(res?.data);
      const mapped = list
        .map((it) => ({
          id: Number(isRecord(it) ? it.id : NaN),
          label: labelForOption(it) || `#${String(isRecord(it) ? it.id : '')}`,
        }))
        .filter((it) => Number.isFinite(it.id) && it.id > 0);

      setOptions(mapped);
    } catch {
      setOptions([]);
      toast.error(t('documentManagement.map.relations.messages.loadError'));
    } finally {
      setOptionsLoading(false);
    }
  }, [kind, t]);

  const loadEditRelation = useCallback(async () => {
    if (mode !== 'edit') return;
    if (relationId == null) return;

    try {
      setLoading(true);

      const defaults = extractDefaults(kind, target?.payload);

      if (kind === 'process') {
        const res = await GetProcessDocumentByIdService(relationId);
        const data = unwrapRelationPayload(res?.data) as (ProcessDocumentRelation & Record<string, unknown>) | null;
        const relatedId =
          coerceId(data?.processId) ??
          coerceId((data?.process as { id?: unknown } | undefined)?.id) ??
          defaults.relatedId;
        setForm({
          relatedId,
          observations: typeof data?.observations === 'string' ? data.observations : defaults.observations,
        });
        setEditingRelationLabel(String((data?.process as { name?: unknown } | undefined)?.name ?? targetLabel ?? ''));
        return;
      }

      if (kind === 'job') {
        const res = await GetJobDocumentRelationByIdService(relationId);
        const data = unwrapRelationPayload(res?.data);
        if (!isRecord(data)) return;
        const relatedId = coerceId(data.jobId) ?? coerceId((data.job as { id?: unknown } | undefined)?.id) ?? defaults.relatedId;
        setForm({
          relatedId,
          observations: typeof data.observations === 'string' ? data.observations : defaults.observations,
        });
        setEditingRelationLabel(String((data.job as { name?: unknown } | undefined)?.name ?? targetLabel ?? ''));
        return;
      }

      if (kind === 'objective') {
        const res = await GetDocumentObjectiveRelationByIdService(relationId);
        const data = unwrapRelationPayload(res?.data);
        if (!isRecord(data)) return;
        const relatedId =
          coerceId(data.objectiveId) ?? coerceId((data.objective as { id?: unknown } | undefined)?.id) ?? defaults.relatedId;
        setForm({
          relatedId,
          observations: typeof data.observations === 'string' ? data.observations : defaults.observations,
        });
        setEditingRelationLabel(String((data.objective as { name?: unknown } | undefined)?.name ?? targetLabel ?? ''));
        return;
      }

      if (kind === 'organizationalUnit') {
        const res = await GetOrganizationalUnitDocumentByIdService(relationId);
        const data = unwrapRelationPayload(res?.data) as (OrganizationalUnitDocumentRelation & Record<string, unknown>) | null;
        const relatedId = coerceId(data?.organizationalUnit?.id) ?? defaults.relatedId;
        setForm({
          relatedId,
          observations: typeof data?.observations === 'string' ? data.observations : defaults.observations,
        });
        setEditingRelationLabel(String(data?.organizationalUnit?.name ?? targetLabel ?? ''));
        return;
      }

      const res = await GetToolDocumentRelationByIdService(relationId);
      const data = unwrapRelationPayload(res?.data) as (ToolDocumentRelation & Record<string, unknown>) | null;
      const relatedId = coerceId(data?.toolId) ?? coerceId(data?.tool?.id) ?? defaults.relatedId;
      setForm({
        relatedId,
        observations: typeof data?.observations === 'string' ? data.observations : defaults.observations,
      });
      setEditingRelationLabel(String(data?.tool?.name ?? targetLabel ?? ''));
    } catch {
      setEditingRelationLabel('');
      const defaults = extractDefaults(kind, target?.payload);
      setForm(defaults);
    } finally {
      setLoading(false);
    }
  }, [kind, mode, relationId, target?.payload]);

  useEffect(() => {
    if (!open) return;

    setSubmitted(false);
    setEditingRelationLabel('');

    if (mode === 'edit') {
      setForm(extractDefaults(kind, target?.payload));
    } else {
      setForm({ relatedId: null, observations: '' });
    }

    void loadOptions();
    void loadEditRelation();
  }, [kind, loadEditRelation, loadOptions, mode, open, target?.payload]);

  const observationsValue = form.observations.trim();
  const observationsError = submitted && !observationsValue;
  const canSubmit = form.relatedId != null && Boolean(observationsValue);

  const handleSave = useCallback(async () => {
    setSubmitted(true);

    if (!canSubmit) {
      toast.error(t('documentManagement.map.relations.messages.missingData'));
      return;
    }

    const observations = observationsValue;

    try {
      setLoading(true);

      if (kind === 'process') {
        const payload: SaveProcessDocumentPayload = {
          process: { id: Number(form.relatedId) },
          document: { id: documentId },
          observations,
        };
        if (mode === 'edit' && relationId != null) {
          await UpdateProcessDocumentService(relationId, payload);
        } else {
          await SaveProcessDocumentService(payload);
        }
      } else if (kind === 'job') {
        const payload = {
          observations,
          job: { id: Number(form.relatedId) },
          document: { id: documentId },
        };
        if (mode === 'edit' && relationId != null) {
          await UpdateJobDocumentRelationService(relationId, payload);
        } else {
          await SaveJobDocumentRelationService(payload);
        }
      } else if (kind === 'objective') {
        const payload = {
          observations,
          objective: { id: Number(form.relatedId) },
          document: { id: documentId },
        };
        if (mode === 'edit' && relationId != null) {
          await UpdateDocumentObjectiveRelationService(relationId, payload);
        } else {
          await SaveDocumentObjectiveRelationService(payload);
        }
      } else if (kind === 'organizationalUnit') {
        const payload = {
          observations,
          organizationalUnit: { id: Number(form.relatedId) },
          document: { id: documentId },
        };
        if (mode === 'edit' && relationId != null) {
          await UpdateOrganizationalUnitDocumentService(relationId, payload);
        } else {
          await SaveOrganizationalUnitDocumentService(payload);
        }
      } else {
        const payload = {
          observations,
          tool: { id: Number(form.relatedId) },
          document: { id: documentId },
        };
        if (mode === 'edit' && relationId != null) {
          await UpdateToolDocumentRelationService(relationId, payload);
        } else {
          await SaveToolDocumentRelationService(payload);
        }
      }

      toast.success(
        mode === 'edit'
          ? t('documentManagement.map.relations.messages.updated')
          : t('documentManagement.map.relations.messages.created')
      );
      onSuccess();
      onClose();
    } catch {
      toast.error(t('documentManagement.map.relations.messages.saveError'));
    } finally {
      setLoading(false);
    }
  }, [canSubmit, documentId, form.relatedId, kind, mode, observationsValue, onClose, onSuccess, relationId, t]);

  const handleDelete = useCallback(async () => {
    if (mode !== 'edit' || relationId == null) return;

    try {
      setLoading(true);
      if (kind === 'process') {
        await DeleteProcessDocumentService(relationId);
      } else if (kind === 'job') {
        await DeleteJobDocumentRelationService(relationId);
      } else if (kind === 'objective') {
        await DeleteDocumentObjectiveRelationService(relationId);
      } else if (kind === 'organizationalUnit') {
        await DeleteOrganizationalUnitDocumentService(relationId);
      } else {
        await DeleteToolDocumentRelationService(relationId);
      }
      toast.success(t('documentManagement.map.relations.messages.deleted'));
      onSuccess();
      onClose();
    } catch {
      toast.error(t('documentManagement.map.relations.messages.deleteError'));
    } finally {
      setLoading(false);
    }
  }, [kind, mode, onClose, onSuccess, relationId, t]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor="right"
      PaperProps={{ sx: { width: { xs: 1, sm: 460 } } }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle1" sx={{ lineHeight: 1.2 }}>
            {drawerTitle}
          </Typography>
          {targetLabel ? (
            <Typography variant="caption" color="text.secondary" noWrap>
              {targetLabel}
            </Typography>
          ) : null}
        </Box>
        <IconButton onClick={onClose}>
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </Box>

      <Box sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          {mode === 'edit' && editingRelationLabel ? (
            <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'action.hover' }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {editingRelationLabel}
              </Typography>
            </Box>
          ) : null}

          <Autocomplete
            options={filteredOptions}
            value={selectedOption}
            disabled={mode === 'edit' || loading}
            onChange={(_, next) => setForm((prev) => ({ ...prev, relatedId: next?.id ?? null }))}
            getOptionLabel={(opt) => opt.label}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            loading={optionsLoading}
            renderInput={(params) => (
              <TextField
                {...params}
                label={selectLabel}
                error={submitted && !form.relatedId}
                helperText={submitted && !form.relatedId ? t('documentManagement.map.relations.validation.required') : ''}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {optionsLoading ? <CircularProgress color="inherit" size={18} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          <TextField
            label={t('documentManagement.map.relations.fields.observations')}
            value={form.observations}
            onChange={(e) => setForm((prev) => ({ ...prev, observations: e.target.value }))}
            multiline
            minRows={3}
            error={observationsError}
            inputProps={{ maxLength: MAX_VARCHAR_LENGTH }}
            helperText={
              observationsError
                ? t('documentManagement.map.relations.validation.required')
                : `${form.observations.length}/${MAX_VARCHAR_LENGTH}`
            }
          />

          <Stack direction="row" spacing={1.5} sx={{ pt: 1 }}>
            <Button variant="outlined" color="inherit" onClick={onClose} disabled={loading} fullWidth>
              {t('documentManagement.map.relations.actions.cancel')}
            </Button>
            {mode === 'edit' ? (
              <Button
                variant="outlined"
                color="error"
                onClick={handleDelete}
                disabled={loading || relationId == null}
                fullWidth
              >
                {t('documentManagement.map.relations.actions.delete')}
              </Button>
            ) : null}
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={loading || !canSubmit}
              fullWidth
              startIcon={
                loading ? <CircularProgress size={18} color="inherit" /> : <Iconify icon="solar:pen-bold" />
              }
            >
              {mode === 'edit'
                ? t('documentManagement.map.relations.actions.update')
                : t('documentManagement.map.relations.actions.create')}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Drawer>
  );
}
