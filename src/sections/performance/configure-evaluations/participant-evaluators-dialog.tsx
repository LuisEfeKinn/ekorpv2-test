'use client';

import type { IParticipantEvaluator } from 'src/types/performance';

import { useBoolean } from 'minimal-shared/hooks';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import Collapse from '@mui/material/Collapse';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogContent from '@mui/material/DialogContent';
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

export function ParticipantEvaluatorsDialog({
  open,
  onClose,
  campaignId,
  participantId,
  assignmentId,
  participantName,
}: Props) {
  const { t } = useTranslate('performance');

  const showUpdateForm = useBoolean();
  const updating = useBoolean();
  const deleting = useBoolean();
  const confirmDelete = useBoolean();

  const [loading, setLoading] = useState(false);
  const [evaluators, setEvaluators] = useState<IParticipantEvaluator[]>([]);
  const [evaluatorToDelete, setEvaluatorToDelete] = useState<IParticipantEvaluator | null>(null);

  // Form state for updating evaluator
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeOption | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<RelationshipOption | null>(null);
  const [weight, setWeight] = useState<number>(0.5);

  // Autocomplete options
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

  // Fetch employees with search
  const fetchEmployees = useCallback(async (search: string) => {
    setEmployeeLoading(true);
    try {
      const params = {
        page: 1,
        perPage: 20,
        search: search || undefined,
      };
      const response = await GetUserManagmentPaginationService(params);
      const employees = response.data?.data || [];
      setEmployeeOptions(
        employees.map((emp: any) => ({
          id: emp.id,
          firstName: emp.firstName || '',
          firstLastName: emp.firstLastName || '',
          email: emp.email || '',
        }))
      );
    } catch (error) {
      console.error('Error loading employees:', error);
      setEmployeeOptions([]);
    } finally {
      setEmployeeLoading(false);
    }
  }, []);

  // Fetch relationships
  const fetchRelationships = useCallback(async () => {
    setRelationshipLoading(true);
    try {
      const response = await GetPerformanceRelatedDataService({});
      const relationships = response.data?.data?.evaluationRelationships || [];
      setRelationshipOptions(relationships);
    } catch (error) {
      console.error('Error loading relationships:', error);
      setRelationshipOptions([]);
    } finally {
      setRelationshipLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvaluators();
  }, [fetchEvaluators]);

  // Load relationships when form is opened
  useEffect(() => {
    if (showUpdateForm.value) {
      fetchRelationships();
      fetchEmployees('');
    }
  }, [showUpdateForm.value, fetchRelationships, fetchEmployees]);

  // Debounce employee search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (showUpdateForm.value) {
        fetchEmployees(employeeSearch);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [employeeSearch, showUpdateForm.value, fetchEmployees]);

  const translateRelationship = (relationship: string) => {
    const translationKey = `campaign-participants.evaluatorsDialog.relationships.${relationship}`;
    return t(translationKey);
  };

  const formatWeight = (weightValue: number) => `${(weightValue * 100).toFixed(0)}%`;

  const getEmployeeLabel = (option: EmployeeOption) => {
    const name = `${option.firstName || ''} ${option.firstLastName || ''}`.trim();
    return name || '-';
  };

  const handleUpdateEvaluator = async () => {
    if (!selectedEmployee || !selectedRelationship) {
      toast.error(t('campaign-participants.evaluatorsDialog.updateForm.validation.required'));
      return;
    }

    updating.onTrue();
    try {
      const dataSend = {
        evaluatorEmployeeId: Number(selectedEmployee.id),
        relationship: selectedRelationship.value,
        weight,
      };

      await UpdateEvaluatorAssignmentService(campaignId, assignmentId, dataSend);
      toast.success(t('campaign-participants.evaluatorsDialog.updateForm.success'));

      // Reset form and refresh evaluators
      setSelectedEmployee(null);
      setSelectedRelationship(null);
      setWeight(0.5);
      showUpdateForm.onFalse();
      await fetchEvaluators();
    } catch (error: any) {
      console.error('Error updating evaluator:', error);
      toast.error(
        t(error?.message) || t('campaign-participants.evaluatorsDialog.updateForm.error')
      );
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
      setWeight(Math.round(value * 10) / 10); // Round to 1 decimal
    }
  };

  const handleOpenDeleteDialog = (evaluator: IParticipantEvaluator) => {
    setEvaluatorToDelete(evaluator);
    confirmDelete.onTrue();
  };

  const handleCloseDeleteDialog = () => {
    setEvaluatorToDelete(null);
    confirmDelete.onFalse();
  };

  const handleDeleteEvaluator = async () => {
    if (!evaluatorToDelete) return;

    deleting.onTrue();
    try {
      await DeleteEvaluatorAssignmentService(campaignId, evaluatorToDelete.id);
      toast.success(t('campaign-participants.evaluatorsDialog.deleteConfirm.success'));
      handleCloseDeleteDialog();
      await fetchEvaluators();
    } catch (error: any) {
      console.error('Error deleting evaluator:', error);
      toast.error(
        t(error?.message) || t('campaign-participants.evaluatorsDialog.deleteConfirm.error')
      );
    } finally {
      deleting.onFalse();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Box>
          {t('campaign-participants.evaluatorsDialog.title')}
          <Box component="span" sx={{ ml: 1, fontWeight: 'normal', color: 'text.secondary' }}>
            - {participantName}
          </Box>
        </Box>
        <IconButton onClick={onClose} edge="end">
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Update Evaluator Button */}
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

        {/* Update Evaluator Form */}
        <Collapse in={showUpdateForm.value}>
          <Box
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 1,
              bgcolor: 'background.neutral',
              border: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              {t('campaign-participants.evaluatorsDialog.updateForm.title')}
            </Typography>

            <Stack spacing={2.5}>
              {/* Employee Autocomplete */}
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
                    placeholder={t(
                      'campaign-participants.evaluatorsDialog.updateForm.fields.employeePlaceholder'
                    )}
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

              {/* Relationship Autocomplete */}
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
                    label={t(
                      'campaign-participants.evaluatorsDialog.updateForm.fields.relationship'
                    )}
                    placeholder={t(
                      'campaign-participants.evaluatorsDialog.updateForm.fields.relationshipPlaceholder'
                    )}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {relationshipLoading ? (
                            <CircularProgress color="inherit" size={20} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />

              {/* Weight Input */}
              <TextField
                fullWidth
                type="number"
                label={t('campaign-participants.evaluatorsDialog.updateForm.fields.weight')}
                value={weight}
                onChange={handleWeightChange}
                inputProps={{
                  step: 0.1,
                  min: 0,
                  max: 1,
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Typography variant="caption" color="text.secondary">
                        ({formatWeight(weight)})
                      </Typography>
                    </InputAdornment>
                  ),
                }}
                helperText={t(
                  'campaign-participants.evaluatorsDialog.updateForm.fields.weightHelper'
                )}
              />

              {/* Form Actions */}
              <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                <Button variant="outlined" color="inherit" onClick={handleCancelUpdate}>
                  {t('campaign-participants.evaluatorsDialog.updateForm.cancel')}
                </Button>
                <Button
                  variant="contained"
                  onClick={handleUpdateEvaluator}
                  disabled={updating.value || !selectedEmployee || !selectedRelationship}
                  startIcon={
                    updating.value ? <CircularProgress size={20} color="inherit" /> : null
                  }
                >
                  {updating.value
                    ? t('campaign-participants.evaluatorsDialog.updateForm.saving')
                    : t('campaign-participants.evaluatorsDialog.updateForm.save')}
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Collapse>

        <Divider sx={{ my: 2 }} />

        {/* Evaluators List */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) : evaluators.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
            {t('campaign-participants.evaluatorsDialog.empty')}
          </Box>
        ) : (
          <Scrollbar>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>
                      {t('campaign-participants.evaluatorsDialog.columns.evaluatorName')}
                    </TableCell>
                    <TableCell>
                      {t('campaign-participants.evaluatorsDialog.columns.relationship')}
                    </TableCell>
                    <TableCell align="center">
                      {t('campaign-participants.evaluatorsDialog.columns.weight')}
                    </TableCell>
                    <TableCell align="center">
                      {t('campaign-participants.evaluatorsDialog.columns.completed')}
                    </TableCell>
                    <TableCell align="center">
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
                      <TableCell align="center">{formatWeight(evaluator.weight)}</TableCell>
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
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDelete.value}
        onClose={handleCloseDeleteDialog}
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
            startIcon={deleting.value ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {deleting.value
              ? t('campaign-participants.evaluatorsDialog.deleteConfirm.deleting')
              : t('campaign-participants.evaluatorsDialog.deleteConfirm.delete')}
          </Button>
        }
      />
    </Dialog>
  );
}
