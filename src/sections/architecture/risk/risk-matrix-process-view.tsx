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
import { GetRiskProcessMatrixService } from 'src/services/architecture/business/riskJobsMatrix.service';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

type ScaleLevel = {
  id: number;
  name: string;
  value: number;
};

type MatrixCell = {
  processId: number;
  processName: string;
  probability: ScaleLevel;
  impact: ScaleLevel;
  score: number;
  color: string | null;
};

type MatrixRow = {
  riskId: number;
  riskName: string;
  riskTypeId: number;
  cells: MatrixCell[];
};

type MatrixColumn = {
  id: number;
  name: string;
};

type RiskMatrixProcess = {
  rows: MatrixRow[];
  columns: MatrixColumn[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function toString(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

function parseScaleLevel(value: unknown): ScaleLevel | null {
  if (!isRecord(value)) return null;
  const id = toNumber(value.id);
  const name = toString(value.name);
  const levelValue = toNumber(value.value);
  if (id === null || name === null || levelValue === null) return null;
  return { id, name, value: levelValue };
}

function parseMatrix(payload: unknown): RiskMatrixProcess | null {
  const root = isRecord(payload) && 'data' in payload ? (payload as Record<string, unknown>).data : payload;
  if (!isRecord(root)) return null;
  const rowsRaw = root.rows;
  const colsRaw = root.columns;
  if (!Array.isArray(rowsRaw) || !Array.isArray(colsRaw)) return null;

  const columns: MatrixColumn[] = colsRaw
    .map((col): MatrixColumn | null => {
      if (!isRecord(col)) return null;
      const id = toNumber(col.id);
      const name = toString(col.name);
      if (id === null || name === null) return null;
      return { id, name };
    })
    .filter((c): c is MatrixColumn => c !== null);

  const rows: MatrixRow[] = rowsRaw
    .map((row): MatrixRow | null => {
      if (!isRecord(row)) return null;
      const riskId = toNumber(row.riskId);
      const riskName = toString(row.riskName);
      const riskTypeId = toNumber(row.riskTypeId);
      const cellsRaw = row.cells;
      if (riskId === null || riskName === null || riskTypeId === null || !Array.isArray(cellsRaw)) return null;

      const cells: MatrixCell[] = cellsRaw
        .map((cell): MatrixCell | null => {
          if (!isRecord(cell)) return null;
          const processId = toNumber(cell.processId);
          const processName = toString(cell.processName);
          const probability = parseScaleLevel(cell.probability);
          const impact = parseScaleLevel(cell.impact);
          const score = toNumber(cell.score);
          const color = cell.color === null ? null : toString(cell.color);

          if (processId === null || processName === null || probability === null || impact === null || score === null) {
            return null;
          }

          return { processId, processName, probability, impact, score, color };
        })
        .filter((c): c is MatrixCell => c !== null);

      return { riskId, riskName, riskTypeId, cells };
    })
    .filter((r): r is MatrixRow => r !== null);

  return { rows, columns };
}

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
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

function rgba(hex: string, a: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(0,0,0,${a})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function RiskMatrixProcessView() {
  const { t } = useTranslate('architecture');

  const [loading, setLoading] = useState(false);
  const [matrix, setMatrix] = useState<RiskMatrixProcess | null>(null);
  const [processFilter, setProcessFilter] = useState<MatrixColumn[]>([]);
  const [searchRisk, setSearchRisk] = useState('');

  const loadMatrix = useCallback(async () => {
    setLoading(true);
    try {
      const response = await GetRiskProcessMatrixService();
      const parsed = parseMatrix(response.data);
      setMatrix(parsed);
    } catch {
      setMatrix(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMatrix();
    const interval = window.setInterval(loadMatrix, 60_000);
    return () => window.clearInterval(interval);
  }, [loadMatrix]);

  const allProcessesOptions = useMemo<MatrixColumn[]>(() => matrix?.columns ?? [], [matrix]);

  const columns = useMemo<MatrixColumn[]>(() => {
    if (!matrix) return [];
    if (processFilter.length === 0) return matrix.columns;
    const ids = new Set(processFilter.map((p) => p.id));
    return matrix.columns.filter((c) => ids.has(c.id));
  }, [matrix, processFilter]);

  const rows = useMemo<MatrixRow[]>(() => {
    if (!matrix) return [];
    const filteredByRisk = searchRisk
      ? matrix.rows.filter((r) => r.riskName.toLowerCase().includes(searchRisk.toLowerCase()))
      : matrix.rows;

    if (processFilter.length === 0) return filteredByRisk;
    const ids = new Set(processFilter.map((p) => p.id));
    return filteredByRisk.map((r) => ({ ...r, cells: r.cells.filter((c) => ids.has(c.processId)) }));
  }, [matrix, processFilter, searchRisk]);

  const exportCsv = useCallback(() => {
    const header = [csvEscape(t('riskMatrixProcess.table.risks')), ...columns.map((c) => csvEscape(c.name))].join(',');
    const lines = rows.map((r) => {
      const cellMap = new Map<number, number>();
      r.cells.forEach((c) => cellMap.set(c.processId, c.score));
      const values = columns.map((c) => (cellMap.get(c.id) ?? 0).toFixed(1));
      return [csvEscape(r.riskName), ...values].join(',');
    });
    const csv = [header, ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'matriz-riesgos-por-proceso.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [columns, rows, t]);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('riskMatrixProcess.title')}
        links={[
          { name: t('risk.table.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('risk.table.title'), href: paths.dashboard.architecture.risksTable },
          { name: t('riskMatrixProcess.title') },
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
                  options={allProcessesOptions}
                  value={processFilter}
                  onChange={(_, val) => setProcessFilter(val)}
                  getOptionLabel={(opt) => opt.name}
                  isOptionEqualToValue={(opt, val) => opt.id === val.id}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip size="small" variant="filled" color="primary" label={option.name} {...getTagProps({ index })} />
                    ))
                  }
                  renderInput={(params) => <TextField {...params} size="small" placeholder={t('riskMatrixProcess.filters.process')} />}
                  sx={{ minWidth: 260 }}
                />
                <TextField
                  value={searchRisk}
                  onChange={(e) => setSearchRisk(e.target.value)}
                  size="small"
                  placeholder={t('riskMatrixProcess.filters.risk')}
                />
              </Stack>
              <Stack direction="row" spacing={1}>
                <Button variant="text" startIcon={<Iconify icon="solar:eye-bold" />} onClick={loadMatrix}>
                  {t('riskMatrixProcess.actions.reload')}
                </Button>
                <Button variant="contained" startIcon={<Iconify icon="solar:export-bold" />} onClick={exportCsv}>
                  {t('riskMatrixProcess.actions.export')}
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
                          {t('riskMatrixProcess.table.risks')}
                        </TableCell>
                        {columns.map((col) => (
                          <TableCell key={`col-${col.id}`} align="center" sx={{ bgcolor: 'grey.100', borderBottom: '1px solid', borderColor: 'divider', py: 0.75, px: 0.75 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {col.name}
                            </Typography>
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.map((row) => {
                        const cellMap = new Map<number, MatrixCell>();
                        row.cells.forEach((c) => cellMap.set(c.processId, c));
                        return (
                          <TableRow key={`row-${row.riskId}`}>
                            <TableCell sx={{ position: 'sticky', left: 0, zIndex: 1, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', fontWeight: 600, py: 0.75, px: 1.25 }}>
                              {row.riskName}
                            </TableCell>
                            {columns.map((col) => {
                              const cell = cellMap.get(col.id);
                              const val = Number(cell?.score ?? 0);
                              const palette = colorForScore(val);
                              const bg = cell?.color ?? palette.bg;
                              const fg = cell?.color ? getContrastColor(bg) : palette.fg;
                              const glow = rgba(bg, 0.35);
                              const hoverGlow = rgba(bg, 0.55);
                              const isHigh = val >= 15;
                              const tooltipTitle = cell
                                ? `${t('riskMatrixProcess.tooltip.process')}: ${col.name}\n${t('riskMatrixProcess.tooltip.probability')}: ${cell.probability.name} (${cell.probability.value})\n${t('riskMatrixProcess.tooltip.impact')}: ${cell.impact.name} (${cell.impact.value})`
                                : `${t('riskMatrixProcess.tooltip.process')}: ${col.name}`;
                              return (
                                <Tooltip key={`cell-${row.riskId}-${col.id}`} title={tooltipTitle} arrow>
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
                        );
                      })}
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

export default RiskMatrixProcessView;
