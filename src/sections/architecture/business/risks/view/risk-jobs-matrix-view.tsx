'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetRiskJobsMatrixService } from 'src/services/architecture/business/riskJobsMatrix.service';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

function colorForScore(score: number) {
  if (score >= 20.1) return { bg: '#d32f2f', fg: '#fff' };
  if (score >= 15.1) return { bg: '#f57c00', fg: '#fff' };
  if (score >= 10.1) return { bg: '#fbc02d', fg: '#000' };
  if (score >= 5.1) return { bg: '#26a69a', fg: '#fff' };
  return { bg: '#43a047', fg: '#fff' };
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

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = (hex || '').replace('#', '');
  if (h.length !== 6) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function rgba(hex: string, a: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(0,0,0,${a})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
}

export function RiskJobsMatrixView() {
  const { t } = useTranslate('navbar');
  const tf = useCallback((key: string, d: string) => {
    const v = t(key);
    return v && v !== key ? v : d;
  }, [t]);

  const [loading, setLoading] = useState(false);
  const [matrix, setMatrix] = useState<any | null>(null);
  const [jobFilter, setJobFilter] = useState<any[]>([]);
  const [searchRisk, setSearchRisk] = useState('');

  const loadMatrix = useCallback(async () => {
    setLoading(true);
    try {
      const response = await GetRiskJobsMatrixService();
      const payload = (response as any)?.data?.data ?? (response as any)?.data ?? response;
      setMatrix(payload);
    } catch {
      setMatrix(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMatrix(); }, [loadMatrix]);

  

  const columns = useMemo(() => {
    const cols = (matrix as any)?.columns;
    const list = Array.isArray(cols) ? cols.map((c: any) => ({ id: Number(c?.id), name: String(c?.name ?? '') })) : [];
    if (jobFilter.length > 0) {
      const ids = new Set(jobFilter.map((j: any) => j.id));
      return list.filter((c) => ids.has(c.id));
    }
    return list;
  }, [matrix, jobFilter]);

  const rows = useMemo(() => {
    const rs = (matrix as any)?.rows;
    if (!Array.isArray(rs)) return [];
    const mapped = rs.map((r: any) => ({
      riskId: Number(r?.riskId),
      riskName: String(r?.riskName ?? ''),
      riskTypeId: Number(r?.riskTypeId ?? 0),
      cells: Array.isArray(r?.cells) ? r.cells.map((c: any) => ({
        jobId: Number(c?.jobId),
        jobName: String(c?.jobName ?? ''),
        probability: String(c?.probability ?? ''),
        impact: String(c?.impact ?? ''),
        score: Number(c?.score ?? 0),
        color: c?.color ?? null,
      })) : [],
    }));
    const filteredByRisk = searchRisk
      ? mapped.filter((r) => r.riskName.toLowerCase().includes(searchRisk.toLowerCase()))
      : mapped;
    if (jobFilter.length === 0) return filteredByRisk;
    const ids = new Set(jobFilter.map((j: any) => j.id));
    return filteredByRisk.map((r) => ({
      ...r,
      cells: r.cells.filter((c: any) => ids.has(c.jobId)),
    }));
  }, [matrix, jobFilter, searchRisk]);

  const allJobsOptions = useMemo(() => {
    const cols = (matrix as any)?.columns;
    return Array.isArray(cols) ? cols.map((c: any) => ({ id: Number(c?.id), name: String(c?.name ?? '') })) : [];
  }, [matrix]);

  const exportCsv = useCallback(() => {
    const header = ['Riesgo', ...columns.map((c) => c.name)].join(',');
    const lines = rows.map((r) => {
      const cellMap: Record<number, number> = {};
      r.cells.forEach((c: any) => { cellMap[c.jobId] = Number(c.score ?? 0); });
      const values = columns.map((c) => (cellMap[c.id] ?? 0).toFixed(1));
      return [r.riskName, ...values].join(',');
    });
    const csv = [header, ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'matriz-riesgos-por-puesto.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [columns, rows]);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={tf('business.items.risks.matrix', 'Matriz de Riesgos por Puesto')}
        links={[
          { name: tf('dashboard.title', 'Tablero'), href: paths.dashboard.root },
          { name: tf('architecture.title', 'Arquitectura Empresarial') },
          { name: tf('business.business', 'Negocios') },
          { name: tf('business.items.risks.matrix', 'Matriz de Riesgos por Puesto') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <Card sx={{ p: 2, borderRadius: 2, background: 'linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0) 40%)' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ width: 1 }}>
                <Autocomplete
                  multiple
                  options={allJobsOptions}
                  value={jobFilter}
                  onChange={(_, val) => setJobFilter(val)}
                  getOptionLabel={(opt) => opt.name}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip size="small" variant="filled" color="primary" label={option.name} {...getTagProps({ index })} />
                    ))
                  }
                  renderInput={(params) => <TextField {...params} size="small" placeholder={tf('business.items.positions.table', 'Filtrar puestos')} />}
                  sx={{ minWidth: 260 }}
                />
                <TextField
                  value={searchRisk}
                  onChange={(e) => setSearchRisk(e.target.value)}
                  size="small"
                  placeholder={tf('business.items.risks.table', 'Buscar riesgos')}
                />
              </Stack>
              <Stack direction="row" spacing={1}>
                <Button variant="text" startIcon={<Iconify icon="solar:eye-bold" />} onClick={loadMatrix}>
                  {tf('common.reload', 'Recargar')}
                </Button>
                <Button variant="contained" startIcon={<Iconify icon="solar:export-bold" />} onClick={exportCsv}>
                  {tf('common.export', 'Exportar')}
                </Button>
              </Stack>
            </Stack>
            {loading ? (
              <Box sx={{ py: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress />
              </Box>
            ) : (
              <Scrollbar>
                <Box sx={{ minWidth: 900 }}>
                  <Table sx={{ borderCollapse: 'separate', borderSpacing: '6px 12px' }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ position: 'sticky', left: 0, zIndex: 2, width: 260, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', fontWeight: 700, py: 0.75, px: 1.25 }}>
                          {tf('business.items.risks.title', 'Riesgos')}
                        </TableCell>
                        {columns.map((col, idx) => (
                          <TableCell key={`col-${col.id}-${idx}`} align="center" sx={{ bgcolor: 'grey.100', borderBottom: '1px solid', borderColor: 'divider', py: 0.75, px: 0.75 }}>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                            >
                              {col.name}
                            </Typography>
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.map((row, rIdx) => (
                        <TableRow key={`row-${row.riskId}-${rIdx}`}>
                          <TableCell sx={{ position: 'sticky', left: 0, zIndex: 1, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', fontWeight: 600, py: 0.75, px: 1.25 }}>
                            {row.riskName}
                          </TableCell>
                          {columns.map((col, cIdx) => {
                            const cell = row.cells.find((c: any) => c.jobId === col.id);
                            const val = Number(cell?.score ?? 0);
                            const palette = colorForScore(val);
                            const bg = (cell?.color as string | null) ?? palette.bg;
                            const fg = cell?.color ? getContrastColor(bg) : palette.fg;
                            const glow = rgba(bg, 0.35);
                            const hoverGlow = rgba(bg, 0.55);
                            const isHigh = val >= 15;
                            return (
                              <Tooltip key={`cell-${row.riskId}-${col.id}-${cIdx}`} title={`Puesto: ${col.name}\nProbabilidad: ${cell?.probability || '-'}\nImpacto: ${cell?.impact || '-'}`} arrow>
                                <TableCell
                                  align="center"
                                  sx={{
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                    bgcolor: bg,
                                    color: fg,
                                    fontWeight: 700,
                                    borderRadius: 1,
                                    py: 1,
                                    px: 1,
                                    minWidth: 110,
                                    transition: 'transform 0.15s ease, box-shadow 0.2s ease',
                                    boxShadow: `0 0 0 1px ${glow}, 0 6px 18px ${glow}`,
                                    '&:hover': {
                                      transform: 'translateY(-1px) scale(1.02)',
                                      boxShadow: `0 0 0 1px ${hoverGlow}, 0 10px 24px ${hoverGlow}`,
                                    },
                                    position: 'relative',
                                    ...(isHigh
                                      ? {
                                          '&::after': {
                                            content: '""',
                                            position: 'absolute',
                                            inset: 0,
                                            borderRadius: '8px',
                                            boxShadow: `0 0 12px ${rgba(bg, 0.6)}`,
                                            pointerEvents: 'none',
                                            animation: 'pulseGlow 2s ease-in-out infinite',
                                          },
                                          '@keyframes pulseGlow': {
                                            '0%': { boxShadow: `0 0 8px ${rgba(bg, 0.3)}` },
                                            '50%': { boxShadow: `0 0 18px ${rgba(bg, 0.7)}` },
                                            '100%': { boxShadow: `0 0 8px ${rgba(bg, 0.3)}` },
                                          },
                                        }
                                      : {}),
                                  }}
                                >
                                  {val.toFixed(1)}
                                </TableCell>
                              </Tooltip>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </Scrollbar>
            )}
          </Card>
        </Grid>
      </Grid>
    </DashboardContent>
  );
}

export default RiskJobsMatrixView;
