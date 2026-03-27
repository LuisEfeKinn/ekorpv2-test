'use client';

import type { Theme, SxProps } from '@mui/material/styles';

import { varAlpha } from 'minimal-shared/utils';
import { useBoolean } from 'minimal-shared/hooks';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { UploadJobsService, DownloadJobsTemplateService } from 'src/services/architecture/business/jobs.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { JobsMapDiagram } from '../jobs-map-diagram';

type Props = { id: string };

export function JobsMapView({ id, sx, ...other }: Props & { sx?: SxProps<Theme> }) {
  const { t } = useTranslate('business');
  const settings = useSettingsContext();
  const uploadDrawer = useBoolean();
  const [uploading, setUploading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

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
        setReloadKey((prev) => prev + 1);
      } catch (error) {
        console.error(error);
        toast.error(t('positions.table.messages.uploadError') || 'Error uploading file');
      } finally {
        setUploading(false);
      }
    },
    [t]
  );

  return (
    <Container
      maxWidth={settings.state.compactLayout ? 'xl' : false}
      sx={{ display: 'flex', flexDirection: 'column', py: 0, px: { xs: 2, sm: 3, md: 4 }, ...sx }}
      {...other}
    >
      <CustomBreadcrumbs
        heading={t('positions.title')}
        links={[
          { name: t('positions.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('positions.breadcrumbs.positions'), href: paths.dashboard.architecture.positionsTable },
          { name: t('positions.breadcrumbs.map') },
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
            <Button
              variant="outlined"
              startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
              onClick={() => {
                window.location.href = paths.dashboard.architecture.positionsTable;
              }}
            >
              {t('positions.back')}
            </Button>
          </Stack>
        }
        sx={{ mb: 3 }}
      />

      <Box
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pb: { xs: 8, sm: 10, md: 12 },
        }}
      >
        <JobsMapDiagram key={reloadKey} jobId={String(id)} />
      </Box>

      <JobsUploadTemplateDrawer
        open={uploadDrawer.value}
        uploading={uploading}
        onClose={uploadDrawer.onFalse}
        onDownloadTemplate={handleDownloadTemplate}
        onUpload={handleUpload}
      />
    </Container>
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
      <Box sx={{ px: 3, py: 2, position: 'relative', borderBottom: (theme2) => `1px solid ${theme2.vars.palette.divider}` }}>
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
            (theme2) => ({
              display: 'grid',
              gap: 1,
              p: 2,
              borderRadius: 1.5,
              border: `1px solid ${varAlpha(theme2.vars.palette.info.mainChannel, 0.28)}`,
              backgroundColor: varAlpha(theme2.vars.palette.info.mainChannel, 0.1),
              color: theme2.vars.palette.info.darker,
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
                  defaultValue: 'Completa la información y guarda el archivo.',
                })}
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                {t('positions.table.uploadDrawer.instructions.step3', {
                  defaultValue: 'Selecciona el archivo y luego haz clic en “Cargar”.',
                })}
              </Typography>
            </li>
          </Box>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Box
            {...getRootProps()}
            sx={[
              (theme2) => ({
                p: 3,
                borderRadius: 2,
                cursor: uploading ? 'not-allowed' : 'pointer',
                border: `1px dashed ${theme2.vars.palette.divider}`,
                bgcolor: theme2.vars.palette.background.neutral,
                ...(isDragActive && { borderColor: theme2.vars.palette.primary.main }),
                ...(isDragReject && { borderColor: theme2.vars.palette.error.main }),
              }),
            ]}
          >
            <input {...getInputProps()} />
            <Stack spacing={1.5} alignItems="center">
              <Iconify icon="eva:cloud-upload-fill" width={32} />
              <Typography variant="subtitle2">
                {t('positions.table.uploadDrawer.drop.title', { defaultValue: 'Arrastra y suelta el archivo aquí' })}
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
            {t('positions.table.actions.downloadTemplate', { defaultValue: 'Descargar Plantilla' })}
          </Button>
        </Box>
      </Box>

      <Box sx={{ px: 3, py: 2, borderTop: (theme2) => `1px solid ${theme2.vars.palette.divider}`, display: 'flex', justifyContent: 'flex-end', gap: 1.25 }}>
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
