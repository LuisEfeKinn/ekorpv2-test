'use client';

import type { SyntheticEvent } from 'react';
import type { AutocompleteRenderInputParams } from '@mui/material/Autocomplete';

import { useMemo, useState, useEffect } from 'react';

import { Box, Stack, Drawer, Button, TextField, Typography, Autocomplete, CircularProgress } from '@mui/material';

import { useTranslate } from 'src/locales';
import { GetJobsListService } from 'src/services/architecture/risk/riskJobs.service';
import { GetJobsPaginationService } from 'src/services/architecture/business/jobs.service';
import { GetActionTypesPaginationService } from 'src/services/architecture/catalogs/actionTypes.service';
import { GetJobProcessesListService, SaveJobProcessRelationService, UpdateJobProcessRelationService, GetJobProcessRelationByIdService } from 'src/services/architecture/business/jobProcesses.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  processId: number | string | null;
  existingItemIds?: number[];
  relationId?: number | null;
  initialData?: any;
  allowDelete?: boolean;
};

type JobOption = { id: number; label: string };
type ActionTypeOption = { id: number; label: string; color?: string };

export function ProcessJobLinkModal({ open, onClose, onSuccess, processId, existingItemIds, relationId, initialData, allowDelete }: Props) {
  const { t } = useTranslate('architecture');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [actionTypes, setActionTypes] = useState<any[]>([]);
  const [existingJobIdsFromApi, setExistingJobIdsFromApi] = useState<number[]>([]);
  const [form, setForm] = useState({
    jobId: null as null | number,
    isMain: null as null | boolean,
    description: '',
    actionTypeId: null as null | number
  });

  const isEdit = Boolean(relationId);

  useEffect(() => {
    if (!open) return undefined;

    let active = true;

    const unwrapApiData = (value: unknown): unknown => {
      if (!value || typeof value !== 'object') return value;
      const obj = value as Record<string, unknown>;
      if ('data' in obj) {
        const inner = obj.data;
        if (inner && typeof inner === 'object' && 'data' in (inner as Record<string, unknown>)) {
          return (inner as Record<string, unknown>).data;
        }
        return inner;
      }
      return value;
    };

    const getFiniteNumber = (value: unknown): number | null => {
      const parsed = typeof value === 'number' ? value : Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const load = async (currentSelectedId: number | null) => {
      try {
        const excludedIds = new Set<number>();
        (Array.isArray(existingItemIds) ? existingItemIds : []).forEach((id) => {
          const n = getFiniteNumber(id);
          if (n != null) excludedIds.add(n);
        });

        if (processId != null) {
          try {
            const relRes = await GetJobProcessesListService({ page: 1, perPage: 5000 });
            const raw = unwrapApiData(relRes.data);
            const list = Array.isArray(raw)
              ? raw.length > 0 && Array.isArray(raw[0])
                ? (raw[0] as any[])
                : raw
              : raw && typeof raw === 'object'
                ? Array.isArray((raw as any).items)
                  ? ((raw as any).items as any[])
                  : Array.isArray((raw as any).data)
                    ? ((raw as any).data as any[])
                    : (raw as any).data && typeof (raw as any).data === 'object' && Array.isArray((raw as any).data.data)
                      ? ((raw as any).data.data as any[])
                      : (raw as any).data && typeof (raw as any).data === 'object' && Array.isArray((raw as any).data.items)
                        ? ((raw as any).data.items as any[])
                        : []
                : [];

            const pid = getFiniteNumber(processId);
            const jobIds = new Set<number>();
            list.forEach((it: any) => {
              const relProcessId = getFiniteNumber(it?.process?.id ?? it?.processId ?? it?.process_id);
              if (pid == null || relProcessId == null || relProcessId !== pid) return;
              const jobId = getFiniteNumber(it?.job?.id ?? it?.jobId ?? it?.job_id);
              if (jobId != null) jobIds.add(jobId);
            });

            if (active) setExistingJobIdsFromApi(Array.from(jobIds));
            jobIds.forEach((id) => excludedIds.add(id));
          } catch (e) {
            console.error('Error loading job-processes list:', e);
            if (active) setExistingJobIdsFromApi([]);
          }
        } else if (active) {
          setExistingJobIdsFromApi([]);
        }

        if (currentSelectedId != null) excludedIds.delete(Number(currentSelectedId));

        const actionTypesRes = await GetActionTypesPaginationService({ perPage: 1000 });

        // Process Jobs
        const jobsRes = await GetJobsPaginationService({ page: 1, perPage: 1000 });
        const rawJobs = jobsRes?.data;
        let jobsList: any[] = [];
        if (Array.isArray(rawJobs)) {
          jobsList = rawJobs;
        } else if (Array.isArray((rawJobs as any)?.data?.data)) {
          jobsList = (rawJobs as any).data.data;
        } else if (Array.isArray((rawJobs as any)?.data)) {
          jobsList = (rawJobs as any).data;
        } else if (Array.isArray((rawJobs as any)?.[0])) {
          jobsList = (rawJobs as any)[0];
        }

        if (jobsList.length === 0) {
          const fallbackRes = await GetJobsListService();
          const rawFallback = fallbackRes?.data;
          if (Array.isArray(rawFallback)) {
            jobsList = rawFallback;
          } else if (Array.isArray((rawFallback as any)?.data)) {
            jobsList = (rawFallback as any).data;
          } else if (Array.isArray((rawFallback as any)?.data?.data)) {
            jobsList = (rawFallback as any).data.data;
          }
        }

        const normalizedJobs = Array.isArray(jobsList) ? jobsList : [];
        const filteredJobs = excludedIds.size
          ? normalizedJobs.filter((it: any) => !excludedIds.has(Number(it?.id)))
          : normalizedJobs;
        if (!active) return;
        setJobs(filteredJobs);

        // Process Action Types
        const rawActions = actionTypesRes?.data;
        let actionsList: any[] = [];

        if (Array.isArray(rawActions)) {
          // Handle [data, count] format
          if (rawActions.length >= 1 && Array.isArray(rawActions[0])) {
            actionsList = rawActions[0];
          } else {
            actionsList = rawActions;
          }
        } else if (Array.isArray(rawActions?.data)) {
          actionsList = rawActions.data;
        } else if (Array.isArray(rawActions?.data?.data)) {
          actionsList = rawActions.data.data;
        }
        
        setActionTypes(Array.isArray(actionsList) ? actionsList : []);

      } catch (e) {
        console.error('Error loading data:', e);
        toast.error(t('process.map.modals.common.loadError'));
      }
    };

    const prime = async () => {
      setSubmitted(false);
      const initialJobId = getFiniteNumber(initialData?.job?.id ?? initialData?.jobId ?? initialData?.job_id);
      const initialActionTypeId = getFiniteNumber(initialData?.actionType?.id ?? initialData?.actionTypeId);
      const initialIsMain =
        typeof initialData?.isMain === 'boolean'
          ? initialData.isMain
          : typeof initialData?.main === 'boolean'
            ? initialData.main
            : null;
      const initialDescription = String(initialData?.description ?? initialData?.observations ?? '');

      if (relationId) {
        try {
          setLoading(true);
          const res = await GetJobProcessRelationByIdService(relationId);
          if (!active) return;

          const data = unwrapApiData(res.data) as Record<string, unknown> | undefined;
          const jobId = getFiniteNumber((data as any)?.job?.id ?? (data as any)?.jobId ?? (data as any)?.job_id);
          const actionTypeId = getFiniteNumber((data as any)?.actionType?.id ?? (data as any)?.actionTypeId);
          const isMain =
            typeof (data as any)?.isMain === 'boolean'
              ? Boolean((data as any).isMain)
              : typeof (data as any)?.main === 'boolean'
                ? Boolean((data as any).main)
                : null;
          const description = typeof (data as any)?.description === 'string' ? String((data as any).description) : '';

          setForm({
            jobId,
            actionTypeId,
            isMain,
            description,
          });
          await load(jobId);
        } catch (e) {
          console.error('Error loading job-process relation:', e);
          toast.error(t('process.map.modals.common.loadError'));
          setForm({
            jobId: initialJobId,
            actionTypeId: initialActionTypeId,
            isMain: initialIsMain,
            description: initialDescription,
          });
          await load(initialJobId);
        } finally {
          if (active) setLoading(false);
        }
        return;
      }

      setForm({
        jobId: initialJobId,
        actionTypeId: initialActionTypeId,
        isMain: initialIsMain,
        description: initialDescription,
      });
      await load(initialJobId);
    };

    prime();

    return () => {
      active = false;
    };
  }, [open, relationId, initialData, existingItemIds, processId, t]);

  const jobOptions: JobOption[] = useMemo(
    () =>
      jobs
        .map((j: any) => {
          const id = Number(j?.id);
          const name = j?.name ?? j?.label;
          const code = j?.code;
          const label = `${String(name ?? `#${id}`)}${code ? ` (${String(code)})` : ''}`;
          return { id, label };
        })
        .filter((opt: JobOption) => Number.isFinite(opt.id))
        .filter((opt) => (isEdit ? true : !existingJobIdsFromApi.includes(opt.id) || opt.id === form.jobId)),
    [existingJobIdsFromApi, form.jobId, isEdit, jobs]
  );
  
  const actionTypeOptions: ActionTypeOption[] = useMemo(
    () =>
      actionTypes
        .map((a: any) => ({
          label: String(a?.name ?? `#${a?.id}`),
          id: Number(a?.id),
          color: typeof a?.color === 'string' ? a.color : undefined,
        }))
        .filter((opt: ActionTypeOption) => Number.isFinite(opt.id)),
    [actionTypes]
  );

  const handleSubmit = async () => {
    setSubmitted(true);
    if (!processId || !form.jobId || !form.actionTypeId || form.isMain == null) {
      toast.error(t('process.map.modals.common.missingData'));
      return;
    }

    if (!isEdit && existingJobIdsFromApi.includes(Number(form.jobId))) {
      toast.error(
        t('process.map.modals.job.alreadyLinked', {
          defaultValue: 'Este puesto ya está relacionado con este proceso.',
        })
      );
      return;
    }
    const payload = {
      isMain: Boolean(form.isMain),
      description: form.description || '',
      job: { id: Number(form.jobId) },
      process: { id: Number(processId) },
      actionType: { id: Number(form.actionTypeId) }
    };
    try {
      setLoading(true);
      if (relationId) {
        await UpdateJobProcessRelationService(relationId, payload);
      } else {
        await SaveJobProcessRelationService(payload);
      }
      toast.success(t('process.map.modals.common.save'));
      onSuccess();
      onClose();
    } catch (e) {
      console.error(e);
      toast.error(t('process.map.modals.common.saveError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 420 } }}>
      <Box sx={{ px: 2, py: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {t('process.map.modals.job.title')}
        </Typography>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Autocomplete
            options={jobOptions}
            value={jobOptions.find((o) => o.id === form.jobId) || null}
            onChange={(_event: SyntheticEvent, v: JobOption | null) => {
              if (isEdit) return;
              setForm((f) => ({ ...f, jobId: v?.id ?? null }));
            }}
            isOptionEqualToValue={(opt, val) => Number(opt.id) === Number(val.id)}
            disabled={isEdit}
            disableClearable={isEdit}
            renderInput={(params: AutocompleteRenderInputParams) => (
              <TextField
                {...params}
                label={t('process.map.modals.job.fieldLabel')}
                error={submitted && !form.jobId}
                helperText={submitted && !form.jobId ? t('process.map.modals.common.missingData') : ''}
              />
            )}
          />
          
          <Autocomplete
            options={actionTypeOptions}
            value={actionTypeOptions.find((o) => o.id === form.actionTypeId) || null}
            onChange={(_event: SyntheticEvent, v: ActionTypeOption | null) => setForm((f) => ({ ...f, actionTypeId: v?.id ?? null }))}
            renderInput={(params: AutocompleteRenderInputParams) => (
              <TextField
                {...params}
                label={t('process.map.modals.common.actionType')}
                error={submitted && !form.actionTypeId}
                helperText={submitted && !form.actionTypeId ? t('process.map.modals.common.missingData') : ''}
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Box sx={{ 
                  width: 14, 
                  height: 14, 
                  borderRadius: '50%', 
                  bgcolor: option.color || 'grey.500', 
                  mr: 1 
                }} />
                {option.label}
              </Box>
            )}
          />

          <TextField 
            label={t('process.map.modals.common.description')} 
            value={form.description} 
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            multiline
            rows={3}
          />
          
          <Autocomplete
            options={[
              { id: 1, label: t('process.map.modals.common.mainProcess') }, 
              { id: 0, label: t('process.map.modals.common.secondaryProcess') }
            ]}
            value={
              form.isMain == null
                ? null
                : form.isMain
                  ? { id: 1, label: t('process.map.modals.common.mainProcess') }
                  : { id: 0, label: t('process.map.modals.common.secondaryProcess') }
            }
            onChange={(_event: SyntheticEvent, v: { id: number; label: string } | null) =>
              setForm((f) => ({ ...f, isMain: v == null ? null : v.id === 1 }))
            }
            renderInput={(params: AutocompleteRenderInputParams) => (
              <TextField
                {...params}
                label={t('process.map.modals.common.relationType')}
                error={submitted && form.isMain == null}
                helperText={submitted && form.isMain == null ? t('process.map.modals.common.missingData') : ''}
              />
            )}
          />

          <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
            <Button variant="outlined" onClick={onClose}>
              {t('process.map.modals.common.cancel')}
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Iconify icon="mingcute:add-line" />}
            >
              {t('process.map.modals.common.link')}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Drawer>
  );
}
