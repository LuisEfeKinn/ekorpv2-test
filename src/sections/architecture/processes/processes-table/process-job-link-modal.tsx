'use client';

import { useMemo, useState, useEffect } from 'react';

import { Box, Stack, Drawer, Button, TextField, Typography, Autocomplete, CircularProgress } from '@mui/material';

import { useTranslate } from 'src/locales';
import { GetJobsListService } from 'src/services/architecture/risk/riskJobs.service';
import { SaveJobProcessRelationService } from 'src/services/architecture/business/jobProcesses.service';
import { GetActionTypesPaginationService } from 'src/services/architecture/catalogs/actionTypes.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  processId: number | string | null;
};

export function ProcessJobLinkModal({ open, onClose, onSuccess, processId }: Props) {
  const { t } = useTranslate('architecture');
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [actionTypes, setActionTypes] = useState<any[]>([]);
  const [form, setForm] = useState({
    jobId: null as null | number,
    isMain: false,
    description: '',
    actionTypeId: null as null | number
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [jobsRes, actionTypesRes] = await Promise.all([
          GetJobsListService(),
          GetActionTypesPaginationService({ perPage: 1000 })
        ]);

        // Process Jobs
        const rawJobs = jobsRes?.data;
        const jobsList: any[] = Array.isArray(rawJobs?.data)
          ? rawJobs.data
          : Array.isArray(rawJobs)
            ? rawJobs
            : Array.isArray((rawJobs as any)?.data?.data)
              ? (rawJobs as any).data.data
              : [];
        setJobs(Array.isArray(jobsList) ? jobsList : []);

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
        toast.error('Error al cargar datos');
      }
    };
    if (open) {
      setForm({ jobId: null, isMain: false, description: '', actionTypeId: null });
      load();
    }
  }, [open]);

  const jobOptions = useMemo(() => jobs.map((j: any) => ({ label: j?.name || j?.label || `#${j?.id}`, id: j?.id })), [jobs]);
  
  const actionTypeOptions = useMemo(() => actionTypes.map((a: any) => ({ 
    label: a?.name || `#${a?.id}`, 
    id: a?.id,
    color: a?.color 
  })), [actionTypes]);

  const handleSubmit = async () => {
    if (!processId || !form.jobId || !form.actionTypeId) {
      toast.error('Faltan datos obligatorios');
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
      await SaveJobProcessRelationService(payload);
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
            onChange={(_: any, v: any) => setForm((f) => ({ ...f, jobId: v?.id || null }))}
            renderInput={(params: any) => <TextField {...params} label={t('process.map.modals.job.fieldLabel')} />}
          />
          
          <Autocomplete
            options={actionTypeOptions}
            value={actionTypeOptions.find((o) => o.id === form.actionTypeId) || null}
            onChange={(_: any, v: any) => setForm((f) => ({ ...f, actionTypeId: v?.id || null }))}
            renderInput={(params: any) => <TextField {...params} label={t('process.map.modals.common.actionType')} />}
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
            value={form.isMain ? { id: 1, label: t('process.map.modals.common.mainProcess') } : { id: 0, label: t('process.map.modals.common.secondaryProcess') }}
            onChange={(_: any, v: any) => setForm((f) => ({ ...f, isMain: (v?.id ?? 0) === 1 }))}
            renderInput={(params: any) => <TextField {...params} label={t('process.map.modals.common.relationType')} />}
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
