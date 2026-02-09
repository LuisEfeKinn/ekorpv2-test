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

export function ProcessesRasciMatrixView() {
  const { t } = useTranslate('architecture');
  const theme = useTheme();
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [matrix, setMatrix] = useState<any | null>(null);
  const [columnFilter, setColumnFilter] = useState<any[]>([]);
  const [searchProcess, setSearchProcess] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const popover = usePopover();
  const [selectedProcessId, setSelectedProcessId] = useState<number | null>(null);

  const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLElement>, processId: number) => {
    popover.onOpen(event);
    setSelectedProcessId(processId);
  }, [popover]);

  const handleClosePopover = useCallback(() => {
    popover.onClose();
    setSelectedProcessId(null);
  }, [popover]);

  const loadMatrix = useCallback(async () => {
    setLoading(true);
    try {
      const response = await GetProcessRasciMatrixService();
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
    if (columnFilter.length > 0) {
      const ids = new Set(columnFilter.map((c: any) => c.id));
      return list.filter((c) => ids.has(c.id));
    }
    return list;
  }, [matrix, columnFilter]);

  const rows = useMemo(() => {
    const rs = (matrix as any)?.rows;
    if (!Array.isArray(rs)) return [];
    
    // Filter by process name
    let filtered = rs;
    if (searchProcess) {
      filtered = rs.filter((r: any) => 
        (r?.processName || '').toLowerCase().includes(searchProcess.toLowerCase()) ||
        (r?.processNomenclature || '').toLowerCase().includes(searchProcess.toLowerCase())
      );
    }

    return filtered.map((r: any) => ({
      processId: Number(r?.processId),
      processName: String(r?.processName ?? ''),
      processNomenclature: String(r?.processNomenclature ?? ''),
      cells: Array.isArray(r?.cells) ? r.cells : [],
    }));
  }, [matrix, searchProcess]);

  const allColumnOptions = useMemo(() => {
    const cols = (matrix as any)?.columns;
    return Array.isArray(cols) ? cols.map((c: any) => ({ id: Number(c?.id), name: String(c?.name ?? '') })) : [];
  }, [matrix]);

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
    const header = ['NOMENCLATURA_PROCESO', ...columns.map((c) => c.name)].join(',');
    const lines = rows.map((r) => {
      const cellMap: Record<number, string> = {};
      r.cells.forEach((c: any) => { 
        if (c.actionTypeNomenclature) {
            cellMap[c.jobId] = c.actionTypeNomenclature;
        }
      });
      const values = columns.map((col) => `"${cellMap[col.id] ?? ''}"`);
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
  }, [columns, rows]);

  // --- Styles & Constants ---

  const RASCI_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
    R: { label: t('rasciMatrix.legend.R'), bg: alpha(theme.palette.error.main, 0.16), color: theme.palette.error.main },
    A: { label: t('rasciMatrix.legend.A'), bg: alpha(theme.palette.warning.main, 0.16), color: theme.palette.warning.main },
    S: { label: t('rasciMatrix.legend.S'), bg: alpha(theme.palette.secondary.main, 0.16), color: theme.palette.secondary.main },
    C: { label: t('rasciMatrix.legend.C'), bg: alpha(theme.palette.success.main, 0.16), color: theme.palette.success.main },
    I: { label: t('rasciMatrix.legend.I'), bg: alpha(theme.palette.info.main, 0.16), color: theme.palette.info.main },
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('rasciMatrix.title')}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
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
                CSV
              </Button>
              <Button 
                variant="soft" 
                color="inherit"
                startIcon={<Iconify icon="eva:cloud-download-fill" />} 
                onClick={handleDownloadExcel}
              >
                Excel
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
                options={allColumnOptions}
                value={columnFilter}
                onChange={(_, val) => setColumnFilter(val)}
                getOptionLabel={(opt) => opt.name}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip size="small" variant="filled" label={option.name} {...getTagProps({ index })} />
                  ))
                }
                renderInput={(params) => <TextField {...params} size="small" placeholder={t('rasciMatrix.filters.columns')} />}
                sx={{ minWidth: 260, maxWidth: 400 }}
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
                    {columns.map((col, idx) => (
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
                  {rows.map((row, rIdx) => {
                    const isLastRow = rIdx === rows.length - 1;
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
                          
                          {columns.map((col, cIdx) => {
                            const cell = row.cells.find((c: any) => c.jobId === col.id);
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
                  })}
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
            component={RouterLink}
            href={selectedProcessId ? paths.dashboard.architecture.processesTableMap(String(selectedProcessId)) : '#'}
            onClick={handleClosePopover}
          >
            <Iconify icon="solar:point-on-map-perspective-bold" />
            {t('process.table.actions.map')}
          </MenuItem>
        </MenuList>
      </CustomPopover>
    </DashboardContent>
  );
}
