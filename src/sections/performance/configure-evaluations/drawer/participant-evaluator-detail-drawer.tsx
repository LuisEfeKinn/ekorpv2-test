'use client';

import type { IParticipantEvaluator } from 'src/types/performance';

import { useBoolean } from 'minimal-shared/hooks';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Collapse from '@mui/material/Collapse';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Autocomplete from '@mui/material/Autocomplete';
import { alpha, useTheme } from '@mui/material/styles';
import TableContainer from '@mui/material/TableContainer';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import { GetPerformanceRelatedDataService } from 'src/services/performance/related-data.service';
import { GetUserManagmentPaginationService } from 'src/services/employees/user-managment.service';
import {
  DeleteEvaluatorAssignmentService,
  UpdateEvaluatorAssignmentService,
  ListEvaluatorsByParticipantService,
} from 'src/services/performance/configure-evaluations.service';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';

// ----------------------------------------------------------------------

type EmployeeOption = {
  id: string;
  firstName: string;
  firstLastName: string;
  email: string;
};

type RelationshipOption = {
  value: string;
  label: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  participantId: string;
  assignmentId: string;
  participantName: string;
};

// ----------------------------------------------------------------------

export function ParticipantEvaluatorDetailDrawer({
  open,
  onClose,
  campaignId,
  participantId,
  assignmentId,
  participantName,
}: Props) {
  const { t } = useTranslate('performance');
  const theme = useTheme();

  const showUpdateForm = useBoolean();
  const updating = useBoolean();
  const deleting = useBoolean();
  const confirmDelete = useBoolean();

  const [loading, setLoading] = useState(false);
  const [evaluators, setEvaluators] = useState<IParticipantEvaluator[]>([]);
  const [evaluatorToDelete, setEvaluatorToDelete] = useState<IParticipantEvaluator | null>(null);

  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeOption | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<RelationshipOption | null>(null);
  const [weight, setWeight] = useState<number>(0.5);

  const [employeeOptions, setEmployeeOptions] = useState<EmployeeOption[]>([]);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [relationshipOptions, setRelationshipOptions] = useState<RelationshipOption[]>([]);
  const [relationshipLoading, setRelationshipLoading] = useState(false);

  const fetchEvaluators = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      const response = await ListEvaluatorsByParticipantService(campaignId, participantId);
      setEvaluators(response.data?.data || []);
    } catch (error) {
      console.error('Error loading evaluators:', error);
      setEvaluators([]);
    } finally {
      setLoading(false);
    }
  }, [open, campaignId, participantId]);

  const fetchEmployees = useCallback(async (search: string) => {
    setEmployeeLoading(true);
    try {
      const response = await GetUserManagmentPaginationService({ page: 1, perPage: 20, search: search || undefined });
      const employees = response.data?.data || [];
      setEmployeeOptions(
        employees.map((emp: any) => ({
          id: emp.id,
          firstName: emp.firstName || '',
          firstLastName: emp.firstLastName || '',
          email: emp.email || '',
        }))
      );
    } catch {
      setEmployeeOptions([]);
    } finally {
      setEmployeeLoading(false);
    }
  }, []);

  const fetchRelationships = useCallback(async () => {
    setRelationshipLoading(true);
    try {
      const response = await GetPerformanceRelatedDataService({});
      setRelationshipOptions(response.data?.data?.evaluationRelationships || []);
    } catch {
      setRelationshipOptions([]);
    } finally {
      setRelationshipLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvaluators();
  }, [fetchEvaluators]);

  useEffect(() => {
    if (showUpdateForm.value) {
      fetchRelationships();
      fetchEmployees('');
    }
  }, [showUpdateForm.value, fetchRelationships, fetchEmployees]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (showUpdateForm.value) fetchEmployees(employeeSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [employeeSearch, showUpdateForm.value, fetchEmployees]);

  const translateRelationship = (relationship: string) =>
    t(`campaign-participants.evaluatorsDialog.relationships.${relationship}`);

  const formatWeight = (weightValue: number) => `${(weightValue * 100).toFixed(0)}%`;

  const getEmployeeLabel = (option: EmployeeOption) =>
    `${option.firstName || ''} ${option.firstLastName || ''}`.trim() || '-';

  const handleUpdateEvaluator = async () => {
    if (!selectedEmployee || !selectedRelationship) {
      toast.error(t('campaign-participants.evaluatorsDialog.updateForm.validation.required'));
      return;
    }
    updating.onTrue();
    try {
      await UpdateEvaluatorAssignmentService(campaignId, assignmentId, {
        evaluatorEmployeeId: Number(selectedEmployee.id),
        relationship: selectedRelationship.value,
        weight,
      });
      toast.success(t('campaign-participants.evaluatorsDialog.updateForm.success'));
      setSelectedEmployee(null);
      setSelectedRelationship(null);
      setWeight(0.5);
      showUpdateForm.onFalse();
      await fetchEvaluators();
    } catch (error: any) {
      toast.error(t(error?.message) || t('campaign-participants.evaluatorsDialog.updateForm.error'));
    } finally {
      updating.onFalse();
    }
  };

  const handleCancelUpdate = () => {
    setSelectedEmployee(null);
    setSelectedRelationship(null);
    setWeight(0.5);
    showUpdateForm.onFalse();
  };

  const handleWeightChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    if (!Number.isNaN(value) && value >= 0 && value <= 1) {
      setWeight(Math.round(value * 10) / 10);
    }
  };

  const handleOpenDeleteDialog = (evaluator: IParticipantEvaluator) => {
    setEvaluatorToDelete(evaluator);
    confirmDelete.onTrue();
  };

  const handleDeleteEvaluator = async () => {
    if (!evaluatorToDelete) return;
    deleting.onTrue();
    try {
      await DeleteEvaluatorAssignmentService(campaignId, evaluatorToDelete.id);
      toast.success(t('campaign-participants.evaluatorsDialog.deleteConfirm.success'));
      confirmDelete.onFalse();
      setEvaluatorToDelete(null);
      await fetchEvaluators();
    } catch (error: any) {
      toast.error(t(error?.message) || t('campaign-participants.evaluatorsDialog.deleteConfirm.error'));
    } finally {
      deleting.onFalse();
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 720, md: 860 },
            display: 'flex',
            flexDirection: 'column',
            zIndex: (th) => th.zIndex.drawer + 2,
          },
        }}
      >
        {/* ── Header ── */}
        <Box
          sx={{
            px: 3,
            py: 2.5,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            borderBottom: `1px solid ${alpha(theme.palette.grey[500], 0.16)}`,
            flexShrink: 0,
          }}
        >
          <Button
            startIcon={<Iconify icon="solar:reply-bold" />}
            variant="outlined"
            color="inherit"
            size="small"
            onClick={onClose}
          >
            {t('campaign-participants.evaluatorsDialog.back')}
          </Button>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" noWrap>
              {t('campaign-participants.evaluatorsDialog.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {participantName}
            </Typography>
          </Box>
        </Box>

        {/* ── Content ── */}
        <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 3 }}>
          {/* Add evaluator button */}
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={showUpdateForm.onTrue}
              disabled={showUpdateForm.value}
            >
              {t('campaign-participants.evaluatorsDialog.updateForm.buttonText')}
            </Button>
          </Box>

          {/* Add evaluator form */}
          <Collapse in={showUpdateForm.value}>
            <Box
              sx={{
                p: 2.5,
                mb: 3,
                borderRadius: 1.5,
                bgcolor: alpha(theme.palette.primary.main, 0.04),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>
                {t('campaign-participants.evaluatorsDialog.updateForm.title')}
              </Typography>

              <Stack spacing={2.5}>
                <Autocomplete
                  fullWidth
                  options={employeeOptions}
                  value={selectedEmployee}
                  onChange={(_, newValue) => setSelectedEmployee(newValue)}
                  onInputChange={(_, newInputValue) => setEmployeeSearch(newInputValue)}
                  getOptionLabel={getEmployeeLabel}
                  loading={employeeLoading}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  renderOption={(props, option) => (
                    <Box component="li" {...props} key={option.id}>
                      <Stack>
                        <Typography variant="body2">{getEmployeeLabel(option)}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.email || '-'}
                        </Typography>
                      </Stack>
                    </Box>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('campaign-participants.evaluatorsDialog.updateForm.fields.employee')}
                      placeholder={t('campaign-participants.evaluatorsDialog.updateForm.fields.employeePlaceholder')}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {employeeLoading ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />

                <Autocomplete
                  fullWidth
                  options={relationshipOptions}
                  value={selectedRelationship}
                  onChange={(_, newValue) => setSelectedRelationship(newValue)}
                  getOptionLabel={(option) => translateRelationship(option.value)}
                  loading={relationshipLoading}
                  isOptionEqualToValue={(option, value) => option.value === value.value}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('campaign-participants.evaluatorsDialog.updateForm.fields.relationship')}
                      placeholder={t('campaign-participants.evaluatorsDialog.updateForm.fields.relationshipPlaceholder')}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {relationshipLoading ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />

                <TextField
                  fullWidth
                  type="number"
                  label={t('campaign-participants.evaluatorsDialog.updateForm.fields.weight')}
                  value={weight}
                  onChange={handleWeightChange}
                  inputProps={{ step: 0.1, min: 0, max: 1 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Typography variant="caption" color="text.secondary">
                          ({formatWeight(weight)})
                        </Typography>
                      </InputAdornment>
                    ),
                  }}
                  helperText={t('campaign-participants.evaluatorsDialog.updateForm.fields.weightHelper')}
                />

                <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                  <Button variant="outlined" color="inherit" onClick={handleCancelUpdate}>
                    {t('campaign-participants.evaluatorsDialog.updateForm.cancel')}
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleUpdateEvaluator}
                    disabled={updating.value || !selectedEmployee || !selectedRelationship}
                    startIcon={updating.value ? <CircularProgress size={16} color="inherit" /> : null}
                  >
                    {updating.value
                      ? t('campaign-participants.evaluatorsDialog.updateForm.saving')
                      : t('campaign-participants.evaluatorsDialog.updateForm.save')}
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </Collapse>

          <Divider sx={{ mb: 3 }} />

          {/* Evaluators list */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : evaluators.length === 0 ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 8,
                borderRadius: 2,
                border: `2px dashed ${alpha(theme.palette.grey[500], 0.2)}`,
                bgcolor: alpha(theme.palette.grey[500], 0.04),
              }}
            >
              <Iconify
                icon="solar:user-plus-bold"
                width={40}
                sx={{ color: 'text.disabled', mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                {t('campaign-participants.evaluatorsDialog.empty')}
              </Typography>
            </Box>
          ) : (
            <Scrollbar>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {t('campaign-participants.evaluatorsDialog.columns.evaluatorName')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {t('campaign-participants.evaluatorsDialog.columns.relationship')}
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>
                        {t('campaign-participants.evaluatorsDialog.columns.weight')}
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>
                        {t('campaign-participants.evaluatorsDialog.columns.completed')}
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>
                        {t('campaign-participants.evaluatorsDialog.columns.actions')}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {evaluators.map((evaluator) => (
                      <TableRow key={evaluator.id} hover>
                        <TableCell>
                          <Label variant="soft">
                            {evaluator.evaluatorEmployee?.fullName || '-'}
                          </Label>
                        </TableCell>
                        <TableCell>
                          <Label variant="soft" color="info">
                            {translateRelationship(evaluator.relationship)}
                          </Label>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight={600}>
                            {formatWeight(evaluator.weight)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Label
                            variant="soft"
                            color={evaluator.completed ? 'success' : 'warning'}
                          >
                            {evaluator.completed
                              ? t('campaign-participants.evaluatorsDialog.completedYes')
                              : t('campaign-participants.evaluatorsDialog.completedNo')}
                          </Label>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleOpenDeleteDialog(evaluator)}
                          >
                            <Iconify icon="solar:trash-bin-trash-bold" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Scrollbar>
          )}
        </Box>
      </Drawer>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={confirmDelete.value}
        onClose={() => {
          confirmDelete.onFalse();
          setEvaluatorToDelete(null);
        }}
        title={t('campaign-participants.evaluatorsDialog.deleteConfirm.title')}
        content={t('campaign-participants.evaluatorsDialog.deleteConfirm.content', {
          name: evaluatorToDelete?.evaluatorEmployee?.fullName || '-',
        })}
        action={
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteEvaluator}
            disabled={deleting.value}
            startIcon={deleting.value ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {deleting.value
              ? t('campaign-participants.evaluatorsDialog.deleteConfirm.deleting')
              : t('campaign-participants.evaluatorsDialog.deleteConfirm.delete')}
          </Button>
        }
      />
    </>
  );
}
