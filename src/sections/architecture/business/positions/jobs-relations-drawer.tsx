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
import { GetApplicationTablePaginationService } from 'src/services/architecture/applications/applicationTable.service';
import { GetDocumentsListService, GetIndicatorsListService } from 'src/services/architecture/process/processRelations.service';
import { GetInfraestructureTablePaginationService } from 'src/services/architecture/infrastructure/infrastructureTable.service';
import {
  SaveJobDataRelationService,
  SaveJobSystemRelationService,
  SaveJobProcessRelationService,
  SaveJobDocumentRelationService,
  SaveJobIndicatorRelationService,
  SaveJobTechnologiesRelationService,
} from 'src/services/architecture/business/jobRelations.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

type RelationKind = 'process' | 'document' | 'system' | 'indicator' | 'data' | 'technology';

type Option = { id: number; label: string };

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  jobId: number;
  kind: RelationKind;
};

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

export function JobsRelationsDrawer({ open, onClose, onSuccess, jobId, kind }: Props) {
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

  const title = useMemo(() => {
    if (kind === 'process') return t('positions.relations.process.title');
    if (kind === 'document') return t('positions.relations.document.title');
    if (kind === 'system') return t('positions.relations.system.title');
    if (kind === 'indicator') return t('positions.relations.indicator.title');
    if (kind === 'data') return t('positions.relations.data.title');
    if (kind === 'technology') return t('positions.relations.technology.title');
    return '';
  }, [kind, t]);

  const loadOptions = useCallback(async () => {
    try {
      setLoading(true);

      let res;
      if (kind === 'process') {
        res = await GetProcessTablePaginationService({ page: 1, perPage: 1000 });
      } else if (kind === 'document') {
        res = await GetDocumentsListService({ page: 1, perPage: 1000 });
      } else if (kind === 'system') {
        res = await GetApplicationTablePaginationService({ page: 1, perPage: 1000 });
      } else if (kind === 'data') {
        res = await GetDataTablePaginationService({ page: 1, limit: 20, search: '' });
      } else if (kind === 'technology') {
        res = await GetInfraestructureTablePaginationService({});
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

      setOptions(mapped);
    } catch {
      setOptions([]);
      toast.error(t('positions.errors.loadData'));
    } finally {
      setLoading(false);
    }
  }, [t, kind]);

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

    setSelectedId(null);
    setObservations('');
    setCreationDate(new Date().toISOString());
    setProcessDescription('');
    setIsMain(true);
    setActionTypeId('');

    loadOptions();
    loadActionTypes();
  }, [open, loadOptions, loadActionTypes]);

  const handleSubmit = async () => {
    if (!jobId || !selectedId) {
      toast.error(t('positions.relations.common.selectElement'));
      return;
    }

    try {
      setLoading(true);

      if (kind === 'process') {
        const payload: any = {
          isMain,
          description: processDescription?.trim() || undefined,
          job: { id: Number(jobId) },
          process: { id: Number(selectedId) },
        };
        if (actionTypeId) payload.actionType = { id: Number(actionTypeId) };
        await SaveJobProcessRelationService(payload);
      }

      if (kind === 'document') {
        await SaveJobDocumentRelationService({
          observations: observations?.trim() || undefined,
          job: { id: Number(jobId) },
          document: { id: Number(selectedId) },
        });
      }

      if (kind === 'system') {
        await SaveJobSystemRelationService({
          observations: observations?.trim() || undefined,
          job: { id: Number(jobId) },
          system: { id: Number(selectedId) },
        });
      }

      if (kind === 'indicator') {
        await SaveJobIndicatorRelationService({
          observations: observations?.trim() || undefined,
          creationDate,
          job: { id: Number(jobId) },
          indicator: { id: Number(selectedId) },
        });
      }

      if (kind === 'data') {
        await SaveJobDataRelationService({
          observations: observations?.trim() || undefined,
          job: { id: Number(jobId) },
          data: { id: Number(selectedId) },
        });
      }

      if (kind === 'technology') {
        await SaveJobTechnologiesRelationService({
          observations: observations?.trim() || undefined,
          job: { id: Number(jobId) },
          technology: { id: Number(selectedId) },
        });
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

  const selectedOption = options.find((o) => o.id === selectedId) || null;
  const showObservations = kind === 'document' || kind === 'system' || kind === 'indicator' || kind === 'data' || kind === 'technology';

  const selectLabel = useMemo(() => {
    if (kind === 'process') return t('positions.relations.process.select');
    if (kind === 'document') return t('positions.relations.document.select');
    if (kind === 'system') return t('positions.relations.system.select');
    if (kind === 'indicator') return t('positions.relations.indicator.select');
    if (kind === 'data') return t('positions.relations.data.select');
    if (kind === 'technology') return t('positions.relations.technology.select');
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

          <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
            <Button variant="outlined" onClick={onClose} disabled={loading}>
              {t('positions.relations.common.cancel')}
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
              startIcon={
                loading ? <CircularProgress size={18} color="inherit" /> : <Iconify icon="mingcute:add-line" />
              }
            >
              {t('positions.relations.common.relate')}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Drawer>
  );
}


