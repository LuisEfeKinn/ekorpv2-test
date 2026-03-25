'use client';

import type { FileRejection } from 'react-dropzone';
import type { Theme, SxProps } from '@mui/material/styles';

import { useDropzone } from 'react-dropzone';
import { varAlpha } from 'minimal-shared/utils';
import { useBoolean } from 'minimal-shared/hooks';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import {
  UploadProcessService,
  GetProcessFlowService,
  DownloadProcessTemplateService,
} from 'src/services/architecture/process/processTable.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ProcessesFlow, type ProcessFlowNode } from '../processes-flow';
import { ProcessCreateEditDrawer } from '../process-create-edit-drawer';

// ----------------------------------------------------------------------

type ProcessesFlowViewProps = {
  sx?: SxProps<Theme>;
};

// ----------------------------------------------------------------------

export function ProcessesFlowView({ sx }: ProcessesFlowViewProps) {
  const { t } = useTranslate('architecture');
  const createEditDrawer = useBoolean();
  const uploadDrawer = useBoolean();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProcessFlowNode[]>([]);
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [reloadKey, setReloadKey] = useState(0);
  const [uploading, setUploading] = useState(false);

  const [history, setHistory] = useState<ProcessFlowNode[]>([]);

  const requestIdRef = useRef(0);

  const openCreate = useCallback(() => {
    setEditingId(undefined);
    createEditDrawer.onTrue();
  }, [createEditDrawer]);

  const openEdit = useCallback((id: number) => {
    setEditingId(id);
    createEditDrawer.onTrue();
  }, [createEditDrawer]);

  const handleSaved = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  const loadData = useCallback(async () => {
    const requestId = (requestIdRef.current += 1);
    try {
      setLoading(true);
      const response = await GetProcessFlowService();
      if (requestId !== requestIdRef.current) return;

      const nextData = Array.isArray(response?.data) ? response.data : [];
      setData(nextData);
    } catch (error) {
      console.error('Error loading process flow:', error);
      if (requestId !== requestIdRef.current) return;
      setData([]);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, reloadKey]);

  const handleNodeDoubleClick = useCallback((node: ProcessFlowNode) => {
    setHistory((prev) => [...prev, node]);
  }, []);

  const handleGoBack = useCallback(() => {
    setHistory((prev) => prev.slice(0, -1));
  }, []);

  const handleResetView = useCallback(() => {
    setHistory([]);
  }, []);

  const handleDownloadTemplate = useCallback(async () => {
    try {
      const response = await DownloadProcessTemplateService();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Process_Template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(
        t('process.table.messages.success.downloaded', { defaultValue: 'Template downloaded successfully' })
      );
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error(t('process.table.messages.error.downloading', { defaultValue: 'Error downloading template' }));
    }
  }, [t]);

  const handleUploadExcel = useCallback(
    async (file: File) => {
      try {
        setUploading(true);
        await UploadProcessService(file);
        toast.success(t('process.table.messages.success.uploaded', { defaultValue: 'Uploaded successfully' }));
        setReloadKey((k) => k + 1);
      } catch (error) {
        console.error('Error uploading processes file:', error);
        toast.error(t('process.table.messages.error.uploading', { defaultValue: 'Error uploading file' }));
        throw error;
      } finally {
        setUploading(false);
      }
    },
    [t]
  );

  const focusedNode = history.length > 0 ? history[history.length - 1] : null;

  const visibleData = useMemo(() => {
    if (focusedNode) {
      // If we are focused on a node, we show its children as roots
      return focusedNode.children || [];
    }
    // Otherwise we show the root data
    return data;
  }, [data, focusedNode]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Container maxWidth="xl">
        <Stack spacing={3}>
          <CustomBreadcrumbs
            heading={t('process.table.title')}
            links={[
              {
                name: t('process.table.breadcrumbs.dashboard'),
                href: paths.dashboard.root,
              },
              {
                name: t('process.table.title'),
                href: paths.dashboard.architecture.processesTable,
              },
              {
                name: t('process.map.title'),
                onClick: history.length > 0 ? handleResetView : undefined,
              },
              ...history.map((node, index) => ({
                name: node.data.name || node.label,
                onClick:
                  index < history.length - 1
                    ? () => setHistory((prev) => prev.slice(0, index + 1))
                    : undefined,
              })),
            ]}
            action={
              <Stack direction="row" spacing={1}>
                <Button
                  href={paths.dashboard.architecture.processesTable}
                  variant="outlined"
                  startIcon={<Iconify icon="solar:list-bold" />}
                >
                  {t('process.table.title')}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Iconify icon="eva:cloud-upload-fill" />}
                  onClick={uploadDrawer.onTrue}
                >
                  {t('process.table.actions.upload') || 'Cargar'}
                </Button>
                <Button
                  onClick={openCreate}
                  variant="contained"
                  startIcon={<Iconify icon="mingcute:add-line" />}
                >
                  {t('process.table.actions.add')}
                </Button>
              </Stack>
            }
            sx={{
              mb: { xs: 2, md: 3 },
            }}
          />

        {visibleData.length > 0 ? (
            <ProcessesFlow
                data={visibleData}
                onEditProcess={openEdit}
                onNodeDoubleClick={handleNodeDoubleClick}
                reloadKey={reloadKey}
                sx={sx}
                onBack={history.length > 0 ? handleGoBack : undefined}
                parentLabel={focusedNode ? (focusedNode.data.name || focusedNode.label) : undefined}
            />
        ) : (
             <EmptyContent title={t('process.table.table.emptyState.noData')} />
        )}
        </Stack>

        <ProcessCreateEditDrawer
          open={createEditDrawer.value}
          onClose={createEditDrawer.onFalse}
          processId={editingId}
          onSaved={handleSaved}
        />
      </Container>

      <ProcessUploadTemplateDrawer
        open={uploadDrawer.value}
        uploading={uploading}
        onClose={uploadDrawer.onFalse}
        onDownloadTemplate={handleDownloadTemplate}
        onUpload={handleUploadExcel}
      />
    </>
  );
}

type ProcessUploadTemplateDrawerProps = {
  open: boolean;
  uploading: boolean;
  onClose: () => void;
  onDownloadTemplate: () => void;
  onUpload: (file: File) => Promise<void>;
};

function ProcessUploadTemplateDrawer({
  open,
  uploading,
  onClose,
  onDownloadTemplate,
  onUpload,
}: ProcessUploadTemplateDrawerProps) {
  const { t } = useTranslate('architecture');
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
        const msg = t('process.table.uploadDrawer.errors.tooManyFiles', { defaultValue: 'Solo se permite 1 archivo.' });
        setError(msg);
        toast.error(msg);
        return;
      }

      if (code === 'file-invalid-type') {
        const msg = t('process.table.uploadDrawer.errors.invalidType', {
          defaultValue: 'Formato no permitido. Usa .xlsx o .xls.',
        });
        setError(msg);
        toast.error(msg);
        return;
      }

      const msg = t('process.table.uploadDrawer.errors.generic', {
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
      const msg = t('process.table.uploadDrawer.errors.noFile', { defaultValue: 'Selecciona un archivo.' });
      setError(msg);
      toast.error(msg);
      return;
    }

    try {
      await onUpload(file);
      onClose();
    } catch {
      const msg = t('process.table.uploadDrawer.errors.generic', {
        defaultValue: 'No se pudo cargar el archivo. Intenta nuevamente.',
      });
      setError(msg);
      toast.error(msg);
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
          {t('process.table.uploadDrawer.title', { defaultValue: 'Cargar procesos por Lote' })}
        </Typography>
        <IconButton
          aria-label={t('process.table.uploadDrawer.actions.close', { defaultValue: 'Cerrar' })}
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
              {t('process.table.uploadDrawer.instructions.title', { defaultValue: 'Instrucciones' })}
            </Typography>
          </Stack>

          <Box
            component="div"
            sx={{
              m: 0,
              display: 'grid',
              gap: 0.5,
              typography: 'body2',
              color: 'text.secondary',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {t('process.table.uploadDrawer.instructions.description', {
                defaultValue: 'Siga las siguientes instrucciones para cargar la plantilla de procesos:',
              })}
            </Typography>
            <Box component="ol" sx={{ m: 0, pl: 2, display: 'grid', gap: 0.5 }}>
              <li>
                <Typography variant="body2" color="text.secondary">
                  {t('process.table.uploadDrawer.instructions.step1', {
                    defaultValue: 'Descarga la plantilla Excel con el formato requerido.',
                  })}
                </Typography>
              </li>
              <li>
                <Typography variant="body2" color="text.secondary">
                  {t('process.table.uploadDrawer.instructions.step2', {
                    defaultValue: 'Completa el archivo y guárdalo sin espacios ni caracteres especiales en el nombre.',
                  })}
                </Typography>
              </li>
              <li>
                <Typography variant="body2" color="text.secondary">
                  {t('process.table.uploadDrawer.instructions.step3', {
                    defaultValue:
                      "Puede arrastrar y soltar el archivo guardado en el cuadro a continuación, o seleccionarlo mediante el botón 'Seleccionar archivo'.",
                  })}
                </Typography>
              </li>
              <li>
                <Typography variant="body2" color="text.secondary">
                  {t('process.table.uploadDrawer.instructions.step4', {
                    defaultValue: "Haga clic en el botón 'Cargar' para iniciar el proceso de cargue.",
                  })}
                </Typography>
              </li>
            </Box>
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
                  ? t('process.table.uploadDrawer.drop.selectedTitle', { defaultValue: 'Archivo seleccionado' })
                  : t('process.table.uploadDrawer.drop.title', { defaultValue: 'Seleccionar archivo Excel' })}
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
                    {t('process.table.uploadDrawer.actions.remove', { defaultValue: 'Quitar' })}
                  </Button>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t('process.table.uploadDrawer.drop.subtitle', {
                    defaultValue: 'o haz clic para seleccionar desde tu dispositivo',
                  })}
                </Typography>
              )}

              <Typography variant="caption" color="text.disabled">
                {t('process.table.uploadDrawer.drop.formats', {
                  defaultValue: 'Formatos permitidos: .xlsx, .xls • 1 archivo',
                })}
              </Typography>

              {!!error && (
                <Typography
                  variant="caption"
                  color="error.main"
                  sx={{ whiteSpace: 'pre-line', alignSelf: 'stretch', textAlign: 'left' }}
                >
                  {error}
                </Typography>
              )}
            </Stack>
          </Box>

          <Button
            variant="outlined"
            startIcon={<Iconify icon="eva:cloud-download-fill" />}
            onClick={onDownloadTemplate}
            disabled={uploading}
            sx={{ mt: 1.5, width: 1 }}
          >
            {t('process.table.actions.downloadTemplate', { defaultValue: 'Descargar Plantilla' })}
          </Button>
        </Box>
      </Box>

      <Box sx={{ px: 3, py: 2, borderTop: (theme) => `1px solid ${theme.vars.palette.divider}`, display: 'flex', justifyContent: 'flex-end', gap: 1.25 }}>
        <Button onClick={handleClose} disabled={uploading} color="inherit" variant="outlined">
          {t('process.table.uploadDrawer.actions.cancel', { defaultValue: 'Cancelar' })}
        </Button>
        <LoadingButton variant="contained" loading={uploading} onClick={handleConfirmUpload} disabled={!file}>
          {t('process.table.uploadDrawer.actions.upload', { defaultValue: 'Cargar' })}
        </LoadingButton>
      </Box>
    </Drawer>
  );
}
