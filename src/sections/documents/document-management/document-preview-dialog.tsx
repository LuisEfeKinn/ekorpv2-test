'use client';

import type { DocumentItem } from 'src/services/documents/documents.service';

import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import { DownloadDocumentService, GetDocumentPreviewUrlService } from 'src/services/documents/documents.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { getFileMeta } from 'src/components/file-thumbnail';

type PreviewKind = 'image' | 'pdf' | 'video' | 'audio' | 'text' | 'office' | 'unknown';

const normalizeLink = (rawLink: string): string => rawLink.replaceAll('`', '').trim();

const getPreviewKindFromUrl = (urlOrName: string): PreviewKind => {
  const meta = getFileMeta(urlOrName);
  if (meta.format === 'image') return 'image';
  if (meta.format === 'video') return 'video';
  if (meta.format === 'audio') return 'audio';
  if (meta.format === 'pdf') return 'pdf';
  if (meta.format === 'txt') return 'text';
  if (meta.format === 'word' || meta.format === 'excel' || meta.format === 'powerpoint') return 'office';
  return 'unknown';
};

const openUrlInNewTab = (url: string) => {
  window.open(url, '_blank', 'noopener,noreferrer');
};

const downloadBlob = (blob: Blob, fileName: string) => {
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = fileName;
  link.rel = 'noreferrer';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
};

type Props = {
  open: boolean;
  documentId: number | null;
  fileName: string;
  onClose: () => void;
};

export function DocumentPreviewDialog({ open, documentId, fileName, onClose }: Props) {
  const { t } = useTranslate('documents');

  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewKind, setPreviewKind] = useState<PreviewKind>('unknown');

  const normalizedUrl = useMemo(() => normalizeLink(previewUrl), [previewUrl]);
  const officeEmbedUrl = useMemo(() => {
    if (!normalizedUrl) return '';
    const src = encodeURIComponent(normalizedUrl);
    return `https://view.officeapps.live.com/op/embed.aspx?src=${src}`;
  }, [normalizedUrl]);

  const loadPreviewUrl = useCallback(async () => {
    if (!documentId) return;
    setLoading(true);
    try {
      const res = await GetDocumentPreviewUrlService(documentId);
      const url = normalizeLink(res.data.url);
      if (!url) {
        toast.error(t('documentManagement.messages.error.preview'));
        setPreviewUrl('');
        setPreviewKind('unknown');
        return;
      }
      setPreviewUrl(url);
      setPreviewKind(getPreviewKindFromUrl(url || fileName));
    } catch {
      toast.error(t('documentManagement.messages.error.preview'));
      setPreviewUrl('');
      setPreviewKind('unknown');
    } finally {
      setLoading(false);
    }
  }, [documentId, fileName, t]);

  useEffect(() => {
    if (!open) return;
    void loadPreviewUrl();
  }, [loadPreviewUrl, open]);

  useEffect(() => {
    if (!open) {
      setLoading(false);
      setPreviewUrl('');
      setPreviewKind('unknown');
    }
  }, [open]);

  const handleDownload = useCallback(async () => {
    if (!documentId) return;
    try {
      const { blob, fileName: resolvedName } = await DownloadDocumentService(documentId, fileName);
      downloadBlob(blob, resolvedName);
    } catch {
      toast.error(t('documentManagement.messages.error.downloading'));
    }
  }, [documentId, fileName, t]);

  const handleOpen = useCallback(() => {
    if (!normalizedUrl) return;
    openUrlInNewTab(normalizedUrl);
  }, [normalizedUrl]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" noWrap>
            {t('documentManagement.dialogs.preview.title')}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {fileName}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Iconify icon="solar:download-bold" />}
          onClick={() => void handleDownload()}
          disabled={!documentId}
        >
          {t('documentManagement.actions.download')}
        </Button>
        <IconButton onClick={onClose}>
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320 }}>
            <CircularProgress />
          </Box>
        ) : normalizedUrl ? (
          <Box sx={{ height: '80vh', position: 'relative' }}>
            {previewKind === 'image' ? (
              <Box
                component="img"
                alt={fileName}
                src={normalizedUrl}
                sx={{ width: 1, height: 1, objectFit: 'contain', bgcolor: 'background.default' }}
              />
            ) : previewKind === 'video' ? (
              <Box sx={{ width: 1, height: 1, bgcolor: 'background.default', display: 'flex' }}>
                <video controls style={{ width: '100%', height: '100%' }}>
                  <source src={normalizedUrl} />
                </video>
              </Box>
            ) : previewKind === 'audio' ? (
              <Box sx={{ p: 3 }}>
                <audio controls style={{ width: '100%' }}>
                  <source src={normalizedUrl} />
                </audio>
              </Box>
            ) : previewKind === 'office' ? (
              <iframe
                title={fileName}
                src={officeEmbedUrl}
                style={{ border: 0, width: '100%', height: '100%' }}
              />
            ) : (
              <iframe title={fileName} src={normalizedUrl} style={{ border: 0, width: '100%', height: '100%' }} />
            )}

            {previewKind === 'unknown' && (
              <Box
                sx={{
                  position: 'absolute',
                  right: 16,
                  bottom: 16,
                  display: 'flex',
                  gap: 1,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 1,
                  alignItems: 'center',
                }}
              >
                <Button variant="outlined" size="small" onClick={handleOpen} disabled={!normalizedUrl}>
                  {t('documentManagement.actions.open')}
                </Button>
                <Button variant="contained" size="small" onClick={() => void handleDownload()}>
                  {t('documentManagement.actions.download')}
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  {t('documentManagement.messages.info.previewNotSupported')}
                </Typography>
              </Box>
            )}
          </Box>
        ) : (
          <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320 }}>
            <Typography variant="body2" color="text.secondary">
              {t('documentManagement.messages.error.preview')}
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

export const documentPreviewFileName = (row: DocumentItem): string =>
  row.originalFile || row.file || row.code || row.name || `#${row.id}`;
