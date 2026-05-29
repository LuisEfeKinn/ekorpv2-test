'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';

import {
  Box,
  Stack,
  Drawer,
  Button,
  Switch,
  MenuItem,
  TextField,
  Typography,
  Autocomplete,
  CircularProgress,
  FormControlLabel,
} from '@mui/material';

import { useTranslate } from 'src/locales';
import { GetDataTablePaginationService } from 'src/services/architecture/data/dataTable.service';
import { GetActionTypesPaginationService } from 'src/services/architecture/catalogs/actionTypes.service';
import { GetProcessTablePaginationService } from 'src/services/architecture/process/processTable.service';
import { GetJobsByIdService, GetJobsPaginationService } from 'src/services/architecture/business/jobs.service';
import { GetApplicationTablePaginationService } from 'src/services/architecture/applications/applicationTable.service';
import { GetDocumentsListService, GetIndicatorsListService } from 'src/services/architecture/process/processRelations.service';
import { GetInfraestructureTablePaginationService } from 'src/services/architecture/infrastructure/infrastructureTable.service';
import {
  SaveJobProcessRelationService,
  UpdateJobProcessRelationService,
  GetJobProcessRelationByIdService
} from 'src/services/architecture/business/jobProcesses.service';
import {
  SaveNextJobService,
  UpdateNextJobService,
  GetNextJobByIdService,
  SaveJobDataRelationService,
  SaveJobRelationTypeService,
  SaveJobSystemRelationService,
  UpdateJobRelationTypeService,
  UpdateJobDataRelationService,
  GetJobDataRelationByIdService,
  GetJobRelationTypeByIdService,
  SaveJobDocumentRelationService,
  UpdateJobSystemRelationService,
  SaveJobIndicatorRelationService,
  GetJobSystemRelationByIdService,
  UpdateJobDocumentRelationService,
  UpdateJobIndicatorRelationService,
  GetJobDocumentRelationByIdService,
  SaveJobTechnologiesRelationService,
  GetJobIndicatorRelationByIdService,
  UpdateJobTechnologiesRelationService,
  GetJobTechnologiesRelationByIdService
} from 'src/services/architecture/business/jobRelations.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

type RelationKind = 'process' | 'document' | 'system' | 'indicator' | 'data' | 'technology' | 'relation' | 'nextJob';

type Option = { id: number; label: string };

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  jobId: number;
  kind: RelationKind;
  initialData?: any;
  existingItemIds?: number[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function unwrapApiData(value: unknown): unknown {
  if (!isRecord(value)) return value;
  const inner = value.data;
  if (isRecord(inner) && 'data' in inner) return (inner as Record<string, unknown>).data;
  if ('data' in value) return value.data;
  return value;
}

function normalizeList(raw: any): any[] {
  if (Array.isArray(raw)) {
    if (Array.isArray(raw[0])) return raw[0];
    return raw;
  }
  if (raw && typeof raw === 'object') {
    if (Array.isArray(raw.data)) return raw.data;
    if (raw.data && typeof raw.data === 'object') {
      if (Array.isArray((raw.data as any).data)) return (raw.data as any).data;
      if (Array.isArray((raw.data as any).items)) return (raw.data as any).items;
    }
    if (Array.isArray((raw as any).items)) return (raw as any).items;
    if (typeof (raw as any).statusCode === 'number' && (raw as any).data) {
      const inner = (raw as any).data;
      if (Array.isArray(inner)) return inner;
      if (inner && typeof inner === 'object') {
        if (Array.isArray(inner.data)) return inner.data;
        if (Array.isArray(inner.items)) return inner.items;
      }
    }
  }
  return [];
}

export function JobsRelationsDrawer({ open, onClose, onSuccess, jobId, kind, initialData, existingItemIds }: Props) {
  const { t } = useTranslate('business');
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<Option[]>([]);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [observations, setObservations] = useState('');
  const [creationDate, setCreationDate] = useState('');

  const [processDescription, setProcessDescription] = useState('');
  const [isMain, setIsMain] = useState(true);
  const [actionTypeId, setActionTypeId] = useState<number | ''>('');
  const [actionTypeOptions, setActionTypeOptions] = useState<Option[]>([]);

  // New states for relations
  const [relationName, setRelationName] = useState('');
  const [reverseName, setReverseName] = useState('');
  const [selectedJobLabel, setSelectedJobLabel] = useState<string | null>(null);

  const isEdit = Boolean(initialData);
  const excludedIds = useMemo(() => {
    const set = new Set(existingItemIds ?? []);
    if (!isEdit && (kind === 'relation' || kind === 'nextJob')) {
      set.add(jobId);
    }
    return set;
  }, [existingItemIds, isEdit, jobId, kind]);

  const title = useMemo(() => {
    if (kind === 'process') return t('positions.relations.process.title');
    if (kind === 'document') return t('positions.relations.document.title');
    if (kind === 'system') return t('positions.relations.system.title');
    if (kind === 'indicator') return t('positions.relations.indicator.title');
    if (kind === 'data') return t('positions.relations.data.title');
    if (kind === 'technology') return t('positions.relations.technology.title');
    if (kind === 'relation') return initialData ? t('positions.relations.relation.editTitle') : t('positions.relations.relation.title');
    if (kind === 'nextJob') return initialData ? t('positions.relations.nextJob.editTitle') : t('positions.relations.nextJob.title');
    return '';
  }, [kind, t, initialData]);

  const loadOptions = useCallback(async () => {
    try {
      setLoading(true);

      let res;
      if (kind === 'process') {
        res = await GetProcessTablePaginationService({ page: 1, perPage: 1000 });
      } else if (kind === 'document') {
        res = await GetDocumentsListService();
      } else if (kind === 'system') {
        res = await GetApplicationTablePaginationService({ page: 1, perPage: 1000 });
      } else if (kind === 'data') {
        res = await GetDataTablePaginationService({ page: 1, perPage: 1000, search: '' });
      } else if (kind === 'technology') {
        res = await GetInfraestructureTablePaginationService({ page: 1, perPage: 1000 });
      } else if (kind === 'relation' || kind === 'nextJob') {
        res = await GetJobsPaginationService({ page: 1, perPage: 1000 });
      } else {
        res = await GetIndicatorsListService({ page: 1, perPage: 1000 });
      }

      const list = normalizeList(res?.data);

      const mapped: Option[] = list
        .map((it: any) => {
          const id = Number(it?.id);
          if (kind === 'indicator') {
            const name = it?.indicatorName ?? it?.name ?? it?.label;
            const code = it?.indicatorCode ?? it?.code;
            const label = `${String(name ?? `#${id}`)}${code ? ` (${String(code)})` : ''}`;
            return { id, label };
          }

          const name = it?.name ?? it?.label;
          const code = it?.code;
          const label = `${String(name ?? `#${id}`)}${code ? ` (${String(code)})` : ''}`;
          return { id, label };
        })
        .filter((it: Option) => Number.isFinite(it.id));

      const filtered = !isEdit && excludedIds.size > 0 ? mapped.filter((it) => !excludedIds.has(it.id)) : mapped;
      setOptions(filtered);
    } catch {
      setOptions([]);
      toast.error(t('positions.errors.loadData'));
    } finally {
      setLoading(false);
    }
  }, [excludedIds, isEdit, kind, t]);

  const loadActionTypes = useCallback(async () => {
    if (kind !== 'process') return;
    try {
      const res = await GetActionTypesPaginationService({ page: 1, perPage: 1000 });
      const list = normalizeList(res?.data);
      const mapped: Option[] = list
        .map((it: any) => ({
          id: Number(it?.id),
          label: String(it?.name ?? it?.code ?? `#${it?.id}`),
        }))
        .filter((it: Option) => Number.isFinite(it.id));
      setActionTypeOptions(mapped);
    } catch {
      setActionTypeOptions([]);
    }
  }, [kind]);

  useEffect(() => {
    if (!open) return;

    // Reset fields
    setSelectedId(null);
    setObservations('');
    setCreationDate(new Date().toISOString());
    setProcessDescription('');
    setIsMain(true);
    setActionTypeId('');
    setRelationName('');
    setReverseName('');
    setSelectedJobLabel(null);

    const loadInitialData = async () => {
      if (!initialData) return;

      const relationId = initialData.id ?? initialData.relationId;
      if (!relationId) return;

      try {
        let data = initialData;

        // Fetch full data if we suspect we only have partial data (or just ID)
        // or just to be safe and always get fresh data for editing
        if (kind === 'process') {
           const res = await GetJobProcessRelationByIdService(relationId);
           data = unwrapApiData(res.data) ?? data;
        } else if (kind === 'document') {
           const res = await GetJobDocumentRelationByIdService(relationId);
           data = res.data?.data ?? res.data ?? data;
        } else if (kind === 'system') {
           const res = await GetJobSystemRelationByIdService(relationId);
           data = res.data?.data ?? res.data ?? data;
        } else if (kind === 'indicator') {
           const res = await GetJobIndicatorRelationByIdService(relationId);
           data = res.data?.data ?? res.data ?? data;
        } else if (kind === 'data') {
           const res = await GetJobDataRelationByIdService(relationId);
           data = res.data?.data ?? res.data ?? data;
        } else if (kind === 'technology') {
           const res = await GetJobTechnologiesRelationByIdService(relationId);
           data = res.data?.data ?? res.data ?? data;
        } else if (kind === 'relation') {
           const res = await GetJobRelationTypeByIdService(relationId);
           data = res.data?.data ?? res.data ?? data;
        } else if (kind === 'nextJob') {
           const res = await GetNextJobByIdService(relationId);
           data = res.data?.data ?? res.data ?? data;
        }

        if (kind === 'relation') {
          const job1Id = Number(data.job1Id ?? data.job1?.id);
          const job2Id = Number(data.job2Id ?? data.job2?.id);
          const currentJobId = Number(jobId);

          const candidate =
            Number.isFinite(job1Id) && Number.isFinite(job2Id)
              ? (job1Id === currentJobId ? job2Id : job2Id === currentJobId ? job1Id : job2Id)
              : Number.isFinite(job2Id)
                ? job2Id
                : Number.isFinite(job1Id)
                  ? job1Id
                  : null;

          setSelectedId(candidate && candidate > 0 ? candidate : null);
          setRelationName(data.name || '');
          setReverseName(data.reverseName || '');
        } else if (kind === 'nextJob') {
          setSelectedId(data.nextJobId || data.nextJob?.id || data.job2Id || data.job2?.id || null);
        } else if (kind === 'process') {
          setSelectedId(data.process?.id ?? data.processId ?? null);
          setProcessDescription(data.description || '');
          setIsMain(data.isMain ?? true);
          setActionTypeId(data.actionType?.id ?? data.actionTypeId ?? '');
        } else if (kind === 'document') {
          setSelectedId(data.document?.id ?? data.documentId ?? null);
          setObservations(data.observations || '');
        } else if (kind === 'system') {
          setSelectedId(data.system?.id ?? data.systemId ?? null);
          setObservations(data.observations || '');
        } else if (kind === 'indicator') {
          setSelectedId(data.indicator?.id ?? data.indicatorId ?? null);
          setObservations(data.observations || '');
          setCreationDate(data.creationDate || new Date().toISOString());
        } else if (kind === 'data') {
          setSelectedId(data.data?.id ?? data.dataId ?? null);
          setObservations(data.observations || '');
        } else if (kind === 'technology') {
          setSelectedId(data.technology?.id ?? data.technologyId ?? null);
          setObservations(data.observations || '');
        }
      } catch (e) {
        console.error('Error loading relation data:', e);
        toast.error(t('positions.errors.loadData'));
      }
    };

    loadInitialData();
    loadOptions();
    loadActionTypes();
  }, [jobId, open, loadOptions, loadActionTypes, initialData, kind, t]);

  useEffect(() => {
    let active = true;
    if (!open) return () => {};
    if (!isEdit) return () => {};
    if (kind !== 'relation' && kind !== 'nextJob') return () => {};
    if (!selectedId || !Number.isFinite(selectedId)) return () => {};

    const existsInOptions = options.some((o) => o.id === selectedId);
    if (existsInOptions) return () => {};

    const run = async () => {
      try {
        const res = await GetJobsByIdService(String(selectedId));
        if (!active) return;
        const raw = res?.data;
        const data =
          raw && typeof raw === 'object' && 'data' in (raw as { data?: unknown })
            ? (raw as { data?: unknown }).data
            : raw;
        const obj = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
        const name =
          (typeof obj.name === 'string' && obj.name) ||
          (typeof obj.label === 'string' && obj.label) ||
          (typeof obj.title === 'string' && obj.title) ||
          null;
        setSelectedJobLabel(name);
      } catch {
        if (!active) return;
        setSelectedJobLabel(null);
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [isEdit, kind, open, options, selectedId]);

  const handleSubmit = async () => {
    if (!jobId || !selectedId) {
      toast.error(t('positions.relations.common.selectElement'));
      return;
    }

    try {
      setLoading(true);

      const relationId = (initialData as any)?.id ?? (initialData as any)?.relationId;

      if (kind === 'process') {
        const payload: any = {
          isMain,
          description: processDescription?.trim() || undefined,
          job: { id: Number(jobId) },
          process: { id: Number(selectedId) },
        };
        if (actionTypeId) payload.actionType = { id: Number(actionTypeId) };
        if (relationId) {
          await UpdateJobProcessRelationService(relationId, payload);
        } else {
          await SaveJobProcessRelationService(payload);
        }
      }

      if (kind === 'document') {
        const payload = {
          observations: observations?.trim() || undefined,
          job: { id: Number(jobId) },
          document: { id: Number(selectedId) },
        };
        if (relationId) {
          await UpdateJobDocumentRelationService(relationId, payload);
        } else {
          await SaveJobDocumentRelationService(payload);
        }
      }

      if (kind === 'system') {
        const payload = {
          observations: observations?.trim() || undefined,
          job: { id: Number(jobId) },
          system: { id: Number(selectedId) },
        };
        if (relationId) {
          await UpdateJobSystemRelationService(relationId, payload);
        } else {
          await SaveJobSystemRelationService(payload);
        }
      }

      if (kind === 'indicator') {
        const payload = {
          observations: observations?.trim() || undefined,
          creationDate,
          job: { id: Number(jobId) },
          indicator: { id: Number(selectedId) },
        };
        if (relationId) {
          await UpdateJobIndicatorRelationService(relationId, payload);
        } else {
          await SaveJobIndicatorRelationService(payload);
        }
      }

      if (kind === 'data') {
        const payload = {
          observations: observations?.trim() || undefined,
          job: { id: Number(jobId) },
          data: { id: Number(selectedId) },
        };
        if (relationId) {
          await UpdateJobDataRelationService(relationId, payload);
        } else {
          await SaveJobDataRelationService(payload);
        }
      }

      if (kind === 'technology') {
        const payload = {
          observations: observations?.trim() || undefined,
          job: { id: Number(jobId) },
          technology: { id: Number(selectedId) },
        };
        if (relationId) {
          await UpdateJobTechnologiesRelationService(relationId, payload);
        } else {
          await SaveJobTechnologiesRelationService(payload);
        }
      }

      if (kind === 'relation') {
        const payload = {
          name: relationName,
          reverseName,
          job1Id: Number(jobId),
          job2Id: Number(selectedId),
        };

        if (initialData) {
           await UpdateJobRelationTypeService({ ...payload, id: initialData.id });
        } else {
           await SaveJobRelationTypeService(payload);
        }
      }

      if (kind === 'nextJob') {
        const payload = {
          jobId: Number(jobId),
          nextJobId: Number(selectedId),
        };
        
        if (initialData) {
           await UpdateNextJobService({ ...payload, id: initialData.id });
        } else {
           await SaveNextJobService(payload);
        }
      }

      toast.success(t('positions.relations.common.saveSuccess'));
      onSuccess();
      onClose();
    } catch {
      toast.error(t('positions.relations.common.saveError'));
    } finally {
      setLoading(false);
    }
  };

  const selectedOption = useMemo(() => {
    if (selectedId == null) return null;
    return (
      options.find((o) => o.id === selectedId) || {
        id: selectedId,
        label: selectedJobLabel || `#${selectedId}`,
      }
    );
  }, [options, selectedId, selectedJobLabel]);
  const showObservations = kind === 'document' || kind === 'system' || kind === 'indicator' || kind === 'data' || kind === 'technology';

  const selectLabel = useMemo(() => {
    if (kind === 'process') return t('positions.relations.process.select');
    if (kind === 'document') return t('positions.relations.document.select');
    if (kind === 'system') return t('positions.relations.system.select');
    if (kind === 'indicator') return t('positions.relations.indicator.select');
    if (kind === 'data') return t('positions.relations.data.select');
    if (kind === 'technology') return t('positions.relations.technology.select');
    if (kind === 'relation') return t('positions.relations.relation.select');
    if (kind === 'nextJob') return t('positions.relations.nextJob.select');
    return t('positions.relations.common.select');
  }, [kind, t]);

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 460 } }}>
      <Box sx={{ px: 2, py: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {title}
        </Typography>

        <Stack spacing={2} sx={{ pt: 1 }}>
          <Autocomplete
            options={options}
            value={selectedOption}
            loading={loading}
            onChange={(_, v) => setSelectedId(v?.id ?? null)}
            disabled={isEdit}
            getOptionLabel={(opt) => opt.label}
            renderInput={(params) => (
              <TextField
                {...params}
                label={selectLabel}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loading ? <CircularProgress color="inherit" size={18} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          {kind === 'process' && (
            <>
              <FormControlLabel
                control={<Switch checked={isMain} onChange={(_, v) => setIsMain(v)} />}
                label={t('positions.relations.process.isMain')}
              />

              <TextField
                select
                label={t('positions.relations.process.actionType')}
                value={actionTypeId}
                onChange={(e) => setActionTypeId(e.target.value ? Number(e.target.value) : '')}
              >
                <MenuItem value="">{t('positions.relations.common.select')}</MenuItem>
                {actionTypeOptions.map((opt) => (
                  <MenuItem key={opt.id} value={opt.id}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label={t('positions.relations.process.description')}
                value={processDescription}
                onChange={(e) => setProcessDescription(e.target.value)}
                multiline
                minRows={3}
              />
            </>
          )}

          {showObservations && (
            <TextField
              label={t('positions.relations.document.observations')}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              multiline
              minRows={3}
            />
          )}

          {kind === 'indicator' && (
            <TextField
              label={t('positions.relations.indicator.creationDate')}
              value={creationDate}
              disabled
              helperText={t('positions.relations.indicator.creationDateHelper')}
            />
          )}

          {kind === 'relation' && (
            <>
              <TextField
                label={t('positions.relations.relation.name')}
                value={relationName}
                onChange={(e) => setRelationName(e.target.value)}
                required
              />
              <TextField
                label={t('positions.relations.relation.reverseName')}
                value={reverseName}
                onChange={(e) => setReverseName(e.target.value)}
                required
              />
            </>
          )}

          <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
            <Button variant="outlined" onClick={onClose} disabled={loading}>
              {t('positions.relations.common.cancel')}
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
              startIcon={
                loading ? <CircularProgress size={18} color="inherit" /> : <Iconify icon={isEdit ? "solar:pen-bold" : "mingcute:add-line"} />
              }
            >
              {isEdit ? t('positions.relations.common.save', { defaultValue: 'Guardar cambios' }) : t('positions.relations.common.relate')}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Drawer>
  );
}
