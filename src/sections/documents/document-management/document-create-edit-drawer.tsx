'use client';

import type { IUserManagement } from 'src/types/employees';
import type { DocumentItem, DocumentUpsertFormValues } from 'src/services/documents/documents.service';

import { useDropzone } from 'react-dropzone';
import { useDebounce } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback, useRef } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import { GetUserManagmentPaginationService } from 'src/services/employees/user-managment.service';
import { CreateDocumentService, UpdateDocumentService } from 'src/services/documents/documents.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { getFileMeta, FileThumbnail } from 'src/components/file-thumbnail';

export type DocumentSelectOption = { id: number; name: string };

type DocumentUpsertFormState = {
  code: string;
  name: string;
  description: string;
  version: string;
  writingDate: string;
  expirationDate: string;
  type: string;
  link: string;
  documentStatusId: string;
  documentTypeId: string;
  authorId: string;
  verifierId: string;
};

const emptyDocumentForm = (): DocumentUpsertFormState => ({
  code: '',
  name: '',
  description: '',
  version: '',
  writingDate: '',
  expirationDate: '',
  type: '',
  link: '',
  documentStatusId: '',
  documentTypeId: '',
  authorId: '',
  verifierId: '',
});

const normalizeLink = (rawLink: string): string => rawLink.replaceAll('`', '').trim();

const normalizeExternalUrl = (rawLink: string): string | null => {
  const normalized = normalizeLink(rawLink);
  if (!normalized) return null;

  if (/^https?:\/\//i.test(normalized)) return normalized;
  if (/^[a-z][a-z\d+\-.]*:/i.test(normalized)) return null;

  return `https://${normalized}`;
};

type Props = {
  open: boolean;
  onClose: () => void;
  editRow: DocumentItem | null;
  documentStatusOptions: DocumentSelectOption[];
  documentTypeOptions: DocumentSelectOption[];
  onSuccess: () => void;
};

export function DocumentCreateEditDrawer({
  open,
  onClose,
  editRow,
  documentStatusOptions,
  documentTypeOptions,
  onSuccess,
}: Props) {
  const { t } = useTranslate('documents');
  const isEdit = Boolean(editRow);

  const [form, setForm] = useState<DocumentUpsertFormState>(emptyDocumentForm);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [existingFileName, setExistingFileName] = useState<string>('');

  const [authorSearch, setAuthorSearch] = useState('');
  const [authorOptions, setAuthorOptions] = useState<IUserManagement[]>([]);
  const [authorLoading, setAuthorLoading] = useState(false);

  const [verifierSearch, setVerifierSearch] = useState('');
  const [verifierOptions, setVerifierOptions] = useState<IUserManagement[]>([]);
  const [verifierLoading, setVerifierLoading] = useState(false);

  // ... otros estados
  const [focusFields, setFocusFields] = useState({ writing: false, expiration: false });

  const debouncedAuthorSearch = useDebounce(authorSearch.trim(), 400);
  const debouncedVerifierSearch = useDebounce(verifierSearch.trim(), 400);

  const writingRef = useRef<HTMLInputElement>(null);
  const expirationRef = useRef<HTMLInputElement>(null);

  const selectedAuthor = useMemo(
    () => authorOptions.find((opt) => opt.id === form.authorId) ?? null,
    [authorOptions, form.authorId]
  );

  const selectedVerifier = useMemo(
    () => verifierOptions.find((opt) => opt.id === form.verifierId) ?? null,
    [verifierOptions, form.verifierId]
  );

  const externalLink = useMemo(() => normalizeExternalUrl(form.link), [form.link]);

  const resetForm = useCallback(() => {
    setForm(emptyDocumentForm());
    setAuthorSearch('');
    setVerifierSearch('');
    setAuthorOptions([]);
    setVerifierOptions([]);
    setFile(null);
    setExistingFileName('');
    setSubmitted(false);
  }, []);

  useEffect(() => {
    if (!open) return;

    if (editRow) {
      setForm({
        code: editRow.code || '',
        name: editRow.name || '',
        description: editRow.description || '',
        version: editRow.version ? String(editRow.version) : '',
        writingDate: editRow.writingDate ? String(editRow.writingDate).slice(0, 10) : '',
        expirationDate: editRow.expirationDate ? String(editRow.expirationDate).slice(0, 10) : '',
        type: editRow.type || '',
        link: normalizeLink(editRow.link || ''),
        documentStatusId: editRow.documentStatus?.id ? String(editRow.documentStatus.id) : '',
        documentTypeId: editRow.documentType?.id ? String(editRow.documentType.id) : '',
        authorId: editRow.author?.id ? String(editRow.author.id) : '',
        verifierId: editRow.verifier?.id ? String(editRow.verifier.id) : '',
      });
      setExistingFileName(editRow.originalFile || editRow.file || '');
      setFile(null);
      setSubmitted(false);
    } else {
      resetForm();
    }
  }, [editRow, open, resetForm]);

  useEffect(() => {
    if (!open) return;
    setAuthorLoading(true);
    GetUserManagmentPaginationService({ search: debouncedAuthorSearch || undefined, perPage: 20 })
      .then((res) => {
        setAuthorOptions(res.data?.data ?? []);
      })
      .catch(() => setAuthorOptions([]))
      .finally(() => setAuthorLoading(false));
  }, [debouncedAuthorSearch, open]);

  useEffect(() => {
    if (!open) return;
    setVerifierLoading(true);
    GetUserManagmentPaginationService({ search: debouncedVerifierSearch || undefined, perPage: 20 })
      .then((res) => {
        setVerifierOptions(res.data?.data ?? []);
      })
      .catch(() => setVerifierOptions([]))
      .finally(() => setVerifierLoading(false));
  }, [debouncedVerifierSearch, open]);

  const updateField = useCallback(
    <K extends keyof DocumentUpsertFormState>(key: K, value: DocumentUpsertFormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const hasInvalidDateRange =
    Boolean(form.writingDate) &&
    Boolean(form.expirationDate) &&
    form.expirationDate < form.writingDate;

  const canSave =
    form.name.trim() &&
    form.code.trim() &&
    form.version.trim() &&
    form.documentTypeId.trim() &&
    form.documentStatusId.trim() &&
    (file || existingFileName) &&
    !hasInvalidDateRange;

  const fileError = submitted && !file && !existingFileName;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      const next = acceptedFiles[0] ?? null;
      setFile(next);
      if (next) setExistingFileName('');
    },
  });

  const handleSave = useCallback(async () => {
    setSubmitted(true);
    if (!canSave) return;

    if (hasInvalidDateRange) {
      toast.error('La fecha de expiración no puede ser menor a la fecha de redacción.');
      return;
    }

    const versionNumber = Number(form.version);
    const documentTypeId = Number(form.documentTypeId);
    const documentStatusId = Number(form.documentStatusId);
    const authorId = form.authorId ? Number(form.authorId) : null;
    const verifierId = form.verifierId ? Number(form.verifierId) : null;

    if (!Number.isFinite(versionNumber) || !Number.isFinite(documentTypeId) || !Number.isFinite(documentStatusId)) {
      toast.error(t('documentManagement.messages.error.invalidForm'));
      return;
    }

    setSaving(true);
    try {
      const normalizedLink = normalizeLink(form.link).trim();
      const values: DocumentUpsertFormValues = {
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description.trim() || null,
        version: versionNumber,
        writingDate: form.writingDate.trim() || null,
        expirationDate: form.expirationDate.trim() || null,
        type: form.type.trim() || null,
        link: normalizedLink,
        documentStatusId,
        documentTypeId,
        ...(authorId ? { authorId } : {}),
        ...(verifierId ? { verifierId } : {}),
      };

      if (editRow) {
        await UpdateDocumentService(editRow.id, values, file);
        toast.success(t('documentManagement.messages.success.updated'));
      } else {
        if (!file) {
          toast.error(t('documentManagement.messages.error.fileRequired'));
          return;
        }
        await CreateDocumentService(values, file);
        toast.success(t('documentManagement.messages.success.created'));
      }

      onSuccess();
    } catch {
      toast.error(t('documentManagement.messages.error.saving'));
    } finally {
      setSaving(false);
    }
  }, [canSave, editRow, file, form, hasInvalidDateRange, onSuccess, t]);

  const handleOpenExternalLink = useCallback(() => {
    if (!externalLink) {
      toast.error('El enlace no es válido.');
      return;
    }

    window.open(externalLink, '_blank', 'noopener,noreferrer');
  }, [externalLink]);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: 1, sm: 520 } } }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="subtitle1" sx={{ flex: 1 }}>
          {isEdit ? t('documentManagement.drawer.title.edit') : t('documentManagement.drawer.title.create')}
        </Typography>
        <IconButton onClick={onClose}>
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </Box>

      <Scrollbar sx={{ height: 1 }}>
        <Box sx={{ p: 2.5, display: 'grid', gap: 2 }}>
          <TextField
            required
            label={t('documentManagement.form.fields.name')}
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
          />

          <TextField
            required
            label={t('documentManagement.form.fields.code')}
            value={form.code}
            onChange={(e) => updateField('code', e.target.value)}
          />

          <TextField
            label={t('documentManagement.form.fields.description')}
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            multiline
            minRows={3}
          />

          <TextField
            required
            label={t('documentManagement.form.fields.version')}
            type="number"
            value={form.version}
            onChange={(e) => updateField('version', e.target.value)}
          />

          {documentTypeOptions.length ? (
            <FormControl fullWidth required>
              <InputLabel id="document-type-label">{t('documentManagement.form.fields.documentType')}</InputLabel>
              <Select
                labelId="document-type-label"
                label={t('documentManagement.form.fields.documentType')}
                value={form.documentTypeId}
                onChange={(e) => updateField('documentTypeId', String(e.target.value))}
              >
                {documentTypeOptions.map((opt) => (
                  <MenuItem key={opt.id} value={String(opt.id)}>
                    {opt.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <TextField
              required
              label={t('documentManagement.form.fields.documentType')}
              type="number"
              value={form.documentTypeId}
              onChange={(e) => updateField('documentTypeId', e.target.value)}
            />
          )}

          <Autocomplete
            options={authorOptions}
            loading={authorLoading}
            value={selectedAuthor}
            onChange={(_, next) => updateField('authorId', next?.id ?? '')}
            onInputChange={(_, value) => setAuthorSearch(value)}
            getOptionLabel={(opt) => opt.fullName || opt.email || opt.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('documentManagement.form.fields.author')}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {authorLoading ? <CircularProgress color="inherit" size={18} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          <Autocomplete
            options={verifierOptions}
            loading={verifierLoading}
            value={selectedVerifier}
            onChange={(_, next) => updateField('verifierId', next?.id ?? '')}
            onInputChange={(_, value) => setVerifierSearch(value)}
            getOptionLabel={(opt) => opt.fullName || opt.email || opt.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('documentManagement.form.fields.verifier')}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {verifierLoading ? <CircularProgress color="inherit" size={18} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              fullWidth
              inputRef={writingRef} // Referencia para controlar el input
              label={t('documentManagement.form.fields.writingDate')}
              type={focusFields.writing || form.writingDate ? "date" : "text"} 
              value={form.writingDate}
              onChange={(e) => updateField('writingDate', e.target.value)}
              onFocus={() => {
                setFocusFields((prev) => ({ ...prev, writing: true }));
                // Esperamos un milisegundo a que React cambie el type y abrimos el calendario
                setTimeout(() => {
                  writingRef.current?.showPicker?.();
                }, 10);
              }}
              onBlur={() => setFocusFields((prev) => ({ ...prev, writing: false }))}
              InputLabelProps={{ shrink: !!(focusFields.writing || form.writingDate) }}
            />
            
            <TextField
              fullWidth
              inputRef={expirationRef}
              label={t('documentManagement.form.fields.expirationDate')}
              type={focusFields.expiration || form.expirationDate ? "date" : "text"}
              value={form.expirationDate}
              onChange={(e) => updateField('expirationDate', e.target.value)}
              error={hasInvalidDateRange}
              helperText={
                hasInvalidDateRange
                  ? 'La fecha de expiración no puede ser menor a la fecha de redacción.'
                  : undefined
              }
              inputProps={{ min: form.writingDate || undefined }}
              onFocus={() => {
                setFocusFields((prev) => ({ ...prev, expiration: true }));
                setTimeout(() => {
                  expirationRef.current?.showPicker?.();
                }, 10);
              }}
              onBlur={() => setFocusFields((prev) => ({ ...prev, expiration: false }))}
              InputLabelProps={{ shrink: !!(focusFields.expiration || form.expirationDate) }}
            />
          </Stack>

          {documentStatusOptions.length ? (
            <FormControl fullWidth required>
              <InputLabel id="document-status-label">{t('documentManagement.form.fields.documentStatus')}</InputLabel>
              <Select
                labelId="document-status-label"
                label={t('documentManagement.form.fields.documentStatus')}
                value={form.documentStatusId}
                onChange={(e) => updateField('documentStatusId', String(e.target.value))}
              >
                {documentStatusOptions.map((opt) => (
                  <MenuItem key={opt.id} value={String(opt.id)}>
                    {opt.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <TextField
              required
              label={t('documentManagement.form.fields.documentStatus')}
              type="number"
              value={form.documentStatusId}
              onChange={(e) => updateField('documentStatusId', e.target.value)}
            />
          )}

          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 'fontWeightSemiBold' }}>
              {t('documentManagement.form.fields.file')}
            </Typography>
            <Box
              {...getRootProps()}
              sx={[
                (theme) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 2,
                  borderRadius: 1.25,
                  cursor: 'pointer',
                  border: `1px dashed ${theme.vars.palette.divider}`,
                  ...(isDragActive && { bgcolor: 'action.hover' }),
                  ...(fileError && { borderColor: 'error.main' }),
                }),
              ]}
            >
              <input {...getInputProps()} />
              <FileThumbnail
                file={file ?? existingFileName ?? null}
                tooltip
                sx={{ width: 44, height: 44 }}
                slotProps={{ icon: { sx: { width: 26, height: 26 } } }}
              />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="subtitle2" noWrap>
                  {t('documentManagement.form.fileDropzone.title')}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {t('documentManagement.form.fileDropzone.helper')}
                </Typography>
                {(file || existingFileName) && (
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {t('documentManagement.form.fileDropzone.selected', { name: getFileMeta(file ?? existingFileName).name })}
                  </Typography>
                )}
              </Box>
              {(file || existingFileName) && (
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setExistingFileName('');
                  }}
                  color={fileError ? 'error' : 'default'}
                >
                  <Iconify icon="mingcute:close-line" />
                </IconButton>
              )}
            </Box>
          </Box>

          <TextField
            label={t('documentManagement.form.fields.type')}
            value={form.type}
            onChange={(e) => updateField('type', e.target.value)}
          />

          <TextField
            label={t('documentManagement.form.fields.link')}
            value={form.link}
            onChange={(e) => updateField('link', e.target.value)}
          />

          {isEdit ? (
            <Button
              variant="outlined"
              color="primary"
              startIcon={<Iconify icon="solar:eye-bold" />}
              onClick={handleOpenExternalLink}
              disabled={!externalLink}
              sx={{ justifySelf: 'start' }}
            >
              Ver enlace
            </Button>
          ) : null}
        </Box>
      </Scrollbar>

      <Box sx={{ p: 2.5, display: 'flex', gap: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <LoadingButton
          fullWidth
          variant="contained"
          loading={saving}
          disabled={!canSave}
          onClick={handleSave}
        >
          {t('documentManagement.actions.save')}
        </LoadingButton>
        <Button fullWidth variant="outlined" color="inherit" onClick={resetForm} disabled={saving}>
          {t('documentManagement.actions.clear')}
        </Button>
        <Button fullWidth variant="outlined" color="inherit" onClick={onClose} disabled={saving}>
          {t('documentManagement.actions.cancel')}
        </Button>
      </Box>
    </Drawer>
  );
}
