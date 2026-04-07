import type { DialogProps } from '@mui/material/Dialog';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import { GetDomainPaginationService } from 'src/services/architecture/catalogs/domains.service';
import { GetImpactRatioService } from 'src/services/architecture/related-data/related-data.service';
import { GetProvidersPaginationService } from 'src/services/architecture/catalogs/providers.service';
import { GetSystemTypesPaginationService } from 'src/services/architecture/catalogs/systemTypes.service';
import {
  GetApplicationTableByIdService,
  SaveOrUpdateApplicationTableService
} from 'src/services/architecture/applications/applicationTable.service';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

type Props = DialogProps & {
  open: boolean;
  onClose: () => void;
  applicationId?: string;
  onSave: () => void;
};

type FormData = {
  name: string;
  description: string;
  architecture: boolean;
  sla: boolean;
  code: string;
  nomenclature: string;
  provider: { id: number };
  systemType: { id: number };
  Domains: { id: number };
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

export function ApplicationTableModal({ open, onClose, applicationId, onSave, ...other }: Props) {
  const { t } = useTranslate('architecture');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  const [systemTypes, setSystemTypes] = useState<Array<{ id: number; name: string }>>([]);
  const [providers, setProviders] = useState<Array<{ id: number; name: string }>>([]);
  const [domains, setDomains] = useState<Array<{ id: number; code: string; name: string }>>([]);
  const [impactRatioOptions, setImpactRatioOptions] = useState<string[]>([]);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    architecture: false,
    sla: false,
    code: '',
    nomenclature: '',
    provider: { id: 0 },
    systemType: { id: 0 },
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
    impactLevel: 1,
  });

  useEffect(() => {
    const loadCatalogs = async () => {
      if (!open) return;

      setLoadingCatalogs(true);
      try {
        const [systemTypesRes, providersRes, domainsRes, impactRatioRes] = await Promise.all([
          GetSystemTypesPaginationService({ page: 1, perPage: 100 }),
          GetProvidersPaginationService({ page: 1, perPage: 100 }),
          GetDomainPaginationService({ page: 1, perPage: 100 }),
          GetImpactRatioService(),
        ]);

        setSystemTypes(systemTypesRes.data?.[0] || []);
        setProviders(providersRes.data?.[0] || []);
        setDomains(domainsRes.data?.[0] || []);
        setImpactRatioOptions(impactRatioRes.data || []);
      } catch (error) {
        console.error('Error loading catalogs:', error);
        toast.error(t('application.diagram.messages.error.loadingCatalogs'));
      } finally {
        setLoadingCatalogs(false);
      }
    };

    loadCatalogs();
  }, [open, t]);

  // Cargar datos cuando se abre el modal en modo edición
  const loadapplicationData = useCallback(async () => {
    if (!applicationId) return;

    setLoading(true);
    try {
      const response = await GetApplicationTableByIdService(applicationId);
      if (response?.data) {
        const data = response.data;
        setFormData({
          name: data.name || '',
          description: data.description || '',
          architecture: data.architecture || false,
          sla: data.sla || false,
          code: data.code || '',
          nomenclature: data.nomenclature || '',
          provider: data.provider ? { id: data.provider.id } : { id: 0 },
          systemType: data.systemType ? { id: data.systemType.id } : { id: 0 },
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
          impactLevel: data.impactLevel || 1,
        });
      }
    } catch (error) {
      console.error('Error loading application data:', error);
      toast.error(t('application.table.messages.error.loading'));
    } finally {
      setLoading(false);
    }
  }, [applicationId, t]);

  // Efecto para cargar datos cuando se abre el modal
  useEffect(() => {
    if (open) {
      if (applicationId) {
        loadapplicationData();
      } else {
        // Resetear formulario para modo creación
        setFormData({
          name: '',
          description: '',
          architecture: false,
          sla: false,
          code: '',
          nomenclature: '',
          provider: { id: 0 },
          systemType: { id: 0 },
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
          impactLevel: 1,
        });
      }
    }
  }, [open, applicationId, loadapplicationData]); // [open, applicationId, loadapplicationData]

  // Manejar cambios en los campos
  const handleChange = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Validar formulario
  const isFormValid = () =>
    formData.name.trim() !== '' &&
    formData.description.trim() !== '' &&
    formData.code.trim() !== '' &&
    formData.nomenclature.trim() !== '' &&
    formData.provider.id > 0 &&
    formData.systemType.id > 0 &&
    formData.Domains.id > 0;

  // Guardar o actualizar
  const handleSave = async () => {
    if (!isFormValid()) {
      toast.error(t('application.table.messages.error.validation'));
      return;
    }

    setSaving(true);
    try {
      await SaveOrUpdateApplicationTableService(formData, applicationId);
      toast.success(
        applicationId
          ? t('application.table.messages.success.updated')
          : t('application.table.messages.success.created')
      );
      onSave(); // Recargar la tabla
      onClose(); // Cerrar el modal
    } catch (error) {
      console.error('Error saving application:', error);
      toast.error(
        applicationId
          ? t('application.table.messages.error.updating')
          : t('application.table.messages.error.creating')
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
      {...other}
    >
      <DialogTitle>
        {applicationId
          ? t('application.table.dialogs.edit.title')
          : t('application.table.dialogs.create.title')}
      </DialogTitle>

      <DialogContent dividers>
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
          <Stack spacing={3} sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label={t('application.table.table.columns.name')}
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              disabled={saving}
            />

            <TextField
              fullWidth
              label={t('application.table.table.columns.description')}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              multiline
              rows={3}
              required
              disabled={saving}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                fullWidth
                label={t('application.table.table.columns.nomenclature')}
                value={formData.nomenclature}
                onChange={(e) => handleChange('nomenclature', e.target.value)}
                required
                disabled={saving}
              />

              <TextField
                fullWidth
                label={t('application.table.table.columns.code')}
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value)}
                required
                disabled={saving}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <Autocomplete
                fullWidth
                options={systemTypes}
                getOptionLabel={(option) => option.name || ''}
                value={systemTypes.find((st) => st.id === formData.systemType.id) || null}
                onChange={(_, newValue) => handleChange('systemType', { id: newValue?.id || 0 })}
                disabled={saving || loadingCatalogs}
                loading={loadingCatalogs}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('application.diagram.dialogs.form.dataType.label')}
                    required
                  />
                )}
              />

              <Autocomplete
                fullWidth
                options={providers}
                getOptionLabel={(option) => option.name || ''}
                value={providers.find((p) => p.id === formData.provider.id) || null}
                onChange={(_, newValue) => handleChange('provider', { id: newValue?.id || 0 })}
                disabled={saving || loadingCatalogs}
                loading={loadingCatalogs}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('application.diagram.dialogs.form.provider.label')}
                    required
                  />
                )}
              />
            </Box>

            <Autocomplete
              fullWidth
              options={domains}
              getOptionLabel={(option) => (option.code && option.name ? `${option.code} - ${option.name}` : '')}
              value={domains.find((d) => d.id === formData.Domains.id) || null}
              onChange={(_, newValue) => handleChange('Domains', { id: newValue?.id || 0 })}
              disabled={saving || loadingCatalogs}
              loading={loadingCatalogs}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('application.diagram.dialogs.form.domain.label')}
                  required
                />
              )}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                fullWidth
                label={t('application.diagram.dialogs.form.contractedCapacity.label')}
                value={formData.contractedCapacity}
                onChange={(e) => handleChange('contractedCapacity', e.target.value)}
                disabled={saving}
              />

              <TextField
                fullWidth
                label={t('application.diagram.dialogs.form.contract.label')}
                value={formData.contract}
                onChange={(e) => handleChange('contract', e.target.value)}
                disabled={saving}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                fullWidth
                type="date"
                label={t('application.diagram.dialogs.form.adoptionContractDate.label')}
                value={formData.adoptionContractDate}
                onChange={(e) => handleChange('adoptionContractDate', e.target.value)}
                disabled={saving}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                fullWidth
                type="date"
                label={t('application.diagram.dialogs.form.expirationDate.label')}
                value={formData.expirationDate}
                onChange={(e) => handleChange('expirationDate', e.target.value)}
                disabled={saving}
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                fullWidth
                type="date"
                label={t('application.diagram.dialogs.form.renewalDate.label')}
                value={formData.renewalDate}
                onChange={(e) => handleChange('renewalDate', e.target.value)}
                disabled={saving}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                fullWidth
                type="date"
                label={t('application.diagram.dialogs.form.obsolescenceDate.label')}
                value={formData.obsolescenceDate}
                onChange={(e) => handleChange('obsolescenceDate', e.target.value)}
                disabled={saving}
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.architecture}
                    onChange={(e) => handleChange('architecture', e.target.checked)}
                    disabled={saving}
                  />
                }
                label={t('application.table.table.columns.architecture')}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.requiresSla}
                    onChange={(e) => handleChange('requiresSla', e.target.checked)}
                    disabled={saving}
                  />
                }
                label={t('application.table.table.columns.requiresSla')}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.hasSla}
                    onChange={(e) => handleChange('hasSla', e.target.checked)}
                    disabled={saving}
                  />
                }
                label={t('application.table.table.columns.hasSla')}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.sla}
                    onChange={(e) => handleChange('sla', e.target.checked)}
                    disabled={saving}
                  />
                }
                label={t('application.table.table.columns.sla')}
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
                    label={t('application.diagram.dialogs.form.impactRatio.label')}
                  />
                )}
              />

              <TextField
                fullWidth
                type="number"
                label={t('application.diagram.dialogs.form.impactLevel.label')}
                value={formData.impactLevel}
                onChange={(e) => handleChange('impactLevel', Number(e.target.value))}
                disabled={saving}
                inputProps={{ min: 1, max: 10 }}
              />
            </Box>

          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          {t('application.table.actions.cancel')}
        </Button>
        <LoadingButton
          variant="contained"
          onClick={handleSave}
          loading={saving}
          disabled={loading || !isFormValid()}
        >
          {applicationId
            ? t('application.table.actions.update')
            : t('application.table.actions.save')}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
