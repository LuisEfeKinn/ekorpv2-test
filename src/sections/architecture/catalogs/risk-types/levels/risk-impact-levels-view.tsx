'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  GetRiskTypeByIdService,
  GetRiskImpactLevelsService,
  DeleteRiskImpactLevelService,
  SaveOrUpdateRiskImpactLevelService
} from 'src/services/architecture/catalogs/riskTypes.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

export function RiskImpactLevelsView() {
  const { t, currentLang } = useTranslate('catalogs');
  const searchParams = useSearchParams();
  const router = useRouter();
  const riskTypeId = searchParams.get('risktype') || '';

  const tf = useCallback((key: string, en: string, es?: string) => {
    const v = t(key);
    if (v && v !== key) return v;
    return currentLang?.value === 'es' ? (es ?? en) : en;
  }, [t, currentLang?.value]);

  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [riskTypeName, setRiskTypeName] = useState<string>('');
  const [form, setForm] = useState<any>({ name: '', description: '', value: '' });

  const normalizeNumberInput = useCallback((raw: string) => {
    const v = String(raw || '').replace(',', '.');
    const s = v.replace(/[^0-9.]/g, '');
    return s.replace(/(\..*)\./g, '$1');
  }, []);
  const handleNumberKeyDown = useCallback((e: any) => {
    const allowed = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowed.includes(e.key) || e.ctrlKey || e.metaKey) return;
    if (e.key === '.') {
      if (String(e.currentTarget?.value || '').includes('.')) e.preventDefault();
      return;
    }
    if (!/^[0-9]$/.test(e.key)) e.preventDefault();
  }, []);

  const loadRiskTypeName = useCallback(async () => {
    if (!riskTypeId) return;
    try {
      const res = await GetRiskTypeByIdService(riskTypeId);
      const data = (res as any)?.data?.data ?? (res as any)?.data ?? res;
      const name = data?.name ?? '';
      setRiskTypeName(name);
    } catch {
      setRiskTypeName('');
    }
  }, [riskTypeId]);

  const loadList = useCallback(async () => {
    if (!riskTypeId) return;
    setLoading(true);
    try {
      const res = await GetRiskImpactLevelsService({ risktype: riskTypeId });
      const raw = (res as any)?.data;
      const listArr: any[] = Array.isArray(raw) ? (Array.isArray(raw[0]) ? raw[0] : raw) : [];
      const normalized = (listArr || []).map((item: any) => ({
        id: Number(item?.id),
        name: String(item?.impactName ?? ''),
        description: String(item?.description ?? ''),
        value: Number(item?.impactValue ?? 0),
      }));
      setList(normalized);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [riskTypeId]);

  useEffect(() => { loadRiskTypeName(); }, [loadRiskTypeName]);
  useEffect(() => { loadList(); }, [loadList]);

  const count = useMemo(() => Array.isArray(list) ? list.length : 0, [list]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: '', description: '', value: '' });
    setDialogOpen(true);
  };
  const goBackToConfigure = () => {
    const source = searchParams.get('source');
    if (source === 'map' && riskTypeId) {
        router.push(`${paths.dashboard.architecture.catalogs.riskTypesMap}?id=${riskTypeId}`);
        return;
    }

    if (!riskTypeId) {
      router.push(paths.dashboard.architecture.catalogs.riskTypes);
    } else {
      router.push(`${paths.dashboard.architecture.catalogs.riskTypes}?open=config&risktype=${riskTypeId}`);
    }
  };
  const openEdit = (row: any) => {
    setEditingId(Number(row.id));
    setForm({ name: row.name, description: row.description, value: String(row.value ?? '') });
    setDialogOpen(true);
  };
  const handleDelete = async (id: number) => {
    try {
      await DeleteRiskImpactLevelService(id);
      toast.success(tf('risk-types.levels.impact.deleted', 'Impact level deleted'));
      loadList();
    } catch {
      toast.error(tf('risk-types.levels.impact.deleteError', 'Error deleting impact level'));
    }
  };
  const handleSave = async () => {
    if (!riskTypeId) return;
    if (!form.name) {
      toast.error(tf('risk-types.levels.impact.validation', 'Name is required'));
      return;
    }
    if (String(form.value).trim() === '') {
      toast.error(tf('risk-types.levels.impact.valueValidation', 'Value is required'));
      return;
    }
    setSaving(true);
    try {
      const parsedValue = parseFloat(String(form.value).replace(',', '.'));
      const payload = {
        impactName: form.name,
        description: form.description,
        impactValue: isNaN(parsedValue) ? 0 : parsedValue,
        riskType: { id: Number(riskTypeId) },
      };
      await SaveOrUpdateRiskImpactLevelService(payload, editingId ?? undefined);
      toast.success(editingId
        ? tf('risk-types.levels.impact.updated', 'Impact level updated')
        : tf('risk-types.levels.impact.created', 'Impact level created'));
      setDialogOpen(false);
      setEditingId(null);
      setForm({ name: '', description: '', value: '' });
      loadList();
    } catch {
      toast.error(editingId
        ? tf('risk-types.levels.impact.updateError', 'Error updating impact level')
        : tf('risk-types.levels.impact.createError', 'Error creating impact level'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={`${tf('risk-types.levels.impact.panelTitle', 'Impact Levels', 'Niveles de Impacto')} (${count})`}
        links={[
          { name: t('risk-types.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('risk-types.title'), href: paths.dashboard.architecture.catalogs.riskTypes },
          { name: `${t('risk-types.configure.title')}: ${riskTypeName || riskTypeId}` },
        ]}
        action={
          <>
            <Button variant="outlined" startIcon={<Iconify icon="eva:arrow-ios-back-fill" />} onClick={goBackToConfigure} sx={{ mr: 1 }}>
              {tf('common.back', 'Back', 'Atrás')}
            </Button>
            <Button variant="contained" startIcon={<Iconify icon="mingcute:add-line" />} onClick={openCreate}>
              {t('risk-types.levels.impact.add')}
            </Button>
          </>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card sx={{ p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table sx={{ borderCollapse: 'collapse' }}>
            <TableHead>
              <TableRow>
                <TableCell>{t('risk-types.levels.impact.columns.name')}</TableCell>
                <TableCell>{t('risk-types.levels.impact.columns.description')}</TableCell>
                <TableCell align="center" sx={{ width: 160 }}>{t('risk-types.levels.impact.columns.value')}</TableCell>
                <TableCell align="center" sx={{ width: 160 }}>{tf('common.options', 'Options', 'Opciones')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.description}</TableCell>
                  <TableCell align="center">{row.value}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <IconButton size="small" color="primary" onClick={() => openEdit(row)}>
                        <Iconify icon="solar:pen-bold" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(Number(row.id))}>
                        <Iconify icon="solar:trash-bin-trash-bold" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingId ? tf('risk-types.levels.impact.editTitle', 'Edit Impact Level', 'Editar nivel de impacto') : tf('risk-types.levels.impact.addTitle', 'Add Impact Level', 'Añadir nivel de impacto')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={t('risk-types.levels.impact.fields.name')}
              value={form.name}
              onChange={(e) => setForm((p: any) => ({ ...p, name: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label={t('risk-types.levels.impact.fields.description')}
              value={form.description}
              onChange={(e) => setForm((p: any) => ({ ...p, description: e.target.value }))}
              fullWidth
              multiline
              minRows={2}
            />
            <TextField
              label={t('risk-types.levels.impact.fields.value')}
              type="text"
              value={form.value}
              onChange={(e) => setForm((p: any) => ({ ...p, value: normalizeNumberInput(e.target.value) }))}
              onKeyDown={handleNumberKeyDown}
              inputProps={{ inputMode: 'decimal', pattern: "[0-9]*[.,]?[0-9]*" }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>{t('common.cancel')}</Button>
          <LoadingButton onClick={handleSave} loading={saving} variant="contained">{t('common.save')}</LoadingButton>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}

export default RiskImpactLevelsView;
