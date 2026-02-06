'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import ListItemText from '@mui/material/ListItemText';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetRiskScaleMapService, GetRiskTypeByIdService, GetRiskTypesPaginationService, GetRiskToleranceLevelsService, SaveOrUpdateRiskToleranceLevelService } from 'src/services/architecture/catalogs/riskTypes.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import RiskTypesConfigureModal from '../risk-types-configure-modal';

function colorForScore(score: number) {
  if (score >= 20.1) return { bg: '#d32f2f', fg: '#fff' }; // red
  if (score >= 15.1) return { bg: '#f57c00', fg: '#fff' }; // orange
  if (score >= 10.1) return { bg: '#fbc02d', fg: '#000' }; // yellow
  if (score >= 5.1) return { bg: '#26a69a', fg: '#fff' }; // teal
  return { bg: '#43a047', fg: '#fff' }; // green
}

function getContrastColor(hex?: string) {
  const h = (hex || '').replace('#', '');
  if (h.length !== 6) return '#fff';
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const [rs, gs, bs] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  const luminance = 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  return luminance > 0.5 ? '#000' : '#fff';
}

export function RiskTypesMapView() {
  const { t } = useTranslate('catalogs');
  const searchParams = useSearchParams();

  const tf = useCallback((key: string, d: string) => {
    const v = t(key);
    return v && v !== key ? v : d;
  }, [t]);

  const [riskTypes, setRiskTypes] = useState<any[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [mapData, setMapData] = useState<any | null>(null);
  const [toleranceDialogOpen, setToleranceDialogOpen] = useState(false);
  const [toleranceLevels, setToleranceLevels] = useState<any[]>([]);
  const [loadingTolerance, setLoadingTolerance] = useState(false);
  const [showCreateTol, setShowCreateTol] = useState(false);
  const [creatingTol, setCreatingTol] = useState(false);
  const [editingTolId, setEditingTolId] = useState<number | null>(null);
  const [createTolForm, setCreateTolForm] = useState<any>({ levelName: '', toleranceColor: '#43a047', initialRange: 5, finalRange: 1 });
  const [configModalOpen, setConfigModalOpen] = useState(false);

  const loadRiskTypes = useCallback(async (searchTerm?: string) => {
    try {
      setLoadingTypes(true);
      const paramId = searchParams.get('id');
      
      const response = await GetRiskTypesPaginationService({ page: 1, perPage: 50, ...(searchTerm ? { search: searchTerm } : {}) });
      const data = response?.data?.[0] ?? response?.data?.data ?? response?.data?.items ?? response?.data ?? [];
      const list = Array.isArray(data) ? data : [];
      let normalized = list.map((rt: any) => ({
        id: String(rt?.id),
        name: String(rt?.name ?? ''),
      }));

      // If there is an ID in the URL and it is not in the list, fetch it and add it
      if (paramId && !normalized.find((n: any) => n.id === paramId)) {
        try {
            const res = await GetRiskTypeByIdService(paramId);
            const rData = (res as any)?.data?.data ?? (res as any)?.data ?? res;
            if (rData && rData.id) {
                normalized = [{ id: String(rData.id), name: String(rData.name ?? '') }, ...normalized];
            }
        } catch (e) {
            console.error('Error fetching risk type by id', e);
        }
      }

      setRiskTypes(normalized);
      if (normalized.length && !selectedTypeId) {
        const found = paramId ? normalized.find((n: any) => n.id === paramId) : null;
        setSelectedTypeId(found ? String(found.id) : String(normalized[0]?.id ?? ''));
      }
    } catch {
      setRiskTypes([]);
    } finally {
      setLoadingTypes(false);
    }
  }, [selectedTypeId, searchParams]);

  useEffect(() => { loadRiskTypes(); }, [loadRiskTypes]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (inputValue && inputValue.length >= 2) {
      timeoutId = setTimeout(() => {
        loadRiskTypes(inputValue);
      }, 300);
    }
    return () => { if (timeoutId) clearTimeout(timeoutId); };
  }, [inputValue, loadRiskTypes]);

  const loadRiskMap = useCallback(async () => {
    if (!selectedTypeId) return;
    
    try {
      const response = await GetRiskScaleMapService(selectedTypeId);
      const payload = (response as any)?.data?.data ?? (response as any)?.data ?? response;
      setMapData(payload);
    } catch {
      setMapData(null);
    }
  }, [selectedTypeId]);

  useEffect(() => { loadRiskMap(); }, [loadRiskMap]);

  const loadToleranceLevels = useCallback(async () => {
    if (!selectedTypeId) return;
    setLoadingTolerance(true);
    try {
      const response = await GetRiskToleranceLevelsService({ risktype: selectedTypeId });
      const raw = response?.data;
      let list: any[] = [];
      if (Array.isArray(raw)) {
        list = Array.isArray(raw[0]) ? raw[0] : raw.filter((it) => typeof it === 'object' && it);
      } else if (Array.isArray((response as any)?.data?.data)) {
        list = (response as any).data.data;
      }
      const sid = String(selectedTypeId);
      const filtered = Array.isArray(list)
        ? list.filter((it: any) => String(it?.riskType?.id ?? '') === sid)
        : [];
      setToleranceLevels(filtered);
    } catch {
      setToleranceLevels([]);
    } finally {
      setLoadingTolerance(false);
    }
  }, [selectedTypeId]);

  useEffect(() => { if (toleranceDialogOpen) loadToleranceLevels(); }, [toleranceDialogOpen, loadToleranceLevels]);

 

  const selectedName = useMemo(() => {
    const nameFromList = riskTypes.find(rt => rt.id === selectedTypeId)?.name;
    const nameFromMap = mapData?.riskType;
    return nameFromMap || nameFromList || '';
  }, [riskTypes, selectedTypeId, mapData]);

  const probabilityLevels = useMemo(() => {
    const cols = mapData?.columns;
    if (Array.isArray(cols)) {
      return cols.map((c: any) => ({
        label: String(c?.name ?? ''),
        value: Number(c?.value ?? 0),
      }));
    }
    return [];
  }, [mapData]);

  const matrixRows = useMemo(() => {
    const rows = mapData?.rows;
    if (Array.isArray(rows)) {
      return rows.map((r: any) => ({
        impact: String(r?.impactName ?? ''),
        impactValue: Number(r?.impactValue ?? 0),
        cells: Array.isArray(r?.cells)
          ? r.cells.map((c: any) => ({
              probability: String(c?.probabilityName ?? ''),
              probabilityValue: Number(c?.probabilityValue ?? 0),
              score: Number(c?.score ?? 0),
              toleranceColor: c?.toleranceColor,
            }))
          : [],
      }));
    }
    return [];
  }, [mapData]);

  const toleranceRows = useMemo(() => {
    const list = Array.isArray(toleranceLevels) && toleranceLevels.length > 0 ? toleranceLevels : mapData?.toleranceLevels;
    return Array.isArray(list) ? list : [];
  }, [mapData, toleranceLevels]);

  const toleranceRanges = useMemo(() => {
    if (!Array.isArray(toleranceRows)) return [];
    return toleranceRows
      .map((lvl: any) => {
        const a = Number(lvl?.initialRange ?? 0);
        const b = Number(lvl?.finalRange ?? 0);
        const min = Math.min(a, b);
        const max = Math.max(a, b);
        return {
          min,
          max,
          color: String(lvl?.toleranceColor ?? '#43a047'),
          label: String(lvl?.levelName ?? ''),
        };
      })
      .sort((x: any, y: any) => y.max - x.max);
  }, [toleranceRows]);

  const getToleranceColor = useCallback(
    (score: number) => {
      for (const rng of toleranceRanges) {
        if (score >= rng.min && score <= rng.max) return rng.color;
      }
      return undefined;
    },
    [toleranceRanges]
  );

 

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('risk-types.title')}
        links={[
          { name: t('risk-types.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('risk-types.breadcrumbs.catalogs'), href: paths.dashboard.architecture.catalogs.root },
          { name: t('risk-types.map.breadcrumb') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Box sx={{ mb: 2.5, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Autocomplete
          sx={{ minWidth: 300 }}
          options={riskTypes}
          loading={loadingTypes}
          value={riskTypes.find(rt => String(rt.id) === selectedTypeId) ?? null}
          getOptionLabel={(option: any) => option?.name ?? ''}
          isOptionEqualToValue={(option: any, value: any) => option?.id === value?.id}
          filterOptions={(x) => x}
          onOpen={() => { if (!riskTypes.length) loadRiskTypes(); }}
          onInputChange={(event, newInputValue, reason) => {
            if (reason === 'input') setInputValue(newInputValue);
          }}
          onChange={(event, newValue: any | null) => {
            setSelectedTypeId(newValue ? String(newValue.id) : '');
          }}
          autoHighlight
          openOnFocus
          renderOption={(props, option: any) => (
            <li {...props} key={String(option.id)}>{option.name}</li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              placeholder={t('risk-types.toolbar.search')}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loadingTypes ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />

        <IconButton onClick={() => setConfigModalOpen(true)} sx={{ ml: 1 }}>
          <Iconify icon="solar:settings-bold" />
        </IconButton>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>{t('risk-types.map.heading')}: {selectedName}</Typography>
            <Table sx={{ borderCollapse: 'collapse' }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 160, bgcolor: 'grey.100', border: '1px solid', borderColor: 'divider' }}>{t('risk-types.map.columns.riskLevel')}</TableCell>
                  <TableCell colSpan={Math.max(1, probabilityLevels.length)} align="center" sx={{ bgcolor: 'grey.100', border: '1px solid', borderColor: 'divider' }}>{t('risk-types.map.columns.probabilityLevel')}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ bgcolor: 'grey.100', border: '1px solid', borderColor: 'divider' }} />
                  {probabilityLevels.map((col, idx) => (
                    <TableCell key={`${idx}`} align="center" sx={{ bgcolor: 'grey.100', border: '1px solid', borderColor: 'divider' }}>{col.label}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {matrixRows.map((row: any, rIdx: number) => (
                  <TableRow key={`${rIdx}`}>
                    <TableCell sx={{ bgcolor: 'grey.100', border: '1px solid', borderColor: 'divider', position: 'relative' }}>
                      {row.impact}
                      <Box sx={{ position: 'absolute', left: -72, top: 0, bottom: 0, display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
                        <Typography sx={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', color: 'text.secondary' }}>Impact Level</Typography>
                      </Box>
                    </TableCell>
                  {row.cells.map((cell: any, cIdx: number) => {
                      const score = Number(cell.score ?? (row.impactValue * cell.probabilityValue));
                      const tolColor = getToleranceColor(score);
                      const palette = colorForScore(score);
                      const bg = tolColor ?? palette.bg;
                      const fg = tolColor ? getContrastColor(bg) : palette.fg;
                      return (
                        <TableCell key={`${rIdx}-${cIdx}`} align="center" sx={{ border: '1px solid', borderColor: 'divider', bgcolor: bg, color: fg }}>
                          {score}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography variant="subtitle1">{t('risk-types.tolerance.panelTitle')}: {selectedName}</Typography>
              <IconButton onClick={() => setToleranceDialogOpen(true)}>
                <Iconify icon="solar:settings-bold" />
              </IconButton>
            </Stack>
            <Table sx={{ borderCollapse: 'collapse' }}>
              <TableHead>
                <TableRow>
                  <TableCell align="center" sx={{ bgcolor: 'grey.100', border: '1px solid', borderColor: 'divider' }}>{t('risk-types.tolerance.columns.valorization')}</TableCell>
                  <TableCell align="center" sx={{ bgcolor: 'grey.100', border: '1px solid', borderColor: 'divider' }}>{t('risk-types.tolerance.columns.acceptance')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {toleranceRows.map((row: any, idx: number) => {
                  const fg = '#fff';
                  const init = Number(row?.initialRange ?? 0);
                  const fin = Number(row?.finalRange ?? 0);
                  const range = `${init.toFixed(1)} - ${fin.toFixed(1)}`;
                  return (
                    <TableRow key={`${String(row?.levelName ?? '')}-${idx}`}>
                      <TableCell sx={{ border: '1px solid', borderColor: 'divider', bgcolor: row?.toleranceColor ?? 'divider', color: fg, fontWeight: 600 }}>{range}</TableCell>
                      <TableCell sx={{ border: '1px solid', borderColor: 'divider' }}>{row?.levelName ?? ''}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <Dialog open={toleranceDialogOpen} onClose={() => setToleranceDialogOpen(false)} fullWidth maxWidth="sm">
              <DialogTitle>{tf('risk-types.tolerance.configTitle', 'Configure tolerance levels')}</DialogTitle>
              <DialogContent dividers sx={{ px: 3 }}>
                <List dense sx={{ px: 0 }}>
                  {loadingTolerance && (
                    <ListItem>
                      <ListItemText primary={tf('common.loading', 'Loading...')} />
                    </ListItem>
                  )}
                  {toleranceLevels.map((item: any, idx: number) => {
                    const init = Number(item?.initialRange ?? item?.max);
                    const fin = Number(item?.finalRange ?? item?.min);
                    const valid = Number.isFinite(init) && Number.isFinite(fin);
                    const rangeText = valid ? `${init.toFixed(1)} - ${fin.toFixed(1)}` : tf('common.noData', 'No data');
                    const rtName = item?.riskType?.name ? ` • ${item.riskType.name}` : '';
                    const secondary = `${rangeText}${rtName}`;
                    return (
                      <ListItem key={`${idx}-${String(item?.id ?? '')}`} disablePadding sx={{ mb: 1 }}>
                        <Box
                          onClick={() => {
                            setShowCreateTol(true);
                            setEditingTolId(Number(item?.id));
                            setCreateTolForm({
                              levelName: item?.levelName ?? '',
                              toleranceColor: item?.toleranceColor ?? '#43a047',
                              initialRange: Number(item?.initialRange ?? item?.max ?? 5),
                              finalRange: Number(item?.finalRange ?? item?.min ?? 1),
                            });
                          }}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            width: 1,
                            px: 2,
                            py: 1.5,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'action.hover' },
                          }}
                        >
                          <Box sx={{ width: 24, height: 24, borderRadius: 0.75, bgcolor: item?.toleranceColor ?? 'divider' }} />
                          <ListItemText
                            primary={item?.levelName ?? tf('common.unnamed', 'Unnamed')}
                            secondary={secondary}
                          />
                        </Box>
                      </ListItem>
                    );
                  })}
                  {!loadingTolerance && (!toleranceLevels || toleranceLevels.length === 0) && (
                    <ListItem>
                      <ListItemText primary={tf('risk-types.tolerance.empty', 'No levels available')} />
                    </ListItem>
                  )}
                </List>
              </DialogContent>
              <Divider />
              <DialogContent sx={{ pt: 2, px: 3 }}>
                {showCreateTol ? (
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <TextField
                        label={tf('risk-types.tolerance.fields.name', 'Name')}
                        value={createTolForm.levelName}
                        onChange={(e) => setCreateTolForm((p: any) => ({ ...p, levelName: e.target.value }))}
                        fullWidth
                      />
                      <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: createTolForm.toleranceColor, border: '1px solid', borderColor: 'divider' }} />
                    </Stack>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {tf('risk-types.tolerance.fields.color', 'Color')}
                      </Typography>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                          overflow: 'hidden',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <input
                          type="color"
                          value={createTolForm.toleranceColor}
                          onChange={(e) =>
                            setCreateTolForm((p: any) => ({ ...p, toleranceColor: e.target.value }))
                          }
                          style={{
                            width: 40,
                            height: 40,
                            border: 'none',
                            padding: 0,
                            background: 'transparent',
                            cursor: 'pointer',
                          }}
                        />
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={2}>
                      <TextField
                        label={tf('risk-types.tolerance.fields.initial', 'Initial')}
                        type="number"
                        value={createTolForm.initialRange}
                        onChange={(e) => setCreateTolForm((p: any) => ({ ...p, initialRange: Number(e.target.value) }))}
                      />
                      <TextField
                        label={tf('risk-types.tolerance.fields.final', 'Final')}
                        type="number"
                        value={createTolForm.finalRange}
                        onChange={(e) => setCreateTolForm((p: any) => ({ ...p, finalRange: Number(e.target.value) }))}
                      />
                    </Stack>
                  </Stack>
                ) : null}
              </DialogContent>
              <DialogActions sx={{ px: 3, py: 2 }}>
                {!showCreateTol ? (
                  <Button
                    variant="contained"
                    startIcon={<Iconify icon="mingcute:add-line" />}
                    onClick={() => { setShowCreateTol(true); setEditingTolId(null); }}
                    sx={{ ml: 'auto' }}
                  >
                    {tf('risk-types.tolerance.add', 'Add level')}
                  </Button>
                ) : (
                  <>
                    <Button onClick={() => { setShowCreateTol(false); setEditingTolId(null); setCreateTolForm({ levelName: '', toleranceColor: '#43a047', initialRange: 5, finalRange: 1 }); }}>
                      {tf('common.cancel', 'Cancel')}
                    </Button>
                    <LoadingButton
                      variant="contained"
                      loading={creatingTol}
                      disabled={!createTolForm.levelName || !createTolForm.toleranceColor}
                      onClick={async () => {
                        if (!selectedTypeId) return;
                        try {
                          setCreatingTol(true);
                          const payload = {
                            levelName: createTolForm.levelName,
                            toleranceColor: createTolForm.toleranceColor,
                            initialRange: Number(createTolForm.initialRange),
                            finalRange: Number(createTolForm.finalRange),
                            riskType: { id: Number(selectedTypeId) }
                          };
                          await SaveOrUpdateRiskToleranceLevelService(payload, editingTolId ?? undefined);
                          toast.success(
                            editingTolId
                              ? tf('risk-types.tolerance.messages.updated', 'Level updated')
                              : tf('risk-types.tolerance.messages.created', 'Level created')
                          );
                          await loadToleranceLevels();
                          setShowCreateTol(false);
                          setEditingTolId(null);
                          setCreateTolForm({ levelName: '', toleranceColor: '#43a047', initialRange: 5, finalRange: 1 });
                        } catch {
                          toast.error(
                            editingTolId
                              ? tf('risk-types.tolerance.messages.errorUpdating', 'Error updating level')
                              : tf('risk-types.tolerance.messages.errorCreating', 'Error creating level')
                          );
                        } finally {
                          setCreatingTol(false);
                        }
                      }}
                      sx={{ ml: 1 }}
                    >
                      {tf('common.save', 'Save')}
                    </LoadingButton>
                  </>
                )}
              </DialogActions>
            </Dialog>
          </Card>
        </Grid>
      </Grid>
      
      <RiskTypesConfigureModal
        open={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        dataId={selectedTypeId}
        source="map"
      />
    </DashboardContent>
  );
}

export default RiskTypesMapView;
