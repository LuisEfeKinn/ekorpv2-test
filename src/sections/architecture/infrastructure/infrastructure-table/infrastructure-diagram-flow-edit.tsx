import type { DialogProps } from '@mui/material/Dialog';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Switch from '@mui/material/Switch';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import { alpha, useTheme } from '@mui/material/styles';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useTranslate } from 'src/locales';
import { GetDomainPaginationService } from 'src/services/architecture/catalogs/domains.service';
import { GetProvidersPaginationService } from 'src/services/architecture/catalogs/providers.service';
import { GetTechnologyTypesPaginationService } from 'src/services/architecture/catalogs/technologyTypes.service';
import { GetDataTableByIdService, SaveOrUpdateDataTableService } from 'src/services/architecture/data/dataTable.service';
import { GetImpactRatioService, GetLocalExternalService, } from 'src/services/architecture/related-data/related-data.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = DialogProps & {
  open: boolean;
  onClose: () => void;
  dataId?: string;
  onSave: () => void;
};

type FormData = {
  name: string;
  description: string;
  file: string;
  type: string;
  rules: string;
  localExternal: string;
  nomenclature: string;
  code: string;
  superiorData: string;
  dataType: {
    id: number;
  };
  provider: {
    id: number;
  };
  Domains: {
    id: number;
  };
  contractedCapacity: string;
  adoptionContractDate: string;
  expirationDate: string;
  renewalDate: string;
  contract: string;
  obsolescenceDate: string;
  requiresSla: boolean;
  hasSla: boolean;
  impactRatio: string;
  impactLevel: number;
};

// ----------------------------------------------------------------------

export function InfrastructureDiagramFlowEditModal({ open, onClose, dataId, onSave, ...other }: Props) {
  const { t } = useTranslate('architecture');
  const theme = useTheme();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dataTypes, setDataTypes] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [domains, setDomains] = useState<any[]>([]);
  const [impactRatioOptions, setImpactRatioOptions] = useState<string[]>([]);
  const [localExternalOptions, setLocalExternalOptions] = useState<string[]>([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    file: '',
    type: '',
    rules: '',
    localExternal: '',
    nomenclature: '',
    code: '',
    superiorData: '',
    dataType: {
      id: 0
    },
    provider: {
      id: 0
    },
    Domains: {
      id: 0
    },
    contractedCapacity: '',
    adoptionContractDate: '',
    expirationDate: '',
    renewalDate: '',
    contract: '',
    obsolescenceDate: '',
    requiresSla: false,
    hasSla: false,
    impactRatio: '',
    impactLevel: 1
  });

  // Cargar catálogos al abrir el modal
  useEffect(() => {
    const loadCatalogs = async () => {
      if (open) {
        setLoadingCatalogs(true);
        try {
          const [dataTypesRes, providersRes, domainsRes, impactRatioRes, localExternalRes] = await Promise.all([
            GetTechnologyTypesPaginationService({ page: 1, perPage: 100 }),
            GetProvidersPaginationService({ page: 1, perPage: 100 }),
            GetDomainPaginationService({ page: 1, perPage: 100 }),
            GetImpactRatioService(),
            GetLocalExternalService()
          ]);

          setDataTypes(dataTypesRes.data?.[0] || []);
          setProviders(providersRes.data?.[0] || []);
          setDomains(domainsRes.data?.[0] || []);
          setImpactRatioOptions(impactRatioRes.data || []);
          setLocalExternalOptions(localExternalRes.data || []);
        } catch (error) {
          console.error('Error loading catalogs:', error);
          toast.error(t('infrastructure.diagram.messages.error.loadingCatalogs'));
        } finally {
          setLoadingCatalogs(false);
        }
      }
    };

    loadCatalogs();
  }, [open, t]);

  // Cargar datos cuando se abre el modal en modo edición
  const loadData = useCallback(async () => {
    if (!dataId) return;

    setLoading(true);
    try {
      const response = await GetDataTableByIdService(dataId);
      if (response?.data) {
        const data = response.data;
        setFormData({
          name: data.name || '',
          description: data.description || '',
          file: data.file || '',
          type: data.type || '',
          rules: data.rules || '',
          localExternal: data.localExternal || '',
          nomenclature: data.nomenclature || '',
          code: data.code || '',
          superiorData: data.superiorData || '',
          dataType: data.dataType ? { id: data.dataType.id } : { id: 0 },
          provider: data.provider ? { id: data.provider.id } : { id: 0 },
          Domains: data.Domains ? { id: data.Domains.id } : { id: 0 },
          contractedCapacity: data.contractedCapacity || '',
          adoptionContractDate: data.adoptionContractDate || '',
          expirationDate: data.expirationDate || '',
          renewalDate: data.renewalDate || '',
          contract: data.contract || '',
          obsolescenceDate: data.obsolescenceDate || '',
          requiresSla: data.requiresSla || false,
          hasSla: data.hasSla || false,
          impactRatio: data.impactRatio || '',
          impactLevel: data.impactLevel || 1
        });
      }
    } catch (error) {
      console.error('Error loading infrastructure data:', error);
      toast.error(t('infrastructure.diagram.messages.error.loading'));
    } finally {
      setLoading(false);
    }
  }, [dataId, t]);

  // Efecto para cargar datos cuando se abre el modal
  useEffect(() => {
    if (open) {
      if (dataId) {
        loadData();
      } else {
        // Resetear formulario para modo creación
        setFormData({
          name: '',
          description: '',
          file: '',
          type: '',
          rules: '',
          localExternal: '',
          nomenclature: '',
          code: '',
          superiorData: '',
          dataType: { id: 0 },
          provider: { id: 0 },
          Domains: { id: 0 },
          contractedCapacity: '',
          adoptionContractDate: '',
          expirationDate: '',
          renewalDate: '',
          contract: '',
          obsolescenceDate: '',
          requiresSla: false,
          hasSla: false,
          impactRatio: '',
          impactLevel: 1
        });
      }
    }
  }, [open, dataId, loadData]);

  // Manejar cambios en los campos
  const handleChange = useCallback((field: string, value: string | boolean | number | any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Validar formulario
  const isFormValid = () =>
    formData.name.trim() !== '' &&
    formData.description.trim() !== '' &&
    formData.code.trim() !== '' &&
    formData.nomenclature.trim() !== '' &&
    formData.localExternal.trim() !== '';

  // Guardar o actualizar
  const handleSave = async () => {
    if (!isFormValid()) {
      toast.error(t('infrastructure.table.messages.error.validation'));
      return;
    }

    setSaving(true);
    try {
      await SaveOrUpdateDataTableService(formData, dataId);
      toast.success(
        dataId
          ? t('infrastructure.table.messages.success.updated')
          : t('infrastructure.table.messages.success.created')
      );
      onSave(); // Recargar la tabla
      onClose(); // Cerrar el modal
    } catch (error) {
      console.error('Error saving data:', error);
      toast.error(
        dataId
          ? t('infrastructure.table.messages.error.updating')
          : t('infrastructure.table.messages.error.creating')
      );
    } finally {
      setSaving(false);
    }
  };

  // Manejar cierre del modal
  const handleClose = () => {
    if (!saving) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: `0 24px 48px ${alpha(theme.palette.common.black, 0.24)}`,
        },
      }}
      {...other}
    >
      {/* Header con gradiente */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          px: 3,
          py: 3,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
          },
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ color: 'common.white', fontWeight: 700, mb: 0.5 }}>
              {dataId
                ? t('infrastructure.table.dialogs.edit.title')
                : t('infrastructure.table.dialogs.create.title')}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 300,
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={0}>
            {/* Sección: Información Básica */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 0,
                bgcolor: alpha(theme.palette.primary.main, 0.02),
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1.5,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Iconify
                    icon="solar:file-text-bold"
                    width={20}
                    sx={{ color: 'primary.main' }}
                  />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {t('infrastructure.diagram.dialogs.sectionsLabels.basicInfo')}
                </Typography>
              </Stack>

              <Stack spacing={2.5}>
                <TextField
                  fullWidth
                  label={t('data.table.table.columns.name')}
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                  disabled={saving}
                  InputProps={{
                    startAdornment: (
                      <Iconify
                        icon="solar:flag-bold"
                        width={20}
                        sx={{ color: 'text.disabled', mr: 1 }}
                      />
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />

                <TextField
                  fullWidth
                  label={t('infrastructure.table.table.columns.description')}
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  multiline
                  rows={3}
                  required
                  disabled={saving}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
              </Stack>
            </Paper>

            <Divider />

            {/* Sección: Configuración */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 0 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1.5,
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Iconify
                    icon="solar:settings-bold"
                    width={20}
                    sx={{ color: 'info.main' }}
                  />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {t('infrastructure.diagram.dialogs.sectionsLabels.settings')}
                </Typography>
              </Stack>

              <Stack spacing={2.5}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <TextField
                    fullWidth
                    label={t('data.table.table.columns.type')}
                    value={formData.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                    disabled={saving}
                    InputProps={{
                      startAdornment: (
                        <Iconify
                          icon="solar:add-folder-bold"
                          width={20}
                          sx={{ color: 'text.disabled', mr: 1 }}
                        />
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />

                  <TextField
                    fullWidth
                    label={t('infrastructure.table.table.columns.file')}
                    value={formData.file}
                    onChange={(e) => handleChange('file', e.target.value)}
                    disabled={saving}
                    InputProps={{
                      startAdornment: (
                        <Iconify
                          icon="solar:copy-bold"
                          width={20}
                          sx={{ color: 'text.disabled', mr: 1 }}
                        />
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Box>

                <TextField
                  fullWidth
                  label={t('infrastructure.table.table.columns.rules')}
                  value={formData.rules}
                  onChange={(e) => handleChange('rules', e.target.value)}
                  multiline
                  rows={2}
                  disabled={saving}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
              </Stack>
            </Paper>

            <Divider />

            {/* Sección: Identificación */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 0,
                bgcolor: alpha(theme.palette.success.main, 0.02),
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1.5,
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Iconify
                    icon="solar:list-bold"
                    width={20}
                    sx={{ color: 'success.main' }}
                  />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {t('infrastructure.diagram.dialogs.sectionsLabels.identification')}
                </Typography>
              </Stack>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
                <Autocomplete
                  fullWidth
                  options={localExternalOptions}
                  value={formData.localExternal || null}
                  onChange={(event, newValue) => handleChange('localExternal', newValue || '')}
                  disabled={saving}
                  loading={loadingCatalogs}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('infrastructure.table.table.columns.localExternal')}
                      required
                      placeholder="U/E"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <Iconify
                              icon="solar:map-point-bold"
                              width={20}
                              sx={{ color: 'text.disabled', ml: 1, mr: 0.5 }}
                            />
                            {params.InputProps.startAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />

                <TextField
                  fullWidth
                  label={t('infrastructure.table.table.columns.nomenclature')}
                  value={formData.nomenclature}
                  onChange={(e) => handleChange('nomenclature', e.target.value)}
                  required
                  disabled={saving}
                  InputProps={{
                    startAdornment: (
                      <Iconify
                        icon="solar:box-minimalistic-bold"
                        width={20}
                        sx={{ color: 'text.disabled', mr: 1 }}
                      />
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />

                <TextField
                  fullWidth
                  label={t('infrastructure.table.table.columns.code')}
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value)}
                  required
                  disabled={saving}
                  InputProps={{
                    startAdornment: (
                      <Iconify
                        icon="solar:pen-bold"
                        width={20}
                        sx={{ color: 'text.disabled', mr: 1 }}
                      />
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
              </Box>
            </Paper>

            <Divider />

            {/* Sección: Tipo de Dato */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 0, bgcolor: alpha(theme.palette.warning.main, 0.02) }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1.5,
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Iconify icon="solar:server-square-bold" width={20} sx={{ color: 'warning.main' }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {t('infrastructure.diagram.dialogs.sectionsLabels.dataType')}
                </Typography>
              </Stack>

              <Autocomplete
                fullWidth
                options={dataTypes}
                getOptionLabel={(option) => option.name || ''}
                value={dataTypes.find(dt => dt.id === formData.dataType.id) || null}
                onChange={(_, newValue) => {
                  handleChange('dataType', { id: newValue?.id || 0 });
                }}
                disabled={saving || loadingCatalogs}
                loading={loadingCatalogs}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('infrastructure.diagram.dialogs.form.dataType.label')}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <Iconify icon="solar:server-square-bold" width={20} sx={{ color: 'text.disabled', ml: 1, mr: 1 }} />
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                )}
              />
            </Paper>

            <Divider />

            {/* Sección: Proveedor */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 0 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1.5,
                    bgcolor: alpha(theme.palette.error.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Iconify icon="solar:users-group-rounded-bold" width={20} sx={{ color: 'error.main' }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {t('infrastructure.diagram.dialogs.sectionsLabels.provider')}
                </Typography>
              </Stack>

              <Stack spacing={2.5}>
                <Autocomplete
                  fullWidth
                  options={providers}
                  getOptionLabel={(option) => option.name || ''}
                  value={providers.find(p => p.id === formData.provider.id) || null}
                  onChange={(_, newValue) => {
                    handleChange('provider', { id: newValue?.id || 0 });
                  }}
                  disabled={saving || loadingCatalogs}
                  loading={loadingCatalogs}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('infrastructure.diagram.dialogs.form.provider.label')}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <Iconify icon="solar:users-group-rounded-bold" width={20} sx={{ color: 'text.disabled', ml: 1, mr: 1 }} />
                            {params.InputProps.startAdornment}
                          </>
                        ),
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  )}
                />
              </Stack>
            </Paper>

            <Divider />

            {/* Sección: Dominio */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 0, bgcolor: alpha(theme.palette.info.main, 0.02) }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1.5,
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Iconify icon="solar:crown-bold" width={20} sx={{ color: 'info.main' }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {t('infrastructure.diagram.dialogs.sectionsLabels.domain')}
                </Typography>
              </Stack>

              <Autocomplete
                fullWidth
                options={domains}
                getOptionLabel={(option) => (option.code && option.name) ? `${option.code} - ${option.name}` : ''}
                value={domains.find(d => d.id === formData.Domains.id) || null}
                onChange={(_, newValue) => {
                  handleChange('Domains', { id: newValue?.id || 0 });
                }}
                disabled={saving || loadingCatalogs}
                loading={loadingCatalogs}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('infrastructure.diagram.dialogs.form.domain.label')}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <Iconify icon="solar:star-bold" width={20} sx={{ color: 'text.disabled', ml: 1, mr: 1 }} />
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                )}
              />
            </Paper>

            <Divider />

            {/* Sección: Fechas y Contratos */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 0 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1.5,
                    bgcolor: alpha(theme.palette.secondary.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Iconify icon="solar:calendar-mark-bold" width={20} sx={{ color: 'secondary.main' }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {t('infrastructure.diagram.dialogs.sectionsLabels.datesAndContracts')}
                </Typography>
              </Stack>

              <Stack spacing={2.5}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <TextField
                    fullWidth
                    label={t('infrastructure.diagram.dialogs.form.contractedCapacity.label')}
                    value={formData.contractedCapacity}
                    onChange={(e) => handleChange('contractedCapacity', e.target.value)}
                    disabled={saving}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />

                  <TextField
                    fullWidth
                    label={t('infrastructure.diagram.dialogs.form.contract.label')}
                    value={formData.contract}
                    onChange={(e) => handleChange('contract', e.target.value)}
                    disabled={saving}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <TextField
                    fullWidth
                    type="date"
                    label={t('infrastructure.diagram.dialogs.form.adoptionContractDate.label')}
                    value={formData.adoptionContractDate}
                    onChange={(e) => handleChange('adoptionContractDate', e.target.value)}
                    disabled={saving}
                    InputLabelProps={{ shrink: true }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />

                  <TextField
                    fullWidth
                    type="date"
                    label={t('infrastructure.diagram.dialogs.form.expirationDate.label')}
                    value={formData.expirationDate}
                    onChange={(e) => handleChange('expirationDate', e.target.value)}
                    disabled={saving}
                    InputLabelProps={{ shrink: true }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <TextField
                    fullWidth
                    type="date"
                    label={t('infrastructure.diagram.dialogs.form.renewalDate.label')}
                    value={formData.renewalDate}
                    onChange={(e) => handleChange('renewalDate', e.target.value)}
                    disabled={saving}
                    InputLabelProps={{ shrink: true }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />

                  <TextField
                    fullWidth
                    type="date"
                    label={t('infrastructure.diagram.dialogs.form.obsolescenceDate.label')}
                    value={formData.obsolescenceDate}
                    onChange={(e) => handleChange('obsolescenceDate', e.target.value)}
                    disabled={saving}
                    InputLabelProps={{ shrink: true }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Box>
              </Stack>
            </Paper>

            <Divider />

            {/* Sección: SLA e Impacto */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 0, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1.5,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Iconify icon="solar:shield-check-bold" width={20} sx={{ color: 'primary.main' }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {t('infrastructure.diagram.dialogs.sectionsLabels.slaAndImpact')}
                </Typography>
              </Stack>

              <Stack spacing={2.5}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.requiresSla}
                        onChange={(e) => handleChange('requiresSla', e.target.checked)}
                        disabled={saving}
                        color="primary"
                      />
                    }
                    label={t('infrastructure.diagram.dialogs.form.requiresSla.label')}
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.hasSla}
                        onChange={(e) => handleChange('hasSla', e.target.checked)}
                        disabled={saving}
                        color="success"
                      />
                    }
                    label={t('infrastructure.diagram.dialogs.form.hasSla.label')}
                  />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <Autocomplete
                    fullWidth
                    options={impactRatioOptions}
                    value={formData.impactRatio || null}
                    onChange={(_, newValue) => handleChange('impactRatio', newValue || '')}
                    disabled={saving || loadingCatalogs}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t('infrastructure.diagram.dialogs.form.impactRatio.label')}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    )}
                  />

                  <TextField
                    fullWidth
                    type="number"
                    label={t('infrastructure.diagram.dialogs.form.impactLevel.label')}
                    value={formData.impactLevel}
                    onChange={(e) => handleChange('impactLevel', Number(e.target.value))}
                    disabled={saving}
                    inputProps={{ min: 1, max: 10 }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Box>
              </Stack>
            </Paper>
          </Stack>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2.5,
          bgcolor: alpha(theme.palette.grey[500], 0.04),
          gap: 1.5,
        }}
      >
        <Button
          onClick={handleClose}
          disabled={saving}
          variant="outlined"
          color="inherit"
          sx={{
            borderRadius: 2,
            px: 3,
            height: 44,
            borderColor: alpha(theme.palette.grey[500], 0.32),
            '&:hover': {
              borderColor: theme.palette.grey[500],
              bgcolor: alpha(theme.palette.grey[500], 0.08),
            },
          }}
        >
          <Iconify icon="solar:close-circle-bold" width={20} sx={{ mr: 1 }} />
          {t('infrastructure.table.actions.cancel')}
        </Button>
        <LoadingButton
          variant="contained"
          onClick={handleSave}
          loading={saving}
          disabled={loading || !isFormValid()}
          startIcon={<Iconify icon="solar:check-circle-bold" width={20} />}
          sx={{
            borderRadius: 2,
            px: 4,
            height: 44,
            boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.24)}`,
            '&:hover': {
              boxShadow: `0 12px 24px ${alpha(theme.palette.primary.main, 0.32)}`,
            },
          }}
        >
          {dataId
            ? t('infrastructure.table.actions.update')
            : t('infrastructure.table.actions.save')}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
