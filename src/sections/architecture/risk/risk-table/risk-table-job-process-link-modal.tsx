'use client';

import { useMemo, useState, useEffect } from 'react';

import {
  Box,
  Stack,
  Drawer,
  Button,
  TextField,
  Typography,
  Autocomplete,
  CircularProgress,
} from '@mui/material';

import { useTranslate } from 'src/locales';
import { GetJobsListService } from 'src/services/architecture/risk/riskJobs.service';
import { SaveJobProcessRelationService } from 'src/services/architecture/business/jobProcesses.service';

import { toast } from 'src/components/snackbar';

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  processId: number | null;
};

export function RiskTableJobProcessLinkModal({ open, onClose, onSuccess, processId }: Props) {
  const { t } = useTranslate('architecture');
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [form, setForm] = useState({ jobId: null as null | number, isMain: true, description: 'Proceso principal' });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await GetJobsListService();
        const raw = res?.data;
        const list: any[] = Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw)
            ? raw
            : Array.isArray((raw as any)?.data?.data)
              ? (raw as any).data.data
              : [];
        setJobs(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error('Error loading jobs list:', e);
        toast.error('Error al cargar cargos');
      }
    };
    if (open) load();
  }, [open]);

  const jobOptions = useMemo(() => jobs.map((j: any) => ({ label: j?.name || j?.label || `#${j?.id}`, id: j?.id })), [jobs]);

  const handleSubmit = async () => {
    if (!processId || !form.jobId) {
      toast.error('Faltan datos: proceso o cargo');
      return;
    }
    const payload = {
      isMain: Boolean(form.isMain),
      description: form.description || 'Proceso principal',
      job: { id: Number(form.jobId) },
      process: { id: Number(processId) }
    };
    try {
      setLoading(true);
      console.info('POST /api/job-processes', payload);
      await SaveJobProcessRelationService(payload);
      toast.success(t('risk.table.messages.success.created'));
      onSuccess();
      onClose();
    } catch (e) {
      console.error(e);
      toast.error(t('risk.table.messages.error.saving'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 420 } }}>
      <Box sx={{ px: 2, py: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Vincular Cargo a Proceso</Typography>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Autocomplete
            options={jobOptions}
            value={jobOptions.find((o) => o.id === form.jobId) || null}
            onChange={(_: any, v: any) => setForm((f) => ({ ...f, jobId: v?.id || null }))}
            renderInput={(params: any) => <TextField {...params} label="Cargo (Job)" />}
          />
          <TextField label="Descripción" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <Autocomplete
            options={[{ id: 1, label: 'Proceso principal ' }, { id: 0, label: 'Proceso secundario ' }]}
            value={form.isMain ? { id: 1, label: 'Proceso principal ' } : { id: 0, label: 'Proceso secundario' }}
            onChange={(_: any, v: any) => setForm((f) => ({ ...f, isMain: (v?.id ?? 1) === 1 }))}
            renderInput={(params: any) => <TextField {...params} label="Tipo de relación" />}
          />
          <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
            <Button variant="outlined" onClick={onClose}>{t('risk.table.actions.cancel')}</Button>
            <Button variant="contained" onClick={handleSubmit} disabled={loading} startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}>
              Vincular
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Drawer>
  );
}
