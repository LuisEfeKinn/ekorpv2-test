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
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  GetRiskTypeByIdService,
  GetRiskToleranceLevelsService,
  SaveOrUpdateRiskToleranceLevelService
} from 'src/services/architecture/catalogs/riskTypes.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

export function RiskToleranceLevelsView() {
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
  const [form, setForm] = useState<any>({ levelName: '', toleranceColor: '#43a047', initialRange: '', finalRange: '' });

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
      const res = await GetRiskToleranceLevelsService({ risktype: riskTypeId });
      const raw = (res as any)?.data ?? res;
      let listArr: any[] = [];
      if (Array.isArray(raw)) {
        listArr = Array.isArray(raw[0]) ? raw[0] : raw;
      } else if (Array.isArray((res as any)?.data?.data)) {
        listArr = (res as any).data.data;
      } else if (Array.isArray((res as any)?.items)) {
        listArr = (res as any).items;
      }
      const normalized = (listArr || []).map((item: any, idx: number) => ({
        id: Number(item?.id ?? idx),
        levelName: String(item?.levelName ?? ''),
        toleranceColor: String(item?.toleranceColor ?? '#43a047'),
        initialRange: Number(item?.initialRange ?? item?.max ?? 0),
        finalRange: Number(item?.finalRange ?? item?.min ?? 0),
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
    setForm({ levelName: '', toleranceColor: '#43a047', initialRange: '', finalRange: '' });
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
    setForm({
      levelName: row.levelName,
      toleranceColor: row.toleranceColor,
      initialRange: String(row.initialRange ?? ''),
      finalRange: String(row.finalRange ?? ''),
    });
    setDialogOpen(true);
  };
  const handleSave = async () => {
    if (!riskTypeId) return;
    if (!form.levelName) {
      toast.error(tf('risk-types.tolerance.validation', 'Name is required'));
      return;
    }
    if (String(form.initialRange).trim() === '' || String(form.finalRange).trim() === '') {
      toast.error(tf('risk-types.tolerance.validationRange', 'Initial and Final are required'));
      return;
    }
    setSaving(true);
    try {
      const parsedInitial = parseFloat(String(form.initialRange).replace(',', '.'));
      const parsedFinal = parseFloat(String(form.finalRange).replace(',', '.'));
      const payload = {
        levelName: form.levelName,
        toleranceColor: form.toleranceColor,
        initialRange: isNaN(parsedInitial) ? 0 : parsedInitial,
        finalRange: isNaN(parsedFinal) ? 0 : parsedFinal,
        riskType: { id: Number(riskTypeId) }
      };
      await SaveOrUpdateRiskToleranceLevelService(payload, editingId ?? undefined);
      toast.success(editingId
        ? tf('risk-types.tolerance.messages.updated', 'Level updated')
        : tf('risk-types.tolerance.messages.created', 'Level created'));
      setDialogOpen(false);
      setEditingId(null);
      setForm({ levelName: '', toleranceColor: '#43a047', initialRange: '', finalRange: '' });
      loadList();
    } catch {
      toast.error(editingId
        ? tf('risk-types.tolerance.messages.errorUpdating', 'Error updating level')
        : tf('risk-types.tolerance.messages.errorCreating', 'Error creating level'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={tf('risk-types.tolerance.panelTitle', `Risk Tolerance Levels (${count})`, `Niveles de tolerancia al riesgo (${count})`)}
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
              {t('risk-types.tolerance.add')}
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
                <TableCell>{t('risk-types.tolerance.fields.name')}</TableCell>
                <TableCell align="center" sx={{ width: 120 }}>{t('risk-types.tolerance.fields.color')}</TableCell>
                <TableCell align="center" sx={{ width: 160 }}>{t('risk-types.tolerance.fields.initial')}</TableCell>
                <TableCell align="center" sx={{ width: 160 }}>{t('risk-types.tolerance.fields.final')}</TableCell>
                <TableCell align="center" sx={{ width: 160 }}>{tf('common.options', 'Options', 'Opciones')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.levelName}</TableCell>
                  <TableCell align="center">
                    <Box sx={{ width: 24, height: 24, borderRadius: 0.75, bgcolor: row.toleranceColor }} />
                  </TableCell>
                  <TableCell align="center">{row.initialRange}</TableCell>
                  <TableCell align="center">{row.finalRange}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <IconButton size="small" color="primary" onClick={() => openEdit(row)}>
                        <Iconify icon="solar:pen-bold" />
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
        <DialogTitle>{editingId ? tf('risk-types.tolerance.editTitle', 'Edit Risk Tolerance Level', 'Editar nivel de tolerancia') : tf('risk-types.tolerance.addTitle', 'Add Risk Tolerance Level', 'Añadir nivel de tolerancia')}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={t('risk-types.tolerance.fields.name')}
              value={form.levelName}
              onChange={(e) => setForm((p: any) => ({ ...p, levelName: e.target.value }))}
              fullWidth
              required
            />
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t('risk-types.tolerance.fields.color')}</Typography>
              <Box sx={{ width: 40, height: 40, borderRadius: 1, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                <input
                  type="color"
                  value={form.toleranceColor}
                  onChange={(e) => setForm((p: any) => ({ ...p, toleranceColor: e.target.value }))}
                  style={{ width: 40, height: 40, border: 'none', padding: 0, background: 'transparent', cursor: 'pointer' }}
                />
              </Box>
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                label={t('risk-types.tolerance.fields.initial')}
                type="text"
                value={form.initialRange}
                onChange={(e) => setForm((p: any) => ({ ...p, initialRange: normalizeNumberInput(e.target.value) }))}
                onKeyDown={handleNumberKeyDown}
                inputProps={{ inputMode: 'decimal', pattern: "[0-9]*[.,]?[0-9]*" }}
              />
              <TextField
                label={t('risk-types.tolerance.fields.final')}
                type="text"
                value={form.finalRange}
                onChange={(e) => setForm((p: any) => ({ ...p, finalRange: normalizeNumberInput(e.target.value) }))}
                onKeyDown={handleNumberKeyDown}
                inputProps={{ inputMode: 'decimal', pattern: "[0-9]*[.,]?[0-9]*" }}
              />
            </Stack>
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

export default RiskToleranceLevelsView;
