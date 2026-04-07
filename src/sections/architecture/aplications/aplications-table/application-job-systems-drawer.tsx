'use client';

import type { Theme, SxProps } from '@mui/material/styles';

import { useMemo, useState, useEffect, useCallback } from 'react';

import {
  Stack,
  Table,
  Drawer,
  Button,
  Dialog,
  Divider,
  TableRow,
  TableHead,
  TableBody,
  TextField,
  TableCell,
  Typography,
  IconButton,
  DialogTitle,
  Autocomplete,
  DialogActions,
  DialogContent,
  TableContainer,
  CircularProgress,
  DialogContentText,
} from '@mui/material';

import { useTranslate } from 'src/locales';
import { GetJobsPaginationService } from 'src/services/architecture/business/jobs.service';
import {
  type JobSystemRelation,
  GetJobSystemRelationsService,
  SaveJobSystemRelationService,
  UpdateJobSystemRelationService,
  DeleteJobSystemRelationService,
} from 'src/services/architecture/business/jobRelations.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

type Option = { id: number; label: string };

type Props = {
  open: boolean;
  onClose: () => void;
  systemId: number;
  systemLabel?: string;
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

export function ApplicationJobSystemsDrawer({ open, onClose, systemId, systemLabel, sx }: Props) {
  const { t } = useTranslate('architecture');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(false);

  const [relations, setRelations] = useState<JobSystemRelation[]>([]);
  const [jobOptions, setJobOptions] = useState<Option[]>([]);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [observations, setObservations] = useState('');

  const [deleteState, setDeleteState] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });
  const [deleting, setDeleting] = useState(false);

  const systemRelations = useMemo(
    () => relations.filter((r) => Number(r?.system?.id) === systemId),
    [relations, systemId]
  );

  const selectedJobOption = useMemo(() => {
    if (selectedJobId == null) return null;
    return jobOptions.find((o) => o.id === selectedJobId) ?? null;
  }, [jobOptions, selectedJobId]);

  const loadJobs = useCallback(async () => {
    try {
      setJobsLoading(true);
      const res = await GetJobsPaginationService({ page: 1, perPage: 1000 });
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

      setJobOptions(mapped);
    } catch {
      setJobOptions([]);
      toast.error(t('application.map.jobSystems.messages.jobsLoadError'));
    } finally {
      setJobsLoading(false);
    }
  }, [t]);

  const loadRelations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await GetJobSystemRelationsService();
      const list = (res as { data?: unknown })?.data;
      setRelations(Array.isArray(list) ? (list as JobSystemRelation[]) : []);
    } catch {
      setRelations([]);
      toast.error(t('application.map.jobSystems.messages.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setSelectedJobId(null);
    setObservations('');
  }, []);

  useEffect(() => {
    if (!open) return () => {};

    resetForm();
    loadRelations();
    loadJobs();
    return () => {};
  }, [loadJobs, loadRelations, open, resetForm]);

  const handleSubmit = useCallback(async () => {
    if (selectedJobId == null) {
      toast.error(t('application.map.jobSystems.form.validation.jobRequired'));
      return;
    }

    try {
      setSaving(true);

      const payload = {
        observations: observations.trim() ? observations.trim() : undefined,
        job: { id: selectedJobId },
        system: { id: systemId },
      };

      if (editingId != null) {
        await UpdateJobSystemRelationService(editingId, payload);
        toast.success(t('application.map.jobSystems.messages.updated'));
      } else {
        await SaveJobSystemRelationService(payload);
        toast.success(t('application.map.jobSystems.messages.created'));
      }

      resetForm();
      await loadRelations();
    } catch {
      toast.error(t('application.map.jobSystems.messages.saveError'));
    } finally {
      setSaving(false);
    }
  }, [editingId, loadRelations, observations, resetForm, selectedJobId, systemId, t]);

  const beginEdit = useCallback((row: JobSystemRelation) => {
    setEditingId(row.id);
    setSelectedJobId(Number(row.job?.id));
    setObservations(String(row.observations ?? ''));
  }, []);

  const confirmDelete = useCallback((id: number) => setDeleteState({ open: true, id }), []);

  const handleDelete = useCallback(async () => {
    if (deleteState.id == null) return;
    try {
      setDeleting(true);
      await DeleteJobSystemRelationService(deleteState.id);
      toast.success(t('application.map.jobSystems.messages.deleted'));
      setDeleteState({ open: false, id: null });
      if (editingId === deleteState.id) resetForm();
      await loadRelations();
    } catch {
      toast.error(t('application.map.jobSystems.messages.deleteError'));
    } finally {
      setDeleting(false);
    }
  }, [deleteState.id, editingId, loadRelations, resetForm, t]);

  const title = systemLabel
    ? t('application.map.jobSystems.titleWithSystem', { system: systemLabel })
    : t('application.map.jobSystems.title');

  return (
    <>
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
              {t('application.map.jobSystems.subtitle')}
            </Typography>
          </Stack>

          <IconButton onClick={onClose} aria-label={t('application.map.jobSystems.actions.close')}>
            <Iconify icon="solar:close-circle-bold" />
          </IconButton>
        </Stack>

        <Divider />

        <Stack spacing={2.5} sx={{ px: 3, py: 2.5 }}>
          <Typography variant="subtitle2">{t('application.map.jobSystems.form.title')}</Typography>

          <Autocomplete
            options={jobOptions}
            value={selectedJobOption}
            onChange={(_, value) => setSelectedJobId(value?.id ?? null)}
            getOptionLabel={(option) => option.label}
            loading={jobsLoading}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('application.map.jobSystems.form.fields.job')}
                placeholder={t('application.map.jobSystems.form.fields.job')}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {jobsLoading ? <CircularProgress color="inherit" size={18} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            disabled={saving || loading}
          />

          <TextField
            label={t('application.map.jobSystems.form.fields.observations')}
            placeholder={t('application.map.jobSystems.form.fields.observations')}
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            disabled={saving || loading}
            multiline
            minRows={3}
          />

          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            {editingId != null ? (
              <Button
                variant="outlined"
                color="inherit"
                onClick={resetForm}
                disabled={saving || loading}
                startIcon={<Iconify icon="solar:close-circle-bold" />}
              >
                {t('application.map.jobSystems.actions.cancelEdit')}
              </Button>
            ) : null}

            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={saving || loading}
              startIcon={
                saving ? <CircularProgress size={18} color="inherit" /> : <Iconify icon="solar:check-circle-bold" />
              }
            >
              {editingId != null ? t('application.map.jobSystems.actions.update') : t('application.map.jobSystems.actions.create')}
            </Button>
          </Stack>
        </Stack>

        <Divider />

        <Stack spacing={2} sx={{ px: 3, py: 2.5 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="subtitle2">{t('application.map.jobSystems.list.title')}</Typography>
            <Button
              variant="outlined"
              onClick={loadRelations}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={18} /> : <Iconify icon="solar:refresh-circle-bold" />}
            >
              {t('application.map.jobSystems.actions.refresh')}
            </Button>
          </Stack>

          <TableContainer sx={{ borderRadius: 1.5, border: (theme) => `1px solid ${theme.palette.divider}` }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>{t('application.map.jobSystems.list.columns.job')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t('application.map.jobSystems.list.columns.observations')}</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 120 }} align="right">
                    {t('application.map.jobSystems.list.columns.actions')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <CircularProgress size={18} />
                        <Typography variant="body2" color="text.secondary">
                          {t('application.map.jobSystems.list.loading')}
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ) : systemRelations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <Typography variant="body2" color="text.secondary">
                        {t('application.map.jobSystems.list.empty')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  systemRelations.map((row) => (
                    <TableRow key={row.id} hover selected={editingId === row.id}>
                      <TableCell>{String(row.job?.name ?? `#${row.job?.id ?? '-'}`)}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {row.observations ? String(row.observations) : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <IconButton
                            size="small"
                            onClick={() => beginEdit(row)}
                            aria-label={t('application.map.jobSystems.actions.edit')}
                          >
                            <Iconify icon="solar:pen-bold" width={18} />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => confirmDelete(row.id)}
                            aria-label={t('application.map.jobSystems.actions.delete')}
                          >
                            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </Drawer>

      <Dialog
        open={deleteState.open}
        onClose={() => !deleting && setDeleteState({ open: false, id: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t('application.map.jobSystems.deleteDialog.title')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('application.map.jobSystems.deleteDialog.content')}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => setDeleteState({ open: false, id: null })}
            disabled={deleting}
          >
            {t('application.map.jobSystems.actions.cancel')}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleting}
            startIcon={
              deleting ? <CircularProgress size={18} color="inherit" /> : <Iconify icon="solar:trash-bin-trash-bold" />
            }
          >
            {t('application.map.jobSystems.actions.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
