'use client';

import type { IEmployee, IInventoryAssignmentInput } from 'src/types/assets';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useDebounce } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { IconButton, Autocomplete, CircularProgress } from '@mui/material';

import { useTranslate } from 'src/locales';
import { GetUserManagmentPaginationService } from 'src/services/employees/user-managment.service';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (assignments: IInventoryAssignmentInput[]) => Promise<void>;
};

type AssignmentFormData = {
  assignments: IInventoryAssignmentInput[];
};

export function InventoryAssignmentDialog({ open, onClose, onSave }: Props) {
  const { t } = useTranslate('assets');
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<IEmployee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const isInitialLoad = useRef(true);
  const preventSearch = useRef(false);

  const AssignmentSchema = z.object({
    assignments: z
      .array(
        z.object({
          employeeId: z.string().min(1, t('inventory.assignments.form.employee.required')),
          action: z.enum(['ASSIGN', 'UNASSIGN', 'TRANSFER', 'RETURN']),
          expectedReturnDate: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .min(1, t('inventory.assignments.form.minimumOne')),
  });

  const methods = useForm<AssignmentFormData>({
    resolver: zodResolver(AssignmentSchema),
    defaultValues: {
      assignments: [
        {
          employeeId: '',
          action: 'ASSIGN',
          expectedReturnDate: undefined,
          notes: '',
        },
      ],
    },
  });

  const { handleSubmit, watch, setValue } = methods;
  const assignments = watch('assignments');

  const loadEmployees = useCallback(async (search: string) => {
    setEmployeesLoading(true);
    try {
      const response = await GetUserManagmentPaginationService({
        page: 1,
        perPage: 20,
        search,
      });

      const mappedEmployees: IEmployee[] = (response.data?.data || []).map((emp: any) => ({
        id: emp.id,
        firstName: emp.firstName || '',
        firstLastName: emp.firstLastName || '',
        secondName: emp.secondName,
        secondLastName: emp.secondLastName,
        email: emp.email || '',
        phone: emp.phone,
      }));

      setEmployees(mappedEmployees);
    } catch (error) {
      console.error('Error loading employees:', error);
      setEmployees([]);
    } finally {
      setEmployeesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      if (isInitialLoad.current) {
        // Primera carga: cargar todos los empleados
        loadEmployees('');
        setSearchTerm('');
        isInitialLoad.current = false;
      } else if (searchTerm !== '' && !preventSearch.current) {
        // Búsqueda con debounce solo si hay término de búsqueda y no se previno
        loadEmployees(debouncedSearch);
      }
      // Reset preventSearch después de procesar
      preventSearch.current = false;
    } else {
      // Reset cuando se cierra el modal
      isInitialLoad.current = true;
      setSearchTerm('');
      setEmployees([]);
    }
  }, [open, debouncedSearch, loadEmployees, searchTerm]);

  const handleAddAssignment = () => {
    setValue('assignments', [
      ...assignments,
      {
        employeeId: '',
        action: 'ASSIGN',
        expectedReturnDate: undefined,
        notes: '',
      },
    ]);
  };

  const handleRemoveAssignment = (index: number) => {
    const newAssignments = assignments.filter((_, i) => i !== index);
    setValue('assignments', newAssignments);
  };

  const onSubmit = handleSubmit(async (data) => {
    setLoading(true);
    try {
      // Convertir employeeId a number antes de enviar
      const assignmentsToSave = data.assignments.map((assignment) => ({
        ...assignment,
        employeeId: Number(assignment.employeeId),
      }));
      await onSave(assignmentsToSave as any);
      onClose();
    } catch (error) {
      console.error('Error saving assignments:', error);
    } finally {
      setLoading(false);
    }
  });

  const getEmployeeLabel = (employee: IEmployee) => {
    const name = [employee.firstName, employee.firstLastName].filter(Boolean).join(' ');
    return `${name} (${employee.email})`;
  };

  const actionOptions = [
    { value: 'ASSIGN', label: t('inventory.assignments.actions.ASSIGN') },
    { value: 'UNASSIGN', label: t('inventory.assignments.actions.UNASSIGN') },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('inventory.assignments.title')}</DialogTitle>

      <DialogContent>
        <Form methods={methods} onSubmit={onSubmit}>
          <Stack spacing={3} sx={{ pt: 2 }}>
            {assignments.map((assignment, index) => (
              <Card key={index} sx={{ p: 2 }}>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2">
                      {t('inventory.assignments.assignmentNumber', { number: index + 1 })}
                    </Typography>
                    {assignments.length > 1 && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveAssignment(index)}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" />
                      </IconButton>
                    )}
                  </Stack>

                  <Divider />

                  <Autocomplete
                    fullWidth
                    options={employees}
                    loading={employeesLoading}
                    getOptionLabel={getEmployeeLabel}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    value={employees.find((emp) => emp.id === assignment.employeeId) || null}
                    onChange={(_, newValue) => {
                      setValue(`assignments.${index}.employeeId`, newValue?.id || '');
                      // Prevenir búsqueda al seleccionar una opción
                      preventSearch.current = true;
                    }}
                    onInputChange={(_, newInputValue, reason) => {
                      // Solo actualizar searchTerm si el usuario está escribiendo, no al seleccionar
                      if (reason === 'input') {
                        setSearchTerm(newInputValue);
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t('inventory.assignments.form.employee.label')}
                        placeholder={t('inventory.assignments.form.employee.placeholder')}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {employeesLoading ? (
                                <CircularProgress color="inherit" size={20} />
                              ) : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />

                  <Field.Select
                    name={`assignments.${index}.action`}
                    label={t('inventory.assignments.form.action.label')}
                  >
                    {actionOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Field.Select>

                  <Typography variant="caption" color="text.secondary" sx={{ mt: -1, mb: 1 }}>
                    {t('inventory.assignments.form.action.helperText')}
                  </Typography>

                  <Field.DatePicker
                    name={`assignments.${index}.expectedReturnDate`}
                    label={t('inventory.assignments.form.expectedReturnDate.label')}
                    slotProps={{
                      textField: {
                        helperText: t('inventory.assignments.form.expectedReturnDate.helperText'),
                      },
                    }}
                  />

                  <Field.Text
                    name={`assignments.${index}.notes`}
                    label={t('inventory.assignments.form.notes.label')}
                    placeholder={t('inventory.assignments.form.notes.placeholder')}
                    multiline
                    rows={3}
                  />
                </Stack>
              </Card>
            ))}

            <Box>
              <Button
                variant="outlined"
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                onClick={handleAddAssignment}
                fullWidth
              >
                {t('inventory.assignments.addAnother')}
              </Button>
            </Box>
          </Stack>
        </Form>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined" color="inherit" disabled={loading}>
          {t('inventory.form.actions.cancel')}
        </Button>
        <Button
          onClick={onSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? t('inventory.form.actions.saving') : t('inventory.assignments.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
