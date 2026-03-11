import type {
  ILearningPathOption,
  ILearningPathAssignment,
  IAssignLearningPathPayload,
} from 'src/types/employees';

import { useState, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  List,
  Alert,
  Button,
  Dialog,
  ListItem,
  TextField,
  IconButton,
  Typography,
  DialogTitle,
  Autocomplete,
  ListItemText,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';

import { useTranslate } from 'src/locales';
import { GetLearningPathsPaginationService } from 'src/services/learning/learningPaths.service';
import {
  GetLearningPathsForEmployeeIdService,
  AssignLearningPathsToUserManagementService,
  RemoveLearningPathsFromUserManagementService,
} from 'src/services/employees/user-managment.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  userId: string;
};

export function LearningPathsManagementModal({ open, onClose, userId }: Props) {
  const { t: tUsers } = useTranslate('employees');
  const { t: tCommon } = useTranslate('common');

  // Estado para las asignaciones existentes
  const [assignments, setAssignments] = useState<ILearningPathAssignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  // Estado para el modo de asignación
  const [showAssignSelector, setShowAssignSelector] = useState(false);
  const [selectedLearningPath, setSelectedLearningPath] = useState<ILearningPathOption | null>(null);

  // Estado para el autocomplete de rutas de aprendizaje
  const [learningPathOptions, setLearningPathOptions] = useState<ILearningPathOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Estado para acciones de guardado/eliminación
  const [isAssigning, setIsAssigning] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Estado para el dialog de confirmación de eliminación
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [learningPathToDelete, setLearningPathToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Cargar asignaciones existentes
  const loadAssignments = useCallback(async () => {
    if (!userId) return;

    setLoadingAssignments(true);
    try {
      const response = await GetLearningPathsForEmployeeIdService(userId);
      if (response?.data?.data) {
        // La respuesta ahora es un array simple con {id, name}
        setAssignments(response.data.data);
      }
    } catch (error) {
      console.error('Error loading learning path assignments:', error);
      toast.error(tUsers('user-management.learning-paths.error.loading'));
    } finally {
      setLoadingAssignments(false);
    }
  }, [userId, tUsers]);

  // Cargar opciones de rutas de aprendizaje para el autocomplete
  const loadLearningPathOptions = useCallback(async (search = '') => {
    setLoadingOptions(true);
    try {
      const response = await GetLearningPathsPaginationService({
        page: 1,
        perPage: 20,
        search,
      });

      if (response?.data?.data) {
        const options: ILearningPathOption[] = response.data.data.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          positionName: item.positionName,
          isActive: item.isActive,
        }));
        setLearningPathOptions(options);
      }
    } catch (error) {
      console.error('Error loading learning paths:', error);
      toast.error(tUsers('user-management.learning-paths.error.loadingOptions'));
    } finally {
      setLoadingOptions(false);
    }
  }, [tUsers]);

  // Cargar asignaciones al abrir el modal
  useEffect(() => {
    if (open && userId) {
      loadAssignments();
    }
  }, [open, userId, loadAssignments]);

  // Cargar opciones cuando se muestra el selector
  useEffect(() => {
    if (showAssignSelector) {
      loadLearningPathOptions(searchText);
    }
  }, [showAssignSelector, searchText, loadLearningPathOptions]);

  // Manejar búsqueda en el autocomplete
  const handleSearchChange = (event: React.SyntheticEvent, value: string) => {
    setSearchText(value);
  };

  // Asignar nueva ruta de aprendizaje
  const handleAssignLearningPath = async () => {
    if (!selectedLearningPath) return;

    setIsAssigning(true);
    try {
      const payload: IAssignLearningPathPayload = {
        learningPathId: parseInt(selectedLearningPath.id, 10),
      };

      await AssignLearningPathsToUserManagementService(userId, payload);

      toast.success(tUsers('user-management.learning-paths.success.assigned'));

      // Recargar asignaciones
      await loadAssignments();

      // Resetear el selector
      setShowAssignSelector(false);
      setSelectedLearningPath(null);
      setSearchText('');
    } catch (error: any) {
      console.error('Error assigning learning path:', error);

      const errorMessage =
        error?.response?.data?.message ||
        tUsers('user-management.learning-paths.error.assigning');

      toast.error(errorMessage);
    } finally {
      setIsAssigning(false);
    }
  };

  // Eliminar asignación de ruta de aprendizaje
  const handleRemoveLearningPath = async (learningPathId: string) => {
    setDeletingId(learningPathId);
    try {
      await RemoveLearningPathsFromUserManagementService(learningPathId);

      toast.success(tUsers('user-management.learning-paths.success.removed'));

      // Recargar asignaciones
      await loadAssignments();
    } catch (error: any) {
      console.error('Error removing learning path:', error);

      const errorMessage =
        error?.response?.data?.message ||
        tUsers('user-management.learning-paths.error.removing');

      toast.error(errorMessage);
    } finally {
      setDeletingId(null);
      setDeleteConfirmOpen(false);
      setLearningPathToDelete(null);
    }
  };

  // Abrir dialog de confirmación para eliminar
  const handleOpenDeleteConfirm = (id: string, name: string) => {
    setLearningPathToDelete({ id, name });
    setDeleteConfirmOpen(true);
  };

  // Cerrar dialog de confirmación
  const handleCloseDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setLearningPathToDelete(null);
  };

  // Confirmar eliminación
  const handleConfirmDelete = () => {
    if (learningPathToDelete) {
      handleRemoveLearningPath(learningPathToDelete.id);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {tUsers('user-management.learning-paths.title')}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() => setShowAssignSelector(true)}
            disabled={showAssignSelector}
          >
            {tUsers('user-management.learning-paths.actions.assign')}
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Selector para asignar nueva ruta */}
        {showAssignSelector && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
            <Box display="flex" gap={1} alignItems="flex-start">
              <Autocomplete
                fullWidth
                options={learningPathOptions}
                getOptionLabel={(option) => option.name}
                loading={loadingOptions}
                value={selectedLearningPath}
                onChange={(event, newValue) => setSelectedLearningPath(newValue)}
                onInputChange={handleSearchChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={tUsers('user-management.learning-paths.fields.learningPath.label')}
                    placeholder={tUsers('user-management.learning-paths.fields.learningPath.placeholder')}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingOptions ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props as any;
                  return (
                    <li key={key || option.id} {...otherProps}>
                      <Box>
                        <Typography variant="body2">{option.name}</Typography>
                        {option.positionName && (
                          <Typography variant="caption" color="text.secondary">
                            {option.positionName}
                          </Typography>
                        )}
                      </Box>
                    </li>
                  );
                }}
              />
              <LoadingButton
                variant="contained"
                color="primary"
                onClick={handleAssignLearningPath}
                loading={isAssigning}
                disabled={!selectedLearningPath || isAssigning}
                sx={{ minWidth: 100 }}
              >
                <Iconify icon="solar:check-circle-bold" />
              </LoadingButton>
              <IconButton
                onClick={() => {
                  setShowAssignSelector(false);
                  setSelectedLearningPath(null);
                  setSearchText('');
                }}
                disabled={isAssigning}
              >
                <Iconify icon="mingcute:close-line" />
              </IconButton>
            </Box>
          </Box>
        )}

        {/* Lista de asignaciones */}
        {loadingAssignments ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : assignments.length === 0 ? (
          <Alert severity="info">
            {tUsers('user-management.learning-paths.emptyState.noAssignments')}
          </Alert>
        ) : (
          <List>
            {assignments.map((assignment) => (
              <ListItem
                key={assignment.id}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleOpenDeleteConfirm(assignment.id, assignment.name)}
                    disabled={deletingId === assignment.id}
                    color="error"
                  >
                    {deletingId === assignment.id ? (
                      <CircularProgress size={24} />
                    ) : (
                      <Iconify icon="solar:trash-bin-trash-bold" />
                    )}
                  </IconButton>
                }
              >
                <ListItemText
                  primary={
                    <Typography variant="subtitle2">
                      {assignment.name}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          {tCommon('actions.close')}
        </Button>
      </DialogActions>

      {/* Dialog de confirmación para eliminar */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleCloseDeleteConfirm}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {tUsers('user-management.learning-paths.dialogs.deleteConfirmation.title')}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            {tUsers('user-management.learning-paths.dialogs.deleteConfirmation.message', {
              name: learningPathToDelete?.name || '',
            })}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {tUsers('user-management.learning-paths.dialogs.deleteConfirmation.description')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfirm} variant="outlined">
            {tUsers('user-management.learning-paths.dialogs.deleteConfirmation.cancel')}
          </Button>
          <LoadingButton
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            loading={deletingId !== null}
            disabled={deletingId !== null}
          >
            {tUsers('user-management.learning-paths.dialogs.deleteConfirmation.confirm')}
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
