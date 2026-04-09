
'use client';

import type { JobFlowNode } from 'src/types/job-flow';

import { varAlpha } from 'minimal-shared/utils';
import { useBoolean } from 'minimal-shared/hooks';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { JobFlowService } from 'src/services/architecture/business/job-flow.service';
import { UploadJobsService, DownloadJobsTemplateService } from 'src/services/architecture/business/jobs.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { ZoomPanWrapper } from 'src/components/zoom-pan-wrapper/zoom-pan-wrapper';
import { OrganizationalChart } from 'src/components/organizational-chart/organizational-chart';

import { JobFlowChartNode } from '../job-flow-chart-node';

// ----------------------------------------------------------------------

export function JobFlowMapView() {
  const theme = useTheme();
  const { t } = useTranslate('business');
  const uploadDrawer = useBoolean();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<JobFlowNode | null>(null);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<JobFlowNode[]>([]);
  const [uploading, setUploading] = useState(false);

  const focusedNode = history.length > 0 ? history[history.length - 1] : null;

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await JobFlowService.getFlow();
        if (Array.isArray(response.data) && response.data.length > 0) {
          setData(response.data[0]);
        }
      } catch (error) {
        console.error('Error loading job flow:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleToggleCollapse = useCallback((nodeId: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const handleNodeDoubleClick = useCallback((node: JobFlowNode) => {
    setHistory((prev) => [...prev, node]);
    // Expand the node when focused to ensure children are visible
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(String(node.id))) {
        next.delete(String(node.id));
      }
      return next;
    });
  }, []);

  const handleGoBack = useCallback(() => {
    setHistory((prev) => prev.slice(0, -1));
  }, []);

  const handleResetView = useCallback(() => {
    setHistory([]);
  }, []);

  const handleDownloadTemplate = useCallback(async () => {
    try {
      const response = await DownloadJobsTemplateService();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'jobs_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(error);
      toast.error(t('positions.table.messages.downloadError') || 'Error downloading template');
    }
  }, [t]);

  const handleUpload = useCallback(
    async (file: File) => {
      try {
        setUploading(true);
        await UploadJobsService(file);
        toast.success(t('positions.table.messages.uploadSuccess') || 'Upload success');
      } catch (error) {
        console.error(error);
        toast.error(t('positions.table.messages.uploadError') || 'Error uploading file');
        throw error;
      } finally {
        setUploading(false);
      }
    },
    [t]
  );

  const visibleData = useMemo(() => {
    if (!data) return null;

    const applyCollapsed = (nodes: JobFlowNode[]): JobFlowNode[] =>
      nodes.map((node) => ({
        ...node,
        children: collapsedNodes.has(String(node.id)) ? [] : applyCollapsed(node.children ?? []),
      }));

    if (focusedNode) {
      return applyCollapsed([focusedNode])[0];
    }

    return applyCollapsed([data])[0];
  }, [collapsedNodes, data, focusedNode]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!data) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Organigrama de Cargos"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Arquitectura', href: '' },
            { name: 'Cargos', href: paths.dashboard.architecture.positionsTable },
            { name: 'Organigrama' },
          ]}
          sx={{ mb: 3 }}
        />
        <EmptyContent title="No hay datos disponibles" />
      </DashboardContent>
    );
  }

  return (
    <>
      <DashboardContent maxWidth={false}>
        <CustomBreadcrumbs
          heading="Organigrama de Cargos"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Arquitectura', href: '' },
            { name: 'Cargos', href: paths.dashboard.architecture.positionsTable },
            { name: 'Organigrama', onClick: history.length > 0 ? handleResetView : undefined },
            ...history.map((node, index) => ({
              name: node.data.name,
              onClick:
                index < history.length - 1
                  ? () => setHistory((prev) => prev.slice(0, index + 1))
                  : undefined,
            })),
          ]}
          action={
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<Iconify icon="eva:cloud-upload-fill" />}
                onClick={uploadDrawer.onTrue}
              >
                {t('positions.table.actions.upload', { defaultValue: 'Cargar Plantilla' })}
              </Button>
              {history.length > 0 ? (
                <Button
                  variant="outlined"
                  startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
                  onClick={handleGoBack}
                >
                  Atrás
                </Button>
              ) : null}
            </Stack>
          }
          sx={{ mb: 3 }}
        />

        <Box
          sx={{
            height: '75vh',
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: 'background.neutral',
            border: `1px dashed ${theme.vars.palette.divider}`,
          }}
        >
          <ZoomPanWrapper>
            <Box sx={{ pt: 5 }}>
              {visibleData && (
                <OrganizationalChart
                  data={visibleData}
                  lineColor={theme.vars.palette.primary.light}
                  nodeItem={(props: JobFlowNode) => (
                    <JobFlowChartNode
                      node={props}
                      isCollapsed={collapsedNodes.has(String(props.id))}
                      onToggleCollapse={() => handleToggleCollapse(String(props.id))}
                      onDoubleClick={() => handleNodeDoubleClick(props)}
                    />
                  )}
                />
              )}
            </Box>
          </ZoomPanWrapper>
        </Box>
      </DashboardContent>

      <JobsUploadTemplateDrawer
        open={uploadDrawer.value}
        uploading={uploading}
        onClose={uploadDrawer.onFalse}
        onDownloadTemplate={handleDownloadTemplate}
        onUpload={handleUpload}
      />
    </>
  );
}

type JobsUploadTemplateDrawerProps = {
  open: boolean;
  uploading: boolean;
  onClose: () => void;
  onDownloadTemplate: () => void;
  onUpload: (file: File) => Promise<void>;
};

function JobsUploadTemplateDrawer({
  open,
  uploading,
  onClose,
  onDownloadTemplate,
  onUpload,
}: JobsUploadTemplateDrawerProps) {
  const { t } = useTranslate('business');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setError(null);
    }
  }, [open]);

  const accept = useMemo(
    () => ({
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    }),
    []
  );

  const handleDropRejected = useCallback(
    (rejections: FileRejection[]) => {
      const first = rejections[0];
      const firstError = first?.errors?.[0];
      const code = firstError?.code;

      if (code === 'too-many-files') {
        const msg = t('positions.table.uploadDrawer.errors.tooManyFiles', {
          defaultValue: 'Solo se permite 1 archivo.',
        });
        setError(msg);
        toast.error(msg);
        return;
      }

      if (code === 'file-invalid-type') {
        const msg = t('positions.table.uploadDrawer.errors.invalidType', {
          defaultValue: 'Formato no permitido. Usa .xlsx o .xls.',
        });
        setError(msg);
        toast.error(msg);
        return;
      }

      const msg = t('positions.table.uploadDrawer.errors.generic', {
        defaultValue: 'No se pudo cargar el archivo. Intenta nuevamente.',
      });
      setError(msg);
      toast.error(msg);
    },
    [t]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    multiple: false,
    maxFiles: 1,
    accept,
    disabled: uploading,
    onDropAccepted: (files) => {
      setFile(files[0] ?? null);
      setError(null);
    },
    onDropRejected: handleDropRejected,
  });

  const handleClose = useCallback(() => {
    if (!uploading) onClose();
  }, [onClose, uploading]);

  const handleConfirmUpload = useCallback(async () => {
    if (!file) {
      const msg = t('positions.table.uploadDrawer.errors.noFile', { defaultValue: 'Selecciona un archivo.' });
      setError(msg);
      toast.error(msg);
      return;
    }
    try {
      await onUpload(file);
      onClose();
    } catch {
      const msg = t('positions.table.uploadDrawer.errors.generic', {
        defaultValue: 'No se pudo cargar el archivo. Intenta nuevamente.',
      });
      setError(msg);
    }
  }, [file, onClose, onUpload, t]);

  return (
    <Drawer
      open={open}
      anchor="right"
      onClose={handleClose}
      PaperProps={{ sx: { width: { xs: 1, sm: 520, md: 620 }, display: 'flex', flexDirection: 'column' } }}
    >
      <Box sx={{ px: 3, py: 2, position: 'relative', borderBottom: (theme) => `1px solid ${theme.vars.palette.divider}` }}>
        <Typography variant="h6">
          {t('positions.table.uploadDrawer.title', { defaultValue: 'Cargar cargos por Lote' })}
        </Typography>
        <IconButton
          aria-label={t('positions.table.uploadDrawer.actions.close', { defaultValue: 'Cerrar' })}
          onClick={handleClose}
          disabled={uploading}
          sx={{ position: 'absolute', right: 12, top: 12 }}
        >
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </Box>

      <Box sx={{ px: 3, py: 2.5, overflow: 'auto', flex: '1 1 auto' }}>
        <Box
          sx={[
            (theme) => ({
              display: 'grid',
              gap: 1,
              p: 2,
              borderRadius: 1.5,
              border: `1px solid ${varAlpha(theme.vars.palette.info.mainChannel, 0.28)}`,
              backgroundColor: varAlpha(theme.vars.palette.info.mainChannel, 0.1),
              color: theme.vars.palette.info.darker,
            }),
          ]}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Iconify icon="solar:info-circle-bold" />
            <Typography variant="subtitle2">
              {t('positions.table.uploadDrawer.instructions.title', { defaultValue: 'Instrucciones' })}
            </Typography>
          </Stack>

          <Box
            component="ul"
            sx={{
              m: 0,
              pl: 2,
              display: 'grid',
              gap: 0.5,
              typography: 'body2',
              color: 'text.secondary',
            }}
          >
            <li>
              <Typography variant="body2" color="text.secondary">
                {t('positions.table.uploadDrawer.instructions.step1', {
                  defaultValue: 'Descarga la plantilla Excel con el formato requerido.',
                })}
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                {t('positions.table.uploadDrawer.instructions.step2', {
                  defaultValue: 'Completa el archivo con las columnas: CODIGO_CARGO, NOMBRE_CARGO, CODIGO_CARGO_PADRE.',
                })}
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                {t('positions.table.uploadDrawer.instructions.step3', {
                  defaultValue: 'Guarda el archivo sin espacios ni caracteres especiales en el nombre.',
                })}
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                {t('positions.table.uploadDrawer.instructions.step4', {
                  defaultValue: 'Arrastra y suelta el archivo o haz clic para seleccionarlo.',
                })}
              </Typography>
            </li>
          </Box>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Box
            {...getRootProps()}
            sx={[
              (theme) => ({
                p: 4,
                borderRadius: 2,
                textAlign: 'center',
                outline: 'none',
                cursor: uploading ? 'default' : 'pointer',
                border: `dashed 1px ${theme.vars.palette.divider}`,
                backgroundColor: theme.vars.palette.background.neutral,
                transition: theme.transitions.create(['border-color', 'background-color'], {
                  duration: theme.transitions.duration.shorter,
                }),
                ...(isDragActive && {
                  borderColor: theme.vars.palette.primary.main,
                  backgroundColor: varAlpha(theme.vars.palette.primary.mainChannel, 0.08),
                }),
                ...((isDragReject || !!error) && {
                  borderColor: theme.vars.palette.error.main,
                  backgroundColor: varAlpha(theme.vars.palette.error.mainChannel, 0.08),
                }),
              }),
            ]}
          >
            <input {...getInputProps()} />

            <Stack spacing={1.25} alignItems="center">
              <Iconify icon="eva:cloud-upload-fill" width={28} />

              <Typography variant="subtitle1">
                {file
                  ? t('positions.table.uploadDrawer.drop.selectedTitle', { defaultValue: 'Archivo seleccionado' })
                  : t('positions.table.uploadDrawer.drop.title', { defaultValue: 'Seleccionar archivo Excel' })}
              </Typography>

              {file ? (
                <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {file.name}
                  </Typography>
                  <Button
                    size="small"
                    variant="text"
                    onClick={(event) => {
                      event.stopPropagation();
                      setFile(null);
                      setError(null);
                    }}
                    disabled={uploading}
                    sx={{ textTransform: 'none' }}
                  >
                    {t('positions.table.uploadDrawer.actions.remove', { defaultValue: 'Quitar' })}
                  </Button>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t('positions.table.uploadDrawer.drop.subtitle', {
                    defaultValue: 'o haz clic para seleccionar desde tu dispositivo',
                  })}
                </Typography>
              )}

              <Typography variant="caption" color="text.disabled">
                {t('positions.table.uploadDrawer.drop.formats', {
                  defaultValue: 'Formatos permitidos: .xlsx, .xls • 1 archivo',
                })}
              </Typography>
            </Stack>
          </Box>

          {!!error && (
            <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 1 }}>
              {error}
            </Typography>
          )}

          <Button
            variant="outlined"
            startIcon={<Iconify icon="eva:cloud-download-fill" />}
            onClick={onDownloadTemplate}
            disabled={uploading}
            sx={{ mt: 1.5, width: 1 }}
          >
            {t('positions.table.actions.downloadTemplate', { defaultValue: 'Descargar Plantilla' })}
          </Button>
        </Box>
      </Box>

      <Box sx={{ px: 3, py: 2, borderTop: (theme) => `1px solid ${theme.vars.palette.divider}`, display: 'flex', justifyContent: 'flex-end', gap: 1.25 }}>
        <Button onClick={handleClose} disabled={uploading} color="inherit" variant="outlined">
          {t('positions.table.uploadDrawer.actions.cancel', { defaultValue: 'Cancelar' })}
        </Button>
        <LoadingButton variant="contained" loading={uploading} onClick={handleConfirmUpload} disabled={!file}>
          {t('positions.table.uploadDrawer.actions.upload', { defaultValue: 'Cargar' })}
        </LoadingButton>
      </Box>
    </Drawer>
  );
}
