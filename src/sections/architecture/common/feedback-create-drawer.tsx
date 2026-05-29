import { useDropzone } from 'react-dropzone';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import axios from 'src/utils/axios';

import { useTranslate } from 'src/locales';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title: string;
  onSubmit: (description: string) => Promise<void>;
  descriptionLabel?: string;
  descriptionPlaceholder?: string;
  initialDescription?: string;
  feedbackId?: string | number;
  objectiveId?: string | number;
  fileEntity?: 'objective' | 'organizational-unit' | 'document';
  fileEntityId?: string | number;
  isLessonLearned?: boolean;
  editMode?: boolean;
};

const MAX_VARCHAR_LENGTH = 255;

export function SharedFeedbackCreateDrawer({ 
  open, 
  onClose, 
  onSuccess, 
  title, 
  onSubmit,
  descriptionLabel,
  descriptionPlaceholder,
  initialDescription,
  feedbackId,
  objectiveId,
  fileEntity,
  fileEntityId,
  isLessonLearned,
  editMode
}: Props) {
  const { t } = useTranslate('architecture'); // Using architecture namespace as it seems common
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadedName, setUploadedName] = useState<string | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [downloadingFiles, setDownloadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resolvedEntity = fileEntity ?? (objectiveId ? 'objective' : null);
  const resolvedEntityId = fileEntityId ?? objectiveId ?? null;
  const requiresFileOnCreate = false;
  
  // Format current date as DD/MM/YYYY for display
  const today = new Date();
  const dateStr = today.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

  useEffect(() => {
    if (open) {
      setDescription(initialDescription || '');
    }
  }, [open, initialDescription]);

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error(t('process.feedbacks.descriptionRequired'));
      return;
    }

    if (description.length > MAX_VARCHAR_LENGTH) {
      toast.error(t('process.feedbacks.maxLength', { count: MAX_VARCHAR_LENGTH }));
      return;
    }

    try {
      setLoading(true);
      const trimmed = description.slice(0, MAX_VARCHAR_LENGTH);

      if ((resolvedEntity === 'organizational-unit' || resolvedEntity === 'document') && !editMode) {
        if (!resolvedEntityId) {
          toast.error(t('process.feedbacks.invalidId'));
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append('improvementLesson', String(!!isLessonLearned));
        formData.append('description', trimmed);
        formData.append('problem', '');
        formData.append('rootCause', '');
        formData.append('reportReceiver', '0');
        if (selectedFile) {
          formData.append('file', selectedFile);
        }

        const url = `/api/feedbacks/${encodeURIComponent(resolvedEntity)}/${encodeURIComponent(String(resolvedEntityId))}/with-file`;

        setUploading(true);
        await axios.post(url, formData);
        setUploading(false);
        toast.success(t('process.feedbacks.success'));
        setSelectedFile(null);
        setUploadedName(null);
        setShowUploader(false);

        onSuccess();
        onClose();
        return;
      }

      if (selectedFile) {
        if (!resolvedEntity || !resolvedEntityId) {
          toast.error(t('process.feedbacks.invalidId'));
          setLoading(false);
          return;
        }
        if (editMode) {
          toast.error(t('process.feedbacks.fileNotAllowedEdit'));
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append('improvementLesson', String(!!isLessonLearned));
        formData.append('description', trimmed);
        formData.append('problem', '');
        formData.append('rootCause', '');
        formData.append('reportReceiver', '0');
        formData.append('file', selectedFile);

        const url = `/api/feedbacks/${encodeURIComponent(resolvedEntity)}/${encodeURIComponent(String(resolvedEntityId))}/with-file`;

        setUploading(true);
        await axios.post(url, formData);
        setUploading(false);
        toast.success(t('process.feedbacks.success'));
        setSelectedFile(null);
        setUploadedName(null);
        setShowUploader(false);
      } else {
        if (resolvedEntity && resolvedEntityId && !editMode) {
          const payload = {
            improvementLesson: !!isLessonLearned,
            description: trimmed,
            problem: '',
            rootCause: '',
            reportReceiver: 0,
          };

          const url = `/api/feedbacks/${encodeURIComponent(resolvedEntity)}/${encodeURIComponent(String(resolvedEntityId))}`;
          await axios.post(url, payload);
        } else {
          await onSubmit(trimmed);
        }
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      setUploading(false);
      const msg =
        (error?.response?.data?.message && typeof error.response.data.message === 'string'
          ? error.response.data.message
          : null) ||
        error?.message ||
        'Error';
      console.error('UploadFeedbackWithFile error', error?.response?.status, error?.response?.data || msg);
      toast.error(typeof msg === 'string' && msg.trim().length ? msg : t('process.feedbacks.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleAttachClick = useCallback(() => {
    setShowUploader(true);
    fileInputRef.current?.click();
  }, []);

  const handleDownloadFiles = useCallback(async () => {
    if (!feedbackId) {
      toast.error(t('process.feedbacks.invalidId'));
      return;
    }

    const url = `/api/feedbacks/${encodeURIComponent(String(feedbackId))}/files/download`;

    try {
      setDownloadingFiles(true);
      const res = await axios.get(url, { responseType: 'blob' });
      const blob = res.data as Blob;

      const contentDisposition = res.headers?.['content-disposition'] as string | undefined;
      const filenameMatch = contentDisposition?.match(/filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i);
      const rawFilename = filenameMatch?.[1] ?? filenameMatch?.[2];
      const filename = rawFilename
        ? decodeURIComponent(rawFilename)
        : `feedback-files-${String(feedbackId)}.zip`;

      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (error: any) {
      if (error?.response?.status === 404) {
        toast.info(t('process.feedbacks.noFiles'));
        return;
      }

      const msg =
        (error?.response?.data?.message && typeof error.response.data.message === 'string'
          ? error.response.data.message
          : null) ||
        error?.message ||
        'Error';
      console.error('DownloadObjectiveFeedbackFiles error', error?.response?.status, error?.response?.data || msg);
      toast.error(typeof msg === 'string' && msg.trim().length ? msg : t('process.feedbacks.downloadError'));
    } finally {
      setDownloadingFiles(false);
    }
  }, [feedbackId, t]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) return;
      const file = acceptedFiles[0];
      setSelectedFile(file);
      setUploadedName(file.name);
    },
    []
  );

  const handleFilePick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = '';
    if (!file) return;
    setSelectedFile(file);
    setUploadedName(file.name);
    setShowUploader(true);
  }, []);

  const handleClearFile = useCallback(() => {
    setSelectedFile(null);
    setUploadedName(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  const dropLabel = useMemo(() => {
    if (uploading) return t('strategicObjectives.table.uploadDialog.drop.selectedTitle') || 'Archivo seleccionado';
    return isDragActive
      ? t('strategicObjectives.table.uploadDialog.drop.subtitle') || 'Suelta el archivo para adjuntarlo'
      : t('process.feedbacks.attachFile') || 'Adjuntar archivo';
  }, [isDragActive, t, uploading]);

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 420 } }}>
      <Box sx={{ px: 2, py: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {title}
        </Typography>

        <Stack spacing={2} sx={{ pt: 1 }}>
          
          {/* User Field (Read Only) */}
          <Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
              {t('process.feedbacks.user') || 'Usuario'}
            </Typography>
            <Box sx={{ 
              p: 1.5, 
              borderRadius: 1, 
              bgcolor: 'action.hover', 
              color: 'text.primary',
              typography: 'body2'
            }}>
              {user?.displayName || 'Usuario Actual'}
            </Box>
          </Box>

          {/* Date Field (Read Only) */}
          <Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
              {t('process.feedbacks.date') || 'Fecha'}
            </Typography>
            <Typography variant="body1">
              {dateStr}
            </Typography>
          </Box>

          {/* Description Field */}
          <Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
              {descriptionLabel || t('process.feedbacks.descriptionLesson') || 'Descripción'}
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={descriptionPlaceholder || t('process.feedbacks.placeholder') || 'Escriba aquí...'}
              inputProps={{ maxLength: MAX_VARCHAR_LENGTH }}
              helperText={`${description.length}/${MAX_VARCHAR_LENGTH}`}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'background.paper',
                }
              }}
            />
          </Box>

          {!editMode && (
            <>
              <Box>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<Iconify icon="eva:plus-fill" />}
                  sx={{ textTransform: 'none' }}
                  onClick={handleAttachClick}
                >
                  {t('process.feedbacks.attachFile') || 'Añadir archivo'}
                </Button>
                <input ref={fileInputRef} type="file" hidden onChange={handleFilePick} />
              </Box>

              {showUploader && (
                <Box
                  {...getRootProps()}
                  sx={{
                    border: '1px dashed',
                    borderColor: 'divider',
                    borderRadius: 2,
                    p: 2,
                    textAlign: 'center',
                    bgcolor: isDragActive ? 'action.hover' : 'background.neutral',
                    cursor: 'pointer',
                  }}
                >
                  <input {...getInputProps()} />
                  <Stack spacing={1} alignItems="center">
                    <Iconify icon="solar:inbox-in-bold" width={48} sx={{ color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {dropLabel}
                    </Typography>
                    {uploadedName && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="caption" color="text.primary">
                          {uploadedName}
                        </Typography>
                        <Button size="small" color="inherit" variant="text" onClick={handleClearFile} disabled={uploading}>
                          Quitar
                        </Button>
                      </Stack>
                    )}
                    {uploading && <CircularProgress size={18} />}
                  </Stack>
                </Box>
              )}
            </>
          )}

          {editMode && !!resolvedEntity && !!resolvedEntityId && (
            <Box>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={downloadingFiles ? <CircularProgress size={18} color="inherit" /> : <Iconify icon="solar:download-bold" />}
                onClick={handleDownloadFiles}
                disabled={downloadingFiles}
                fullWidth
              >
                Descargar archivos
              </Button>
            </Box>
          )}

          <Stack direction="row" spacing={1} sx={{ pt: 1, justifyContent: 'flex-end' }}>
            <Button onClick={onClose} variant="outlined" color="inherit">
              {t('process.feedbacks.cancel') || 'Cancelar'}
            </Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained" 
              color="primary"
              disabled={loading || (requiresFileOnCreate && !selectedFile)}
              startIcon={loading && <CircularProgress size={18} color="inherit" />}
            >
              {t('process.feedbacks.save') || 'Guardar'}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Drawer>
  );
}
