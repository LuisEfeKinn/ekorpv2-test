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
import { GetUserManagmentPaginationService } from 'src/services/employees/user-managment.service';
import { GetToolsTablePaginationService } from 'src/services/architecture/tools/toolsTable.service';
import { GetObjectivesPaginationService } from 'src/services/architecture/business/objectives.service';
import { GetProcessTablePaginationService } from 'src/services/architecture/process/processTable.service';
import {
  SaveJobDocumentRelationService,
  DeleteJobDocumentRelationService,
  UpdateJobDocumentRelationService,
  GetJobDocumentRelationByIdService,
} from 'src/services/architecture/business/jobRelations.service';
import {
  SaveDocumentObjectiveRelationService,
  DeleteDocumentObjectiveRelationService,
  UpdateDocumentObjectiveRelationService,
  GetDocumentObjectiveRelationByIdService,
} from 'src/services/architecture/business/objectiveRelations.service';
import {
  type ToolDocumentRelation,
  SaveToolDocumentRelationService,
  DeleteToolDocumentRelationService,
  UpdateToolDocumentRelationService,
  GetToolDocumentRelationByIdService,
} from 'src/services/architecture/tools/toolsRelations.service';
import {
  SaveProcessDocumentService,
  DeleteProcessDocumentService,
  UpdateProcessDocumentService,
  type ProcessDocumentRelation,
  GetProcessDocumentByIdService,
  type SaveProcessDocumentPayload,
} from 'src/services/architecture/process/processRelations.service';
import {
  SaveOrganizationalUnitDocumentService,
  GetOrganizationalUnitPaginationService,
  DeleteOrganizationalUnitDocumentService,
  UpdateOrganizationalUnitDocumentService,
  normalizeOrganizationalUnitListResponse,
  type OrganizationalUnitDocumentRelation,
  GetOrganizationalUnitDocumentByIdService,
} from 'src/services/organization/organizationalUnit.service';
import {
  GetTopicsService,
  GetCompetenciesService,
  GetEvaluationClarityService,
  SaveDocumentExamRelationService,
  SaveDocumentUserRelationService,
  SaveDocumentTopicRelationService,
  type DocumentExamRelationPayload,
  type DocumentUserRelationPayload,
  DeleteDocumentExamRelationService,
  DeleteDocumentUserRelationService,
  UpdateDocumentExamRelationService,
  UpdateDocumentUserRelationService,
  type DocumentTopicRelationPayload,
  DeleteDocumentTopicRelationService,
  GetDocumentExamRelationByIdService,
  GetDocumentUserRelationByIdService,
  UpdateDocumentTopicRelationService,
  GetDocumentTopicRelationByIdService,
  SaveDocumentCompetencyRelationService,
  type DocumentCompetencyRelationPayload,
  DeleteDocumentCompetencyRelationService,
  UpdateDocumentCompetencyRelationService,
  GetDocumentCompetencyRelationByIdService,
} from 'src/services/documents/documents.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

export type DocumentMapRelationKind =
  | 'process'
  | 'job'
  | 'objective'
  | 'organizationalUnit'
  | 'tool'
  | 'topic'
  | 'subscriber'
  | 'competency'
  | 'exam';

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

  if (kind === 'topic') {
    const id = coerceId(payload.topicId) ?? coerceId((payload.topic as { id?: unknown } | undefined)?.id);
    return { relatedId: id, observations: '' };
  }

  if (kind === 'subscriber') {
    const id = coerceId(payload.userId) ?? coerceId((payload.user as { id?: unknown } | undefined)?.id);
    return { relatedId: id, observations };
  }

  if (kind === 'competency') {
    const id = coerceId(payload.competencyId) ?? coerceId((payload.competency as { id?: unknown } | undefined)?.id);
    return { relatedId: id, observations: '' };
  }

  if (kind === 'exam') {
    const evaluation = payload.evaluation as { evaluationId?: unknown } | undefined;
    const id = coerceId(payload.evaluationId) ?? coerceId(evaluation?.evaluationId);
    return { relatedId: id, observations: '' };
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

  const requiresObservations = useMemo(() => {
    if (kind === 'topic') return false;
    if (kind === 'competency') return false;
    if (kind === 'exam') return false;
    return true;
  }, [kind]);

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
              : kind === 'tool'
                ? t('documentManagement.map.relations.kinds.tool')
                : kind === 'topic'
                  ? t('documentManagement.map.relations.kinds.topic')
                  : kind === 'subscriber'
                    ? t('documentManagement.map.relations.kinds.subscriber')
                    : kind === 'competency'
                      ? t('documentManagement.map.relations.kinds.competency')
                      : t('documentManagement.map.relations.kinds.exam');

    return mode === 'edit'
      ? t('documentManagement.map.relations.titles.edit', { entity: base })
      : t('documentManagement.map.relations.titles.create', { entity: base });
  }, [kind, mode, t]);

  const selectLabel = useMemo(() => {
    if (kind === 'process') return t('documentManagement.map.relations.fields.process');
    if (kind === 'job') return t('documentManagement.map.relations.fields.job');
    if (kind === 'objective') return t('documentManagement.map.relations.fields.objective');
    if (kind === 'organizationalUnit') return t('documentManagement.map.relations.fields.organizationalUnit');
    if (kind === 'tool') return t('documentManagement.map.relations.fields.tool');
    if (kind === 'topic') return t('documentManagement.map.relations.fields.topic');
    if (kind === 'subscriber') return t('documentManagement.map.relations.fields.subscriber');
    if (kind === 'competency') return t('documentManagement.map.relations.fields.competency');
    return t('documentManagement.map.relations.fields.exam');
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

      if (kind === 'subscriber') {
        const res = await GetUserManagmentPaginationService({ search: undefined, perPage: 20 });
        const list = normalizeList(res?.data);
        const mapped = list
          .map((it) => {
            if (!isRecord(it)) return null;
            const id = coerceId(it.userId) ?? coerceId(it.id);
            if (id == null || id <= 0) return null;
            const fullName = typeof it.fullName === 'string' ? it.fullName : '';
            const firstName = typeof it.firstName === 'string' ? it.firstName : '';
            const secondName = typeof it.secondName === 'string' ? it.secondName : '';
            const firstLastName = typeof it.firstLastName === 'string' ? it.firstLastName : '';
            const secondLastName = typeof it.secondLastName === 'string' ? it.secondLastName : '';
            const fallbackName = [firstName, secondName, firstLastName, secondLastName].filter(Boolean).join(' ').trim();
            const label = (fullName || fallbackName || `#${String(id)}`).trim();
            return { id, label };
          })
          .filter((x): x is Option => Boolean(x));
        setOptions(mapped);
        return;
      }

      if (kind === 'topic') {
        const res = await GetTopicsService();
        const list = normalizeList(res?.data);
        const mapped = list
          .map((it) => ({
            id: Number(isRecord(it) ? it.id : NaN),
            label: String(isRecord(it) ? it.name ?? '' : '').trim(),
          }))
          .filter((it) => Number.isFinite(it.id) && it.id > 0 && Boolean(it.label));
        setOptions(mapped);
        return;
      }

      if (kind === 'competency') {
        const res = await GetCompetenciesService();
        const list = normalizeList(res?.data);
        const mapped = list
          .map((it) => ({
            id: Number(isRecord(it) ? it.id : NaN),
            label: labelForOption(it) || `#${String(isRecord(it) ? it.id : '')}`,
          }))
          .filter((it) => Number.isFinite(it.id) && it.id > 0);
        setOptions(mapped);
        return;
      }

      if (kind === 'exam') {
        const res = await GetEvaluationClarityService();
        const list = normalizeList(res?.data);
        const mapped = list
          .map((it) => {
            if (!isRecord(it)) return null;
            const evaluationId = Number(it.evaluationId);
            if (!Number.isFinite(evaluationId) || evaluationId <= 0) return null;
            const date = typeof it.date === 'string' ? it.date.slice(0, 10) : '';
            const result = typeof it.result === 'number' && Number.isFinite(it.result) ? String(it.result) : '';
            const label = [`#${evaluationId}`, date, result].filter(Boolean).join(' - ');
            return { id: evaluationId, label };
          })
          .filter((x): x is Option => Boolean(x));
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

      if (kind === 'tool') {
        const res = await GetToolDocumentRelationByIdService(relationId);
        const data = unwrapRelationPayload(res?.data) as (ToolDocumentRelation & Record<string, unknown>) | null;
        const relatedId = coerceId(data?.toolId) ?? coerceId(data?.tool?.id) ?? defaults.relatedId;
        setForm({
          relatedId,
          observations: typeof data?.observations === 'string' ? data.observations : defaults.observations,
        });
        setEditingRelationLabel(String(data?.tool?.name ?? targetLabel ?? ''));
        return;
      }

      if (kind === 'topic') {
        const res = await GetDocumentTopicRelationByIdService(relationId);
        const data = unwrapRelationPayload(res?.data);
        if (!isRecord(data)) return;
        const relatedId = coerceId(data.topicId) ?? coerceId((data.topic as { id?: unknown } | undefined)?.id) ?? defaults.relatedId;
        setForm({ relatedId, observations: '' });
        setEditingRelationLabel(String((data.topic as { name?: unknown } | undefined)?.name ?? targetLabel ?? ''));
        return;
      }

      if (kind === 'subscriber') {
        const res = await GetDocumentUserRelationByIdService(relationId);
        const data = unwrapRelationPayload(res?.data);
        if (!isRecord(data)) return;
        const relatedId = coerceId(data.userId) ?? coerceId((data.user as { id?: unknown } | undefined)?.id) ?? defaults.relatedId;
        const obs = typeof data.observations === 'string' ? data.observations : defaults.observations;
        setForm({ relatedId, observations: obs });
        setEditingRelationLabel(String((data.user as { fullName?: unknown; email?: unknown } | undefined)?.fullName ?? targetLabel ?? ''));
        return;
      }

      if (kind === 'competency') {
        const res = await GetDocumentCompetencyRelationByIdService(relationId);
        const data = unwrapRelationPayload(res?.data);
        if (!isRecord(data)) return;
        const relatedId =
          coerceId(data.competencyId) ?? coerceId((data.competency as { id?: unknown } | undefined)?.id) ?? defaults.relatedId;
        setForm({ relatedId, observations: '' });
        setEditingRelationLabel(String((data.competency as { name?: unknown } | undefined)?.name ?? targetLabel ?? ''));
        return;
      }

      const res = await GetDocumentExamRelationByIdService(relationId);
      const data = unwrapRelationPayload(res?.data);
      if (!isRecord(data)) return;
      const evaluation = data.evaluation as { evaluationId?: unknown } | undefined;
      const relatedId = coerceId(data.evaluationId) ?? coerceId(evaluation?.evaluationId) ?? defaults.relatedId;
      setForm({ relatedId, observations: '' });
      setEditingRelationLabel(String(relatedId != null ? `#${relatedId}` : targetLabel ?? ''));
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
  const observationsError = requiresObservations && submitted && !observationsValue;
  const canSubmit = form.relatedId != null && (!requiresObservations || Boolean(observationsValue));

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
      } else if (kind === 'tool') {
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
      } else if (kind === 'topic') {
        const payload: DocumentTopicRelationPayload = {
          document: { id: documentId },
          topic: { id: Number(form.relatedId) },
        };
        if (mode === 'edit' && relationId != null) {
          await UpdateDocumentTopicRelationService(relationId, payload);
        } else {
          await SaveDocumentTopicRelationService(payload);
        }
      } else if (kind === 'subscriber') {
        const payload: DocumentUserRelationPayload = {
          observations,
          document: { id: documentId },
          user: { id: Number(form.relatedId) },
        };
        if (mode === 'edit' && relationId != null) {
          await UpdateDocumentUserRelationService(relationId, payload);
        } else {
          await SaveDocumentUserRelationService(payload);
        }
      } else if (kind === 'competency') {
        const payload: DocumentCompetencyRelationPayload = {
          document: { id: documentId },
          competency: { id: Number(form.relatedId) },
        };
        if (mode === 'edit' && relationId != null) {
          await UpdateDocumentCompetencyRelationService(relationId, payload);
        } else {
          await SaveDocumentCompetencyRelationService(payload);
        }
      } else {
        const payload: DocumentExamRelationPayload = {
          document: { id: documentId },
          evaluation: { evaluationId: Number(form.relatedId) },
        };
        if (mode === 'edit' && relationId != null) {
          await UpdateDocumentExamRelationService(relationId, payload);
        } else {
          await SaveDocumentExamRelationService(payload);
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
      } else if (kind === 'tool') {
        await DeleteToolDocumentRelationService(relationId);
      } else if (kind === 'topic') {
        await DeleteDocumentTopicRelationService(relationId);
      } else if (kind === 'subscriber') {
        await DeleteDocumentUserRelationService(relationId);
      } else if (kind === 'competency') {
        await DeleteDocumentCompetencyRelationService(relationId);
      } else {
        await DeleteDocumentExamRelationService(relationId);
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

          {requiresObservations ? (
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
          ) : null}

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
