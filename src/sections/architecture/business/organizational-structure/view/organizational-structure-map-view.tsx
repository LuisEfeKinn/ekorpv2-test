'use client';

import type { Theme, SxProps } from '@mui/material/styles';
import type { OrganizationalUnitFlowNode } from 'src/services/organization/organizationalUnit.service';

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
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { UploadOrganizationalUnitService , GetOrganizationalUnitFlowService, DownloadOrganizationalUnitTemplateService } from 'src/services/organization/organizationalUnit.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { useSettingsContext } from 'src/components/settings';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { ZoomPanWrapper } from 'src/components/zoom-pan-wrapper/zoom-pan-wrapper';
import { OrganizationalChart } from 'src/components/organizational-chart/organizational-chart';

import { OrganizationalStructureDiagram } from '../organizational-structure-diagram';
import {
  OrganizationalUnitChartNode,
  type OrganizationalUnitChartNodeProps,
} from '../organizational-structure-chart-node';

type Props = { id?: string };

type FlowResponse = { data?: unknown };

const normalizeFlowData = (raw: unknown): OrganizationalUnitFlowNode[] => {
  if (Array.isArray(raw)) {
    return raw.filter((item) => item && typeof item === 'object') as OrganizationalUnitFlowNode[];
  }
  if (raw && typeof raw === 'object' && Array.isArray((raw as FlowResponse).data)) {
    return ((raw as FlowResponse).data as OrganizationalUnitFlowNode[]).filter(
      (item) => item && typeof item === 'object'
    );
  }
  return [];
};

const normalizeFlowChildren = (nodes: OrganizationalUnitFlowNode[]): OrganizationalUnitChartNodeProps[] =>
  nodes
    .filter((node) => node && typeof node === 'object')
    .map((node) => ({
      ...node,
      name: node.data?.name || node.label || '',
      children: normalizeFlowChildren(node.children ?? []),
      hasChildren: (node.children?.length ?? 0) > 0,
    }));

const formatUploadErrorDetails = (details: unknown): string[] => {
  if (!details) return [];
  if (typeof details === 'string') return [details];
  if (Array.isArray(details)) return details.map((d) => String(d)).filter(Boolean);
  if (typeof details === 'object') {
    const record = details as Record<string, unknown>;
    const message = record.message;
    if (typeof message === 'string' && message.trim()) return [message];
    const errors = record.errors;
    if (Array.isArray(errors)) return errors.map((e) => String(e)).filter(Boolean);
  }
  return [];
};

const getUploadErrorMessage = (error: unknown): string => {
  const parseJson = (value: unknown): unknown => {
    if (typeof value !== 'string') return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  const parsed = parseJson(error);
  if (parsed) return getUploadErrorMessage(parsed);

  const errRecord = error && typeof error === 'object' ? (error as Record<string, unknown>) : null;

  const axiosResponse = errRecord?.response as Record<string, unknown> | undefined;
  const responseData = axiosResponse?.data as Record<string, unknown> | undefined;

  const rawDetails =
    responseData?.details ??
    responseData?.message ??
    responseData?.error ??
    errRecord?.message ??
    error;

  const detailLines = formatUploadErrorDetails(rawDetails);
  const normalizedMsg =
    typeof responseData?.message === 'string'
      ? responseData.message
      : typeof errRecord?.message === 'string'
        ? String(errRecord.message)
        : typeof error === 'string'
          ? error
          : null;

  const statusCode =
    typeof responseData?.statusCode === 'number'
      ? responseData.statusCode
      : typeof axiosResponse?.status === 'number'
        ? axiosResponse.status
        : null;

  const base =
    normalizedMsg ??
    (statusCode === 400 ? 'Archivo inválido o plantilla incorrecta.' : 'No se pudo cargar el archivo. Intenta nuevamente.');
  if (!detailLines.length) return base;

  const maxLines = 8;
  const shown = detailLines.slice(0, maxLines);
  const rest = detailLines.length - shown.length;
  const suffix = rest > 0 ? [`…y ${rest} más.`] : [];

  return [base, ...shown, ...suffix].join('\n');
};

export function OrganizationalStructureMapView({ id, sx, ...other }: Props & { sx?: SxProps<Theme> }) {
  const { t, currentLang } = useTranslate('organization');
  const settings = useSettingsContext();
  const organizationalUnitId = id ?? '';
  const hasOrganizationalUnitId = Boolean(id);
  const theme = useTheme();
  
  const divider = theme.palette?.divider || '#000000';
  const primaryLight = theme.palette?.primary?.light || '#000000';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OrganizationalUnitChartNodeProps[]>([]);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<OrganizationalUnitChartNodeProps[]>([]);
  const uploadDrawer = useBoolean();
  const [uploading, setUploading] = useState(false);

  const focusedNode = history.length > 0 ? history[history.length - 1] : null;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await GetOrganizationalUnitFlowService();
      const list = normalizeFlowChildren(normalizeFlowData(response?.data));
      setData(list);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasOrganizationalUnitId) {
      setLoading(false);
      return;
    }

    loadData();
  }, [hasOrganizationalUnitId, loadData]);

  const handleDownloadTemplate = useCallback(async () => {
    try {
      const response = await DownloadOrganizationalUnitTemplateService(currentLang.value);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'organizational_unit_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(error);
      toast.error(t('organization.actions.downloadError'));
    }
  }, [currentLang.value, t]);

  const handleUpload = useCallback(
    async (file: File) => {
      try {
        setUploading(true);
        await UploadOrganizationalUnitService(file);
        toast.success(t('organization.actions.uploadSuccess'));
        loadData();
      } catch (error) {
        console.error(error);
        throw new Error(getUploadErrorMessage(error));
      } finally {
        setUploading(false);
      }
    },
    [loadData, t]
  );

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

  const handleNodeDoubleClick = useCallback((node: OrganizationalUnitChartNodeProps) => {
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

  const visibleData = useMemo(() => {
    const applyCollapsed = (nodes: OrganizationalUnitChartNodeProps[]): OrganizationalUnitChartNodeProps[] =>
      nodes.map((node) => ({
        ...node,
        children: collapsedNodes.has(String(node.id)) ? [] : applyCollapsed(node.children),
      }));

    if (focusedNode) {
      return applyCollapsed([focusedNode]);
    }

    return applyCollapsed(data);
  }, [collapsedNodes, data, focusedNode]);

  return (
    <Container
      maxWidth={settings.state.compactLayout ? 'xl' : false}
      sx={{ display: 'flex', flexDirection: 'column', py: 0, px: { xs: 2, sm: 3, md: 4 }, ...sx }}
      {...other}
    >
      <CustomBreadcrumbs
        heading={t('organization.view.mapTitle')}
        links={[
          { name: t('organization.view.dashboard'), href: paths.dashboard.root },
          {
            name: t('organization.view.list'),
            href: paths.dashboard.architecture.organizationalStructureTable,
          },
          { name: t('organization.view.map'), onClick: history.length > 0 ? handleResetView : undefined },
          ...history.map((node, index) => ({
            name: node.name,
            onClick: index < history.length - 1 
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
              {t('organization.actions.uploadTemplate', { defaultValue: 'Cargar plantilla' })}
            </Button>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
              onClick={() => {
                if (history.length > 0) {
                  handleGoBack();
                } else {
                  window.location.href = paths.dashboard.architecture.organizationalStructureTable;
                }
              }}
            >
              {t('organization.view.back')}
            </Button>
          </Stack>
        }
        sx={{ mb: 3 }}
      />

      {hasOrganizationalUnitId ? (
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pb: { xs: 8, sm: 10, md: 12 },
          }}
        >
          <OrganizationalStructureDiagram organizationalUnitId={organizationalUnitId} />
        </Box>
      ) : (
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pb: { xs: 8, sm: 10, md: 12 },
          }}
        >
          <Box
            sx={{
              width: '100%',
              height: '75vh',
              borderRadius: 2,
              overflow: 'hidden',
              bgcolor: 'background.neutral',
              border: `1px dashed ${divider}`,
            }}
          >
            {loading ? (
              <LoadingScreen />
            ) : data.length === 0 ? (
              <Box sx={{ py: 6 }}>
                <EmptyContent title={t('organization.map.noData')} />
              </Box>
            ) : (
              <ZoomPanWrapper fitOnInit>
                <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-start', pt: 5, px: 3 }}>
                  {visibleData.map((rootNode) => (
                    <Box key={rootNode.id} sx={{ flexShrink: 0 }}>
                      <OrganizationalChart
                        data={rootNode}
                        lineColor={primaryLight}
                        nodeItem={(props: OrganizationalUnitChartNodeProps) => (
                          <OrganizationalUnitChartNode
                            node={props}
                            isCollapsed={collapsedNodes.has(String(props.id))}
                            onToggleCollapse={() => handleToggleCollapse(String(props.id))}
                            onDoubleClick={() => handleNodeDoubleClick(props)}
                          />
                        )}
                      />
                    </Box>
                  ))}
                </Box>
              </ZoomPanWrapper>
            )}
          </Box>
        </Box>
      )}

      <OrganizationalStructureUploadTemplateDrawer
        open={uploadDrawer.value}
        uploading={uploading}
        onClose={uploadDrawer.onFalse}
        onDownloadTemplate={handleDownloadTemplate}
        onUpload={handleUpload}
      />
    </Container>
  );
}

type OrganizationalStructureUploadTemplateDrawerProps = {
  open: boolean;
  uploading: boolean;
  onClose: () => void;
  onDownloadTemplate: () => void;
  onUpload: (file: File) => Promise<void>;
};

function OrganizationalStructureUploadTemplateDrawer({
  open,
  uploading,
  onClose,
  onDownloadTemplate,
  onUpload,
}: OrganizationalStructureUploadTemplateDrawerProps) {
  const { t } = useTranslate('organization');
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
        const msg = t('organization.uploadDrawer.errors.tooManyFiles', { defaultValue: 'Solo se permite 1 archivo.' });
        setError(msg);
        toast.error(msg);
        return;
      }

      if (code === 'file-invalid-type') {
        const msg = t('organization.uploadDrawer.errors.invalidType', {
          defaultValue: 'Formato no permitido. Usa .xlsx o .xls.',
        });
        setError(msg);
        toast.error(msg);
        return;
      }

      const msg = t('organization.uploadDrawer.errors.generic', {
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
      const msg = t('organization.uploadDrawer.errors.noFile', { defaultValue: 'Selecciona un archivo.' });
      setError(msg);
      toast.error(msg);
      return;
    }
    try {
      await onUpload(file);
      onClose();
    } catch (uploadError) {
      const msg = uploadError instanceof Error ? uploadError.message : getUploadErrorMessage(uploadError);
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
      <Box sx={{ px: 3, py: 2, position: 'relative', borderBottom: (theme2) => `1px solid ${theme2.vars.palette.divider}` }}>
        <Typography variant="h6">
          {t('organization.uploadDrawer.title', { defaultValue: 'Cargar estructura organizacional por lote' })}
        </Typography>
        <IconButton
          aria-label={t('organization.uploadDrawer.actions.close', { defaultValue: 'Cerrar' })}
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
              {t('organization.uploadDrawer.instructions.title', { defaultValue: 'Instrucciones' })}
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
                {t('organization.uploadDrawer.instructions.step1', {
                  defaultValue: 'Descarga la plantilla Excel con el formato requerido.',
                })}
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                {t('organization.uploadDrawer.instructions.step2', {
                  defaultValue: 'Completa la información y guarda el archivo.',
                })}
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                {t('organization.uploadDrawer.instructions.step3', {
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
                {t('organization.uploadDrawer.drop.title', { defaultValue: 'Arrastra y suelta el archivo aquí' })}
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
                    {t('organization.uploadDrawer.actions.remove', { defaultValue: 'Quitar' })}
                  </Button>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t('organization.uploadDrawer.drop.subtitle', {
                    defaultValue: 'o haz clic para seleccionar desde tu dispositivo',
                  })}
                </Typography>
              )}

              <Typography variant="caption" color="text.disabled">
                {t('organization.uploadDrawer.drop.formats', {
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
            {t('organization.actions.downloadTemplate', { defaultValue: 'Descargar Plantilla' })}
          </Button>
        </Box>
      </Box>

      <Box sx={{ px: 3, py: 2, borderTop: (theme2) => `1px solid ${theme2.vars.palette.divider}`, display: 'flex', justifyContent: 'flex-end', gap: 1.25 }}>
        <Button onClick={handleClose} disabled={uploading} color="inherit" variant="outlined">
          {t('organization.uploadDrawer.actions.cancel', { defaultValue: 'Cancelar' })}
        </Button>
        <LoadingButton variant="contained" loading={uploading} onClick={handleConfirmUpload} disabled={!file}>
          {t('organization.uploadDrawer.actions.upload', { defaultValue: 'Cargar' })}
        </LoadingButton>
      </Box>
    </Drawer>
  );
}
