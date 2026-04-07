'use client';

import type { EmployeeOption } from './position-employees-autocomplete';
import type { IJobKm, ICompetencyKm, IOrganizationalUnit } from 'src/types/organization';

import { useDebounce } from 'minimal-shared/hooks';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import {
  GetOrganizationalUnitPaginationService,
  normalizeOrganizationalUnitListResponse,
} from 'src/services/organization/organizationalUnit.service';
import {
  GetJobsKmService,
  GetJobKmDetailService,
  CreateJobKmDetailService,
  UpdateJobKmDetailService,
  GetCompetenciesKmService,
} from 'src/services/organization/job-km.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { PositionEmployeesAutocomplete } from './position-employees-autocomplete';

// ----------------------------------------------------------------------

const BlockLabel = styled('span')(({ theme }) => ({
  ...theme.typography.caption,
  width: 120,
  flexShrink: 0,
  color: theme.vars.palette.text.secondary,
  fontWeight: theme.typography.fontWeightSemiBold,
}));

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  editPositionId?: string | null;
  onSuccess?: () => void;
};

export function PositionCreateDrawer({ open, onClose, editPositionId, onSuccess }: Props) {
  const { t } = useTranslate('organization');
  const isEdit = Boolean(editPositionId);

  // Basic fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [headquarters, setHeadquarters] = useState('');
  const [numberOfPositions, setNumberOfPositions] = useState(1);
  const [objectives, setObjectives] = useState('');
  const [loading, setLoading] = useState(false);

  // Org unit autocomplete
  const [orgUnitSearch, setOrgUnitSearch] = useState('');
  const [orgUnitOptions, setOrgUnitOptions] = useState<IOrganizationalUnit[]>([]);
  const [orgUnitLoading, setOrgUnitLoading] = useState(false);
  const [selectedOrgUnit, setSelectedOrgUnit] = useState<IOrganizationalUnit | null>(null);
  const debouncedOrgSearch = useDebounce(orgUnitSearch, 400);

  // Superior job autocomplete
  const [superiorJobSearch, setSuperiorJobSearch] = useState('');
  const [superiorJobOptions, setSuperiorJobOptions] = useState<IJobKm[]>([]);
  const [superiorJobLoading, setSuperiorJobLoading] = useState(false);
  const [selectedSuperiorJob, setSelectedSuperiorJob] = useState<IJobKm | null>(null);
  const debouncedSuperiorJobSearch = useDebounce(superiorJobSearch, 400);

  // Competencies autocomplete (multiple)
  const [competencySearch, setCompetencySearch] = useState('');
  const [competencyOptions, setCompetencyOptions] = useState<ICompetencyKm[]>([]);
  const [competencyLoading, setCompetencyLoading] = useState(false);
  const [selectedCompetencies, setSelectedCompetencies] = useState<ICompetencyKm[]>([]);
  const debouncedCompetencySearch = useDebounce(competencySearch, 400);

  // Employees autocomplete
  const [selectedEmployees, setSelectedEmployees] = useState<EmployeeOption[]>([]);

  // ----------------------------------------------------------------------
  // Fetch org units when search changes or drawer opens
  useEffect(() => {
    if (!open) return;
    setOrgUnitLoading(true);
    GetOrganizationalUnitPaginationService({
      search: debouncedOrgSearch || undefined,
      perPage: 20,
    })
      .then((res) => {
        setOrgUnitOptions(normalizeOrganizationalUnitListResponse(res.data));
      })
      .catch(console.error)
      .finally(() => setOrgUnitLoading(false));
  }, [open, debouncedOrgSearch]);

  // Fetch superior job options
  useEffect(() => {
    if (!open) return;
    setSuperiorJobLoading(true);
    GetJobsKmService({ search: debouncedSuperiorJobSearch || undefined, perPage: 20 })
      .then((res) => {
        setSuperiorJobOptions(res.data?.data || []);
      })
      .catch(console.error)
      .finally(() => setSuperiorJobLoading(false));
  }, [open, debouncedSuperiorJobSearch]);

  // Fetch competencies
  useEffect(() => {
    if (!open) return;
    setCompetencyLoading(true);
    GetCompetenciesKmService({ search: debouncedCompetencySearch || undefined, perPage: 20 })
      .then((res) => {
        setCompetencyOptions(res.data?.data?.data || []);
      })
      .catch(console.error)
      .finally(() => setCompetencyLoading(false));
  }, [open, debouncedCompetencySearch]);

  // Reset form helper
  const resetForm = useCallback(() => {
    setName('');
    setCode('');
    setHeadquarters('');
    setNumberOfPositions(1);
    setObjectives('');
    setSelectedOrgUnit(null);
    setSelectedSuperiorJob(null);
    setSelectedCompetencies([]);
    setSelectedEmployees([]);
    setOrgUnitSearch('');
    setSuperiorJobSearch('');
    setCompetencySearch('');
  }, []);

  // Load detail for edit
  useEffect(() => {
    if (!open) return;

    if (editPositionId) {
      setLoading(true);
      GetJobKmDetailService(editPositionId)
        .then((res) => {
          const detail = res.data;
          setName(detail.name || '');
          setCode(detail.code || '');
          setHeadquarters(detail.headquarters || '');
          setNumberOfPositions(detail.numberOfPositions || 1);
          setObjectives(detail.objectives || '');

          if (detail.organizationalUnit) {
            setSelectedOrgUnit({
              id: String(detail.organizationalUnit.id),
              name: detail.organizationalUnit.name,
              code: '',
              description: '',
              color: '',
            } as IOrganizationalUnit);
          } else {
            setSelectedOrgUnit(null);
          }

          if (detail.superiorJob) {
            setSelectedSuperiorJob({
              id: detail.superiorJob.id,
              name: detail.superiorJob.name,
              code: detail.superiorJob.code || '',
            } as IJobKm);
          } else {
            setSelectedSuperiorJob(null);
          }

          setSelectedCompetencies(
            (detail.competencies || []).map((c) => ({
              id: String(c.id),
              name: c.name,
            })) as ICompetencyKm[]
          );

          setSelectedEmployees(
            (detail.employees || []).map((e) => ({
              id: String(e.id),
              name: e.fullName || e.name || '',
            }))
          );
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      resetForm();
    }
  }, [open, editPositionId, resetForm]);

  // ----------------------------------------------------------------------

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const payload = {
        name,
        code: code || undefined,
        headquarters: headquarters || undefined,
        numberOfPositions: numberOfPositions || undefined,
        objectives: objectives || undefined,
        organizationalUnitId: selectedOrgUnit ? Number(selectedOrgUnit.id) : undefined,
        superiorJobId: selectedSuperiorJob ? Number(selectedSuperiorJob.id) : undefined,
        competencyIds: selectedCompetencies.map((c) => Number(c.id)),
        employeeIds: selectedEmployees.map((e) => Number(e.id)),
      };

      if (editPositionId) {
        await UpdateJobKmDetailService(editPositionId, payload);
        toast.success(t('organigrama.messages.updateSuccess'));
      } else {
        await CreateJobKmDetailService(payload);
        toast.success(t('organigrama.messages.createSuccess'));
      }

      onSuccess?.();
    } catch (err: any) {
      console.error('Error saving position:', err);
      const apiMessage = err?.response?.data?.message || err?.message;
      toast.error(apiMessage || t('organigrama.messages.saveError'));
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------------------

  const renderToolbar = () => (
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1.5,
            bgcolor: isEdit ? 'warning.main' : 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Iconify
            icon={isEdit ? 'solar:pen-bold' : 'mingcute:add-line'}
            sx={{ color: 'white', width: 18 }}
          />
        </Box>

        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
            {isEdit
              ? t('organigrama.drawer.editPosition.title')
              : t('organigrama.drawer.createPosition.title')}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {isEdit
              ? t('organigrama.drawer.editPosition.subtitle')
              : t('organigrama.drawer.createPosition.subtitle')}
          </Typography>
        </Box>
      </Box>

      <IconButton
        onClick={onClose}
        sx={{
          color: 'text.secondary',
          '&:hover': { bgcolor: 'error.lighter', color: 'error.main' },
        }}
      >
        <Iconify icon="mingcute:close-line" />
      </IconButton>
    </Box>
  );

  const renderContent = () => (
    <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
      {/* Unidad Organizacional */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <BlockLabel>{t('organigrama.form.fields.organization.label')}</BlockLabel>
        <Autocomplete
          sx={{ flex: 1 }}
          size="small"
          options={orgUnitOptions}
          loading={orgUnitLoading}
          value={selectedOrgUnit}
          onChange={(_, newValue) => setSelectedOrgUnit(newValue)}
          inputValue={orgUnitSearch}
          onInputChange={(_, newInput) => setOrgUnitSearch(newInput)}
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          filterOptions={(x) => x}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('organigrama.form.fields.organization.placeholder')}
              slotProps={{
                input: {
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {orgUnitLoading && <CircularProgress size={14} />}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                },
              }}
            />
          )}
          renderOption={(props, option) => {
            const listProps = { ...props } as any;
            delete listProps.key;
            return (
              <Box component="li" key={String(option.id)} {...listProps} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {option.color && (
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: option.color,
                      flexShrink: 0,
                    }}
                  />
                )}
                {option.name}
              </Box>
            );
          }}
        />
      </Box>

      {/* Cargo Superior */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <BlockLabel>{t('organigrama.form.fields.parentPosition.label')}</BlockLabel>
        <Autocomplete
          sx={{ flex: 1 }}
          size="small"
          options={superiorJobOptions}
          loading={superiorJobLoading}
          value={selectedSuperiorJob}
          onChange={(_, newValue) => setSelectedSuperiorJob(newValue)}
          inputValue={superiorJobSearch}
          onInputChange={(_, newInput) => setSuperiorJobSearch(newInput)}
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          filterOptions={(x) => x}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('organigrama.form.fields.parentPosition.placeholder')}
              slotProps={{
                input: {
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {superiorJobLoading && <CircularProgress size={14} />}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                },
              }}
            />
          )}
          renderOption={(props, option) => {
            const listProps = { ...props } as any;
            delete listProps.key;
            return (
              <Box component="li" key={String(option.id)} {...listProps}>
                <Box>
                  <Typography variant="body2">{option.name}</Typography>
                  {option.code && (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {option.code}
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          }}
        />
      </Box>

      {/* Sede / Headquarters */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <BlockLabel>{t('organigrama.form.fields.location.label')}</BlockLabel>
        <TextField
          size="small"
          placeholder={t('organigrama.form.fields.location.placeholder')}
          value={headquarters}
          onChange={(e) => setHeadquarters(e.target.value)}
          sx={{ flex: 1 }}
        />
      </Box>

      {/* Código */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <BlockLabel>{t('organigrama.form.fields.code.label')}</BlockLabel>
        <TextField
          size="small"
          placeholder={t('organigrama.form.fields.code.placeholder')}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          sx={{ flex: 1 }}
        />
      </Box>

      {/* Nombre */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <BlockLabel>{t('organigrama.form.fields.positionName.label')}</BlockLabel>
        <TextField
          size="small"
          placeholder={t('organigrama.form.fields.positionName.placeholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ flex: 1 }}
          required
        />
      </Box>

      {/* Número de posiciones */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <BlockLabel>{t('organigrama.form.fields.requiredEmployees.label')}</BlockLabel>
        <TextField
          size="small"
          type="number"
          placeholder={t('organigrama.form.fields.requiredEmployees.placeholder')}
          value={numberOfPositions}
          onChange={(e) =>
            setNumberOfPositions(Math.max(1, parseInt(e.target.value, 10) || 1))
          }
          sx={{ flex: 1 }}
          helperText={t('organigrama.form.fields.requiredEmployees.helper')}
        />
      </Box>

      {/* Competencias */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
        <BlockLabel sx={{ pt: 1 }}>{t('organigrama.form.fields.skills.label')}</BlockLabel>
        <Box sx={{ flex: 1 }}>
          <Autocomplete
            multiple
            size="small"
            options={competencyOptions}
            loading={competencyLoading}
            value={selectedCompetencies}
            onChange={(_, newValue) => setSelectedCompetencies(newValue)}
            inputValue={competencySearch}
            onInputChange={(_, newInput) => setCompetencySearch(newInput)}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            filterOptions={(x) => x}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index });
                return (
                  <Chip
                    key={key}
                    label={option.name}
                    size="small"
                    color="primary"
                    variant="soft"
                    {...tagProps}
                    sx={{
                      ...(option.color && {
                        bgcolor: `${option.color}20`,
                        color: option.color,
                        borderColor: option.color,
                      }),
                    }}
                  />
                );
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={t('organigrama.form.fields.skills.add')}
                slotProps={{
                  input: {
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {competencyLoading && <CircularProgress size={14} />}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  },
                }}
              />
            )}
            renderOption={(props, option) => {
              const listProps = { ...props } as any;
              delete listProps.key;
              return (
                <Box component="li" key={String(option.id)} {...listProps} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  {option.color && (
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: option.color,
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <Box>
                    <Typography variant="body2">{option.name}</Typography>
                    {option.type?.name && (
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {option.type.name}
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            }}
          />
        </Box>
      </Box>

      {/* Empleados */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
        <BlockLabel sx={{ pt: 1 }}>{t('organigrama.form.fields.employees.label')}</BlockLabel>
        <Box sx={{ flex: 1 }}>
          <PositionEmployeesAutocomplete
            value={selectedEmployees}
            onChange={setSelectedEmployees}
            maxEmployees={numberOfPositions}
          />
        </Box>
      </Box>

      {/* Objetivos */}
      <Box sx={{ display: 'flex' }}>
        <BlockLabel>{t('organigrama.form.fields.description.label')}</BlockLabel>
        <TextField
          fullWidth
          multiline
          size="small"
          minRows={3}
          placeholder={t('organigrama.form.fields.description.placeholder')}
          value={objectives}
          onChange={(e) => setObjectives(e.target.value)}
          slotProps={{
            input: {
              sx: {
                typography: 'body2',
                '&::placeholder': { color: 'text.disabled', opacity: 1 },
              },
            },
          }}
        />
      </Box>
    </Box>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor="right"
      slotProps={{
        backdrop: { invisible: true },
        paper: { sx: { width: { xs: 1, sm: 520 } } },
      }}
    >
      {renderToolbar()}

      <Scrollbar fillContent sx={{ py: 3, px: 2.5 }}>
        {loading && editPositionId ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          renderContent()
        )}
      </Scrollbar>

      <Box
        sx={{
          p: 2.5,
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          gap: 2,
        }}
      >
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{ flex: 1 }}
          disabled={loading}
          startIcon={<Iconify icon="mingcute:close-line" />}
        >
          {t('organigrama.form.actions.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          sx={{ flex: 1 }}
          disabled={loading || !name.trim()}
          startIcon={
            loading ? (
              <CircularProgress size={16} />
            ) : (
              <Iconify icon={isEdit ? 'solar:pen-bold' : 'mingcute:add-line'} />
            )
          }
        >
          {loading
            ? t('organigrama.form.actions.saving')
            : isEdit
              ? t('organigrama.form.actions.update')
              : t('organigrama.form.actions.create')}
        </Button>
      </Box>
    </Drawer>
  );
}
