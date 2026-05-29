'use client';

import { usePopover } from 'minimal-shared/hooks';
import React, { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import { alpha, useTheme } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  GetProcessRasciMatrixService,
  UploadProcessRasciMatrixExcelService,
  DownloadProcessRasciMatrixExcelService
} from 'src/services/architecture/process/processTable.service';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomPopover } from 'src/components/custom-popover';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ProcessJobLinkModal } from '../processes-table/process-job-link-modal';

export function ProcessesRasciMatrixView() {
  const { t } = useTranslate('architecture');
  const { t: tCommon } = useTranslate();
  const theme = useTheme();

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [matrix, setMatrix] = useState<RasciMatrix | null>(null);
  const [columnFilter, setColumnFilter] = useState<RasciColumn[]>([]);
  const [rowFilter, setRowFilter] = useState<RasciProcessOption[]>([]);
  const [searchProcess, setSearchProcess] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const popover = usePopover();
  const [selectedProcessId, setSelectedProcessId] = useState<number | null>(null);
  const [openRelateJob, setOpenRelateJob] = useState(false);

  const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLElement>, processId: number) => {
    popover.onOpen(event);
    setSelectedProcessId(processId);
  }, [popover]);

  const handleClosePopover = useCallback(() => {
    popover.onClose();
    setSelectedProcessId(null);
  }, [popover]);

  const handleOpenRelateJob = useCallback(() => {
    setOpenRelateJob(true);
    popover.onClose();
  }, [popover]);

  const loadMatrix = useCallback(async () => {
    setLoading(true);
    try {
      const response = await GetProcessRasciMatrixService();
      const payload =
        (response as { data?: { data?: unknown } })?.data?.data ??
        (response as { data?: unknown })?.data ??
        response;
      setMatrix(normalizeRasciMatrix(payload));
    } catch {
      setMatrix(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMatrix(); }, [loadMatrix]);

  const allColumns = useMemo<RasciColumn[]>(() => matrix?.columns ?? [], [matrix]);

  const allRows = useMemo<RasciRow[]>(() => matrix?.rows ?? [], [matrix]);

  const allColumnOptions = useMemo<RasciColumn[]>(() => allColumns, [allColumns]);

  const allRowOptions = useMemo<RasciProcessOption[]>(
    () =>
      allRows.map((r) => ({
        id: r.processId,
        name: r.processName,
        nomenclature: r.processNomenclature,
        label: r.processNomenclature ? `${r.processNomenclature} - ${r.processName}` : r.processName,
      })),
    [allRows]
  );

  const selectedRowIds = useMemo(() => new Set(rowFilter.map((r) => r.id)), [rowFilter]);
  const selectedColumnIds = useMemo(() => new Set(columnFilter.map((c) => c.id)), [columnFilter]);

  const rowsAfterTextSearch = useMemo(() => {
    if (!searchProcess.trim()) return allRows;
    const term = searchProcess.toLowerCase();
    return allRows.filter((r) => {
      const name = r.processName.toLowerCase();
      const nom = r.processNomenclature.toLowerCase();
      return name.includes(term) || nom.includes(term);
    });
  }, [allRows, searchProcess]);

  const rowsAfterRowFilter = useMemo(() => {
    if (selectedRowIds.size === 0) return rowsAfterTextSearch;
    return rowsAfterTextSearch.filter((r) => selectedRowIds.has(r.processId));
  }, [rowsAfterTextSearch, selectedRowIds]);

  const nonEmptyColumnIds = useMemo(() => {
    const ids = new Set<number>();
    rowsAfterRowFilter.forEach((row) => {
      row.cells.forEach((cell) => {
        if (cell.actionTypeNomenclature) ids.add(cell.jobId);
      });
    });
    return ids;
  }, [rowsAfterRowFilter]);

  const visibleColumns = useMemo(() => {
    if (selectedColumnIds.size > 0) {
      return allColumns.filter((c) => selectedColumnIds.has(c.id));
    }
    return allColumns.filter((c) => nonEmptyColumnIds.has(c.id));
  }, [allColumns, nonEmptyColumnIds, selectedColumnIds]);

  const visibleColumnIds = useMemo(() => new Set(visibleColumns.map((c) => c.id)), [visibleColumns]);

  const visibleRows = useMemo(() => {
    if (selectedRowIds.size > 0) return rowsAfterRowFilter;
    return rowsAfterRowFilter.filter((row) =>
      row.cells.some((cell) => Boolean(cell.actionTypeNomenclature) && visibleColumnIds.has(cell.jobId))
    );
  }, [rowsAfterRowFilter, selectedRowIds, visibleColumnIds]);

  const existingJobIdsForSelectedProcess = useMemo(() => {
    if (!selectedProcessId) return undefined;
    const rs = matrix?.rows ?? [];
    const row = rs.find((r) => Number(r.processId) === Number(selectedProcessId));
    const cells = row?.cells ?? [];
    return cells
      .filter((c) => Boolean(c.actionTypeNomenclature))
      .map((c) => Number(c.jobId))
      .filter((id: number) => Number.isFinite(id));
  }, [matrix, selectedProcessId]);

  const handleDownloadExcel = async () => {
    try {
      const response = await DownloadProcessRasciMatrixExcelService();
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `RASCI_Matrix_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(error);
      toast.error(t('rasciMatrix.messages.downloadError'));
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setUploading(true);
        await UploadProcessRasciMatrixExcelService(file);
        toast.success(t('rasciMatrix.messages.uploadSuccess'));
        loadMatrix();
      } catch (error) {
        console.error(error);
        toast.error(t('rasciMatrix.messages.uploadError'));
      } finally {
        setUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const exportCsv = useCallback(() => {
    const header = ['NOMENCLATURA_PROCESO', ...visibleColumns.map((c) => c.name)].join(',');
    const lines = visibleRows.map((r) => {
      const cellMap: Record<number, string> = {};
      r.cells.forEach((c) => {
        if (c.actionTypeNomenclature) {
          cellMap[c.jobId] = c.actionTypeNomenclature;
        }
      });
      const values = visibleColumns.map((col) => `"${cellMap[col.id] ?? ''}"`);
      return [`"${r.processNomenclature}"`, ...values].join(',');
    });
    const csv = [header, ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'matriz-rasci.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [visibleColumns, visibleRows]);

  // --- Styles & Constants ---

  const RASCI_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
    R: { label: t('rasciMatrix.legend.R'), bg: alpha(theme.palette.error.main, 0.16), color: theme.palette.error.main },
    A: { label: t('rasciMatrix.legend.A'), bg: alpha(theme.palette.warning.main, 0.16), color: theme.palette.warning.main },
    S: { label: t('rasciMatrix.legend.S'), bg: alpha(theme.palette.secondary.main, 0.16), color: theme.palette.secondary.main },
    C: { label: t('rasciMatrix.legend.C'), bg: alpha(theme.palette.success.main, 0.16), color: theme.palette.success.main },
    I: { label: t('rasciMatrix.legend.I'), bg: alpha(theme.palette.info.main, 0.16), color: theme.palette.info.main },
    O: { label: t('rasciMatrix.legend.O'), bg: alpha(theme.palette.primary.main, 0.16), color: theme.palette.primary.main },
    V: { label: t('rasciMatrix.legend.V'), bg: alpha(theme.palette.secondary.main, 0.16), color: theme.palette.secondary.main },
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('rasciMatrix.title')}
        links={[
          { name: t('process.table.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('process.table.title'), href: paths.dashboard.architecture.processesTable },
          { name: t('rasciMatrix.title') },
        ]}
        action={
          <Stack direction="row" spacing={1}>
            <Button
              variant="soft"
              color="inherit"
              startIcon={<Iconify icon="eva:cloud-download-fill" />}
              onClick={exportCsv}
            >
              {t('rasciMatrix.actions.csv')}
            </Button>
            <Button
              variant="soft"
              color="inherit"
              startIcon={<Iconify icon="eva:cloud-download-fill" />}
              onClick={handleDownloadExcel}
            >
              {t('rasciMatrix.actions.excel')}
            </Button>
          </Stack>
        }
        sx={{ mb: { xs: 2, md: 2 } }}
      />

      <Card sx={{ borderRadius: 2, boxShadow: theme.customShadows.card, display: 'flex', flexDirection: 'column', height: 'calc(100vh)' }}>

        {/* Toolbar */}
        <Stack direction={{ xs: 'column', md: 'row' }} alignItems="center" justifyContent="space-between" sx={{ p: 2.5, gap: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ width: { xs: 1, md: 'auto' }, flexGrow: 1 }}>
            <TextField
              value={searchProcess}
              onChange={(e) => setSearchProcess(e.target.value)}
              size="small"
              placeholder={t('rasciMatrix.filters.search')}
              InputProps={{
                startAdornment: <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled', mr: 1 }} />
              }}
              sx={{ maxWidth: 320, width: 1 }}
            />
            <Autocomplete
              multiple
              limitTags={2}
              disableCloseOnSelect
              options={allColumnOptions}
              value={columnFilter}
              onChange={(_, val) => setColumnFilter(val)}
              getOptionLabel={(opt) => opt.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip size="small" variant="filled" label={option.name} {...getTagProps({ index })} />
                ))
              }
              renderInput={(params) => <TextField {...params} size="small" placeholder={t('rasciMatrix.filters.columns')} />}
              sx={{ minWidth: 260, maxWidth: 400 }}
            />
            <Autocomplete
              multiple
              limitTags={2}
              disableCloseOnSelect
              options={allRowOptions}
              value={rowFilter}
              onChange={(_, val) => setRowFilter(val)}
              getOptionLabel={(opt) => opt.label}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip size="small" variant="filled" label={option.label} {...getTagProps({ index })} />
                ))
              }
              renderInput={(params) => <TextField {...params} size="small" placeholder={t('rasciMatrix.filters.rows')} />}
              sx={{ minWidth: 260, maxWidth: 520 }}
            />
          </Stack>

          <Stack direction="row" spacing={1}>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
              accept=".xlsx, .xls"
            />
            <Button
              variant="contained"
              color="primary"
              startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <Iconify icon="eva:cloud-upload-fill" />}
              onClick={handleUploadClick}
              disabled={uploading}
            >
              {t('rasciMatrix.actions.upload')}
            </Button>
          </Stack>
        </Stack>

        {/* Legend (Moved to Top) */}
        {matrix && (
          <Box
            sx={{
              mx: 2.5,
              mb: 2.5,
              p: 2,
              borderRadius: 2,
              display: 'flex',
              gap: 3,
              alignItems: 'center',
              flexWrap: 'wrap',
              width: 'fit-content',
              bgcolor: alpha(theme.palette.grey[500], 0.04),
              border: `1px dashed ${theme.palette.divider}`,
            }}
          >
            {Object.entries(RASCI_CONFIG).map(([key, cfg]) => (
              <Stack key={key} direction="row" alignItems="center" spacing={1}>
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: 0.75,
                    bgcolor: cfg.bg,
                    color: cfg.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                  }}
                >
                  {key}
                </Box>
                <Box sx={{ color: 'text.secondary', typography: 'body2' }}>
                  {cfg.label}
                </Box>
              </Stack>
            ))}
          </Box>
        )}

        {loading ? (
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Scrollbar sx={{ flexGrow: 1 }}>
            <Box sx={{ minWidth: 1000 }}>
              <Table sx={{ borderCollapse: 'separate', borderSpacing: '0' }} stickyHeader>
                <TableHead>
                  <TableRow>
                    {/* Sticky Process Column Header */}
                    <TableCell
                      sx={{
                        position: 'sticky',
                        left: 0,
                        zIndex: 3,
                        bgcolor: theme.palette.background.neutral,
                        color: 'text.secondary',
                        borderBottom: 'none',
                        py: 1.5
                      }}
                    >
                      {t('rasciMatrix.table.processesRoles')}
                    </TableCell>
                    {visibleColumns.map((col, idx) => (
                      <TableCell
                        key={`col-${col.id}-${idx}`}
                        align="center"
                        sx={{
                          bgcolor: theme.palette.background.neutral,
                          color: 'text.secondary',
                          borderBottom: 'none',
                          py: 1.5,
                          px: 1,
                          minWidth: 120,
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ lineHeight: 1.2, fontWeight: 700 }}>
                          {col.name}
                        </Typography>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={Math.max(visibleColumns.length + 1, 1)} sx={{ py: 8, borderBottom: 'none' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <Box sx={{ width: 1, maxWidth: 420 }}>
                            <Box
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 1,
                                py: 2,
                              }}
                            >
                              <Typography variant="h6" sx={{ color: 'text.disabled', textAlign: 'center' }}>
                                {tCommon('filters.noResults')}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibleRows.map((row, rIdx) => {
                      const isLastRow = rIdx === visibleRows.length - 1;
                    return (
                      <TableRow key={`row-${row.processId}-${rIdx}`} hover>
                        <TableCell
                          sx={{
                            position: 'sticky',
                            left: 0,
                            zIndex: 1,
                            bgcolor: 'background.paper',
                            borderBottom: `1px solid ${theme.palette.divider}`,
                            py: 1.5,
                            ...(isLastRow && { borderBottom: 'none' })
                          }}
                        >
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                              <Stack spacing={0.5}>
                                {row.processNomenclature && (
                                  <Tooltip title={row.processNomenclature} placement="top-start" arrow>
                                    <Box sx={{ display: 'flex' }}> {/* Wrapper to control flex behavior */}
                                      <Label
                                        variant="soft"
                                        color="default"
                                        startIcon={<Iconify icon="eva:hash-fill" width={14} sx={{ opacity: 0.48 }} />}
                                        sx={{
                                          minWidth: 64,
                                          maxWidth: 140,
                                          height: 24,
                                          cursor: 'default',
                                          fontFamily: 'monospace',
                                          fontWeight: 700,
                                          letterSpacing: 0,
                                          color: 'text.secondary',
                                        }}
                                      >
                                        <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                                          {row.processNomenclature}
                                        </Box>
                                      </Label>
                                    </Box>
                                  </Tooltip>
                                )}
                                <Typography variant="subtitle2" sx={{ color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {row.processName}
                                </Typography>
                              </Stack>
                            </Box>
                            <IconButton onClick={(e) => handleOpenPopover(e, row.processId)} size="small" sx={{ flexShrink: 0 }}>
                              <Iconify icon="eva:more-vertical-fill" />
                            </IconButton>
                          </Stack>
                        </TableCell>

                        {visibleColumns.map((col, cIdx) => {
                          const cell = row.cells.find((c) => c.jobId === col.id);
                          const actionType = cell?.actionTypeNomenclature; // e.g. "R", "A"
                          const config = actionType ? RASCI_CONFIG[actionType] : null;

                          return (
                            <TableCell
                              key={`cell-${row.processId}-${col.id}-${cIdx}`}
                              align="center"
                              sx={{
                                borderBottom: `1px solid ${theme.palette.divider}`,
                                ...(isLastRow && { borderBottom: 'none' })
                              }}
                            >
                              {config ? (
                                <Box
                                  sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 36,
                                    height: 36,
                                    borderRadius: 1, // Rounded square
                                    bgcolor: config.bg,
                                    color: config.color,
                                    fontWeight: 700,
                                    fontSize: '1rem',
                                    boxShadow: theme.customShadows.z1
                                  }}
                                >
                                  {actionType}
                                </Box>
                              ) : null}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })
                  )}
                </TableBody>
              </Table>
            </Box>
          </Scrollbar>
        )}

      </Card>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={handleClosePopover}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem
            onClick={handleOpenRelateJob}
            disabled={selectedProcessId == null}
          >
            <Iconify icon="solar:users-group-rounded-bold" />
            {t('rasciMatrix.actions.relateJob')}
          </MenuItem>
          <MenuItem
            component={RouterLink}
            href={selectedProcessId ? paths.dashboard.architecture.processesTableMap(String(selectedProcessId)) : '#'}
            onClick={handleClosePopover}
          >
            <Iconify icon="solar:point-on-map-perspective-bold" />
            {t('process.table.actions.map')}
          </MenuItem>
        </MenuList>
      </CustomPopover>

      <ProcessJobLinkModal
        open={openRelateJob}
        onClose={() => {
          setOpenRelateJob(false);
        }}
        onSuccess={() => {
          setOpenRelateJob(false);
          loadMatrix();
        }}
        processId={selectedProcessId}
        existingItemIds={existingJobIdsForSelectedProcess}
      />
    </DashboardContent>
  );
}

type RasciColumn = {
  id: number;
  name: string;
};

type RasciCell = {
  jobId: number;
  actionTypeNomenclature: string | null;
};

type RasciRow = {
  processId: number;
  processName: string;
  processNomenclature: string;
  cells: RasciCell[];
};

type RasciMatrix = {
  columns: RasciColumn[];
  rows: RasciRow[];
};

type RasciProcessOption = {
  id: number;
  name: string;
  nomenclature: string;
  label: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
}

function normalizeRasciMatrix(payload: unknown): RasciMatrix {
  const columns: RasciColumn[] = [];
  const rows: RasciRow[] = [];

  if (!isRecord(payload)) return { columns, rows };

  const rawColumns = (payload as Record<string, unknown>).columns;
  if (Array.isArray(rawColumns)) {
    rawColumns.forEach((c) => {
      if (!isRecord(c)) return;
      const id = toNumber(c.id);
      if (!id) return;
      columns.push({ id, name: toString(c.name) });
    });
  }

  const rawRows = (payload as Record<string, unknown>).rows;
  if (Array.isArray(rawRows)) {
    rawRows.forEach((r) => {
      if (!isRecord(r)) return;
      const processId = toNumber(r.processId);
      if (!processId) return;
      const rawCells = r.cells;
      const cells: RasciCell[] = [];

      if (Array.isArray(rawCells)) {
        rawCells.forEach((cell) => {
          if (!isRecord(cell)) return;
          const jobId = toNumber(cell.jobId);
          if (!jobId) return;
          const actionTypeNomenclature = toString(cell.actionTypeNomenclature);
          cells.push({ jobId, actionTypeNomenclature: actionTypeNomenclature || null });
        });
      }

      rows.push({
        processId,
        processName: toString(r.processName),
        processNomenclature: toString(r.processNomenclature),
        cells,
      });
    });
  }

  return { columns, rows };
}
