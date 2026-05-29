import type { IState, ICategory, IAssetsItem, IInventoryAssignmentInput } from 'src/types/assets';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Avatar from '@mui/material/Avatar';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import Autocomplete from '@mui/material/Autocomplete';
import TableContainer from '@mui/material/TableContainer';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fDate } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';
import { GetCategoriesPaginationService } from 'src/services/assets/categories.service';
import {
  GetInventoryByIdService,
  GetInventoryStatesService,
  InventoryAssignmentsService,
  SaveOrUpdateInventoryService,
} from 'src/services/assets/inventory.service';

import { toast } from 'src/components/snackbar';
import { Form } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { InventoryAssignmentDialog } from './inventory-assignment-dialog';

// ----------------------------------------------------------------------

export type InventoryCreateSchemaType = {
  internalId: string;
  name: string;
  isActive: boolean;
  note: string;
  categoryId: ICategory | null;
  stateId: IState | null;
  serial: string;
  purchaseDate: string;
  purchaseValue: number | null;
  depreciationDate: string;
  warrantyExpiration: string;
};

// ----------------------------------------------------------------------

type Props = {
  currentInventoryItem?: IAssetsItem;
};


export function InventoryCreateEditForm({ currentInventoryItem }: Props) {
  const router = useRouter();
  const { t } = useTranslate('assets');

  const [categoryOptions, setCategoryOptions] = useState<ICategory[]>([]);
  const [stateOptions, setStateOptions] = useState<IState[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [stateLoading, setStateLoading] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [stateSearch, setStateSearch] = useState('');
  const [purchaseValueDisplay, setPurchaseValueDisplay] = useState('');
  const [currentAssignments, setCurrentAssignments] = useState(currentInventoryItem?.currentAssignments || []);
  const [pendingAssignments, setPendingAssignments] = useState<IInventoryAssignmentInput[]>([]);
  
  const assignmentDialog = useBoolean();
  const confirmSaveDialog = useBoolean();

  const toIsoDateString = (value: string) => {
    if (!value) return value;
    if (value.includes('T')) return value;
    return new Date(`${value}T00:00:00.000Z`).toISOString();
  };

  const parsePurchaseValue = useCallback((value: string | number | null | undefined) => {
    if (value === null || value === undefined || value === '') return null;

    const rawValue = String(value).trim();
    const digitsOnly = rawValue.replace(/\D/g, '');

    if (!digitsOnly) return null;

    return Number(digitsOnly);
  }, []);

  const formatPurchaseValueDisplay = useCallback((value: string | number | null | undefined) => {
    const parsed = parsePurchaseValue(value);
    if (parsed === null) return '';

    return parsed.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }, [parsePurchaseValue]);

  // Función para cargar categorías (lazy loading)
  const loadCategories = async (search: string = '') => {
    setCategoryLoading(true);
    try {
      const res = await GetCategoriesPaginationService({ page: 1, perPage: 50, search }) as { data?: { data: ICategory[] } };
      setCategoryOptions(res.data?.data || []);
    } finally {
      setCategoryLoading(false);
    }
  };

  // Función para cargar estados (lazy loading)
  const loadStates = async (search: string = '') => {
    setStateLoading(true);
    try {
      const res = await GetInventoryStatesService({ page: 1, perPage: 20, search }) as { data?: { data: IState[] } };
      setStateOptions(res.data?.data || []);
    } finally {
      setStateLoading(false);
    }
  };

  // Función para recargar el inventario después de asignar
  const reloadInventoryData = useCallback(async () => {
    if (currentInventoryItem?.id) {
      try {
        const response = await GetInventoryByIdService(currentInventoryItem.id);
        if (response?.data?.data?.currentAssignments) {
          setCurrentAssignments(response.data.data.currentAssignments);
        }
      } catch (error) {
        console.error('Error reloading inventory data:', error);
      }
    }
  }, [currentInventoryItem?.id]);

  const InventorySchema = z.object({
    internalId: z.string().trim().min(1, { message: t('inventory.form.internalId.required') }),
    name: z.string().trim().min(1, { message: t('inventory.form.name.required') }),
    isActive: z.boolean(),
    note: z.string().optional(),
    categoryId: z
      .custom<ICategory>()
      .nullable()
      .refine((val) => !!val, { message: t('inventory.form.category.required') })
      .refine((val) => !val || !Number.isNaN(Number(val.id)), {
        message: t('inventory.form.category.required'),
      }),
    stateId: z
      .custom<IState>()
      .nullable()
      .refine((val) => !!val, { message: t('inventory.form.state.required') }),
    serial: z.string().trim().min(1, { message: t('inventory.form.serial.required') }),
    purchaseDate: z
      .string()
      .trim()
      .min(1, { message: t('inventory.form.purchaseDate.required') })
      .refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val) || !Number.isNaN(Date.parse(val)), {
        message: t('inventory.form.purchaseDate.required'),
      }),
    purchaseValue: z.number().nullable(),
    depreciationDate: z
      .string()
      .trim()
      .min(1, { message: t('inventory.form.depreciationDate.required') })
      .refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val) || !Number.isNaN(Date.parse(val)), {
        message: t('inventory.form.depreciationDate.required'),
      }),
    warrantyExpiration: z
      .string()
      .trim()
      .min(1, { message: t('inventory.form.warrantyExpiration.required') })
      .refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val) || !Number.isNaN(Date.parse(val)), {
        message: t('inventory.form.warrantyExpiration.required'),
      }),
  });

  const defaultValues: InventoryCreateSchemaType = {
    internalId: currentInventoryItem?.internalId || '',
    name: currentInventoryItem?.name || '',
    isActive: currentInventoryItem?.isActive ?? true,
    note: currentInventoryItem?.note || '',
    categoryId: currentInventoryItem?.category ? { id: currentInventoryItem.category.id, name: currentInventoryItem.category.name } as ICategory : null,
    stateId: currentInventoryItem?.state ? { id: currentInventoryItem.state.id, name: currentInventoryItem.state.name } as IState : null,
    serial: currentInventoryItem?.serial || '',
    purchaseDate: currentInventoryItem?.purchaseDate || '',
    purchaseValue: currentInventoryItem?.purchaseValue || null,
    depreciationDate: currentInventoryItem?.deprecationDate || '',
    warrantyExpiration: currentInventoryItem?.warrantyExpiration || '',
  };

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(InventorySchema),
    defaultValues,
  });

  useEffect(() => {
    setPurchaseValueDisplay(formatPurchaseValueDisplay(defaultValues.purchaseValue));
  }, [defaultValues.purchaseValue, formatPurchaseValueDisplay]);

  // Ya no necesitamos este useEffect porque los valores se cargan directamente en defaultValues

  const {
    reset,
    handleSubmit,
    trigger,
    formState: { isSubmitting, errors },
  } = methods;

  const handleOpenAssignmentDialog = async () => {
    const isValid = await trigger([
      'internalId',
      'name',
      'categoryId',
      'stateId',
      'serial',
      'purchaseDate',
      'depreciationDate',
      'warrantyExpiration',
    ]);

    if (!isValid) {
      toast.error(t('inventory.assignments.messages.completeRequiredFields'));
      return;
    }

    assignmentDialog.onTrue();
  };

  const onSubmit = handleSubmit(async (data) => {
    // Extraer id de los objetos seleccionados en Autocomplete
    const categoryObj = methods.watch('categoryId');
    const stateObj = methods.watch('stateId');

    const payload = {
      internalId: data.internalId,
      name: data.name,
      isActive: data.isActive,
      note: data.note || '',
      categoryId: categoryObj ? Number(categoryObj.id) : null,
      stateId: stateObj ? Number(stateObj.id) : null,
      serial: data.serial,
      purchaseDate: toIsoDateString(data.purchaseDate),
      purchaseValue: parsePurchaseValue(data.purchaseValue),
      depreciationDate: toIsoDateString(data.depreciationDate),
      warrantyExpiration: toIsoDateString(data.warrantyExpiration),
    };

    try {
      await SaveOrUpdateInventoryService(payload, currentInventoryItem?.id);
      reset();
      toast.success(currentInventoryItem ? t('inventory.messages.success.updateSuccess') : t('inventory.messages.success.createSuccess'));
      router.push(paths.dashboard.assets.inventory);
    } catch (error: any) {
      console.error('Error saving inventory item:', error);
      toast.error(t(error?.message ? error.message : 'inventory.messages.error.saveError'));
    }
  }, () => {
    toast.error(t('inventory.messages.error.saveError'));
  });

  const handleSaveAssignments = async (assignments: IInventoryAssignmentInput[]) => {
    // Si estamos creando (no existe currentInventoryItem), mostrar diálogo de confirmación
    if (!currentInventoryItem?.id) {
      setPendingAssignments(assignments);
      assignmentDialog.onFalse();
      confirmSaveDialog.onTrue();
      return;
    }

    // Si estamos editando, ejecutar directamente
    try {
      await InventoryAssignmentsService(currentInventoryItem.id, { assignments });
      toast.success(t('inventory.assignments.messages.success'));
      await reloadInventoryData();
      assignmentDialog.onFalse();
    } catch (error: any) {
      console.error('Error saving assignments:', error);
      toast.error(t(error?.message ? error.message : 'inventory.assignments.messages.error'));
    }
  };

  const handleConfirmSaveAndAssign = async () => {
    try {
      // Primero guardamos el inventario
      const categoryObj = methods.watch('categoryId');
      const stateObj = methods.watch('stateId');

      const payload = {
        internalId: methods.watch('internalId'),
        name: methods.watch('name'),
        isActive: methods.watch('isActive'),
        note: methods.watch('note') || '',
        categoryId: categoryObj ? Number(categoryObj.id) : null,
        stateId: stateObj ? Number(stateObj.id) : null,
        serial: methods.watch('serial'),
        purchaseDate: toIsoDateString(methods.watch('purchaseDate')),
        purchaseValue: parsePurchaseValue(methods.watch('purchaseValue')),
        depreciationDate: toIsoDateString(methods.watch('depreciationDate')),
        warrantyExpiration: toIsoDateString(methods.watch('warrantyExpiration')),
      };

      const saveResponse = await SaveOrUpdateInventoryService(payload);
      
      // Obtener el rowId de la respuesta
      const rowId = saveResponse.data?.data?.rowId;
      
      if (!rowId) {
        throw new Error('No se pudo obtener el ID del registro guardado');
      }

      // Luego guardamos las asignaciones
      await InventoryAssignmentsService(rowId.toString(), { assignments: pendingAssignments });
      
      toast.success(t('inventory.messages.success.createSuccess'));
      confirmSaveDialog.onFalse();
      router.push(paths.dashboard.assets.inventory);
    } catch (error) {
      console.error('Error saving inventory and assignments:', error);
      toast.error(t('inventory.messages.error.saveError'));
      confirmSaveDialog.onFalse();
    }
  };

  const renderDetails = () => (
    <Card>
      <Stack spacing={3} sx={{ p: 3 }}>
        <Typography variant="h6">{t('inventory.form.sections.details')}</Typography>

        <Box sx={{ display: 'grid', gap: 2 }}>
          {/* Fila 1: ID Interno, Nombre, Estado Activo */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 150px' }, gap: 2, alignItems: 'center' }}>
            <FormControl size="small">
              <TextField
                name="internalId"
                label={t('inventory.form.fields.internalId.label')}
                value={methods.watch('internalId')}
                onChange={e => methods.setValue('internalId', e.target.value, { shouldValidate: true, shouldDirty: true })}
                error={!!errors.internalId}
                helperText={errors.internalId?.message || t('inventory.form.fields.internalId.helperText')}
              />
            </FormControl>

            <FormControl size="small">
              <TextField
                name="name"
                label={t('inventory.form.fields.name.label')}
                value={methods.watch('name')}
                onChange={e => methods.setValue('name', e.target.value, { shouldValidate: true, shouldDirty: true })}
                error={!!errors.name}
                helperText={errors.name?.message || t('inventory.form.fields.name.helperText')}
              />
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={methods.watch('isActive')}
                  onChange={(e) => methods.setValue('isActive', e.target.checked)}
                />
              }
              label={t('inventory.form.fields.isActive.label')}
            />
          </Box>

          {/* Fila 2: Serial, Nota */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <FormControl size="small">
              <TextField
                name="serial"
                label={t('inventory.form.fields.serial.label')}
                value={methods.watch('serial')}
                onChange={e => methods.setValue('serial', e.target.value, { shouldValidate: true, shouldDirty: true })}
                error={!!errors.serial}
                helperText={errors.serial?.message || t('inventory.form.fields.serial.helperText')}
              />
            </FormControl>

            <FormControl size="small">
              <TextField
                name="note"
                label={t('inventory.form.fields.note.label')}
                value={methods.watch('note')}
                onChange={e => methods.setValue('note', e.target.value, { shouldDirty: true })}
                helperText={t('inventory.form.fields.note.helperText')}
              />
            </FormControl>
          </Box>

          {/* Fila 3: Categoría, Estado */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <FormControl size="small">
              <Autocomplete
                options={categoryOptions}
                loading={categoryLoading}
                getOptionLabel={(option: ICategory) => option ? option.name : ''}
                value={methods.watch('categoryId') as ICategory | null}
                onChange={(_, value) => methods.setValue('categoryId', value as ICategory | null, { shouldValidate: true, shouldDirty: true })}
                isOptionEqualToValue={(option: ICategory, value: ICategory | null) => !!value && option.id === value.id}
                onOpen={() => {
                  if (categoryOptions.length === 0 || categorySearch !== '') {
                    setCategorySearch('');
                    loadCategories();
                  }
                }}
                onInputChange={(_, value, reason) => {
                  if (reason === 'input') {
                    setCategorySearch(value);
                    loadCategories(value.trim());
                    return;
                  }

                  if (reason === 'clear') {
                    setCategorySearch('');
                    loadCategories('');
                  }
                }}
                filterOptions={(options) => options}
                renderInput={params => (
                  <TextField
                    {...params}
                    label={t('inventory.form.fields.category.label')}
                    error={!!errors.categoryId}
                    helperText={errors.categoryId?.message as string | undefined}
                  />
                )}
              />
            </FormControl>

            <FormControl size="small">
              <Autocomplete
                options={stateOptions}
                loading={stateLoading}
                getOptionLabel={(option: IState) => option ? option.name : ''}
                value={methods.watch('stateId') as IState | null}
                onChange={(_, value) => methods.setValue('stateId', value as IState | null, { shouldValidate: true, shouldDirty: true })}
                isOptionEqualToValue={(option: IState, value: IState | null) => !!value && option.id === value.id}
                onOpen={() => {
                  if (stateOptions.length === 0 || stateSearch !== '') {
                    setStateSearch('');
                    loadStates();
                  }
                }}
                onInputChange={(_, value, reason) => {
                  if (reason === 'input') {
                    setStateSearch(value);
                    loadStates(value.trim());
                    return;
                  }

                  if (reason === 'clear') {
                    setStateSearch('');
                    loadStates('');
                  }
                }}
                filterOptions={(options) => options}
                renderInput={params => (
                  <TextField
                    {...params}
                    label={t('inventory.form.fields.state.label')}
                    error={!!errors.stateId}
                    helperText={errors.stateId?.message as string | undefined}
                  />
                )}
              />
            </FormControl>
          </Box>

          {/* Fila 4: Fecha de compra, Valor de compra */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <FormControl size="small">
              <TextField
                name="purchaseDate"
                label={t('inventory.form.fields.purchaseDate.label')}
                type="date"
                value={methods.watch('purchaseDate')}
                onChange={e => methods.setValue('purchaseDate', e.target.value, { shouldValidate: true, shouldDirty: true })}
                InputLabelProps={{ shrink: true }}
                error={!!errors.purchaseDate}
                helperText={errors.purchaseDate?.message || t('inventory.form.fields.purchaseDate.helperText')}
              />
            </FormControl>

            <FormControl size="small">
              <TextField
                name="purchaseValue"
                label={t('inventory.form.fields.purchaseValue.label')}
                type="text"
                inputMode="numeric"
                value={purchaseValueDisplay}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  const onlyDigitsAndSeparators = inputValue.replace(/[^\d.,\s]/g, '');

                  setPurchaseValueDisplay(onlyDigitsAndSeparators);
                  methods.setValue('purchaseValue', parsePurchaseValue(onlyDigitsAndSeparators), {
                    shouldDirty: true,
                  });
                }}
                onBlur={() => {
                  setPurchaseValueDisplay(formatPurchaseValueDisplay(purchaseValueDisplay));
                }}
                helperText={t('inventory.form.fields.purchaseValue.helperText')}
              />
            </FormControl>
          </Box>

          {/* Fila 5: Fecha de depreciación, Vencimiento de garantía */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <FormControl size="small">
              <TextField
                name="depreciationDate"
                label={t('inventory.form.fields.depreciationDate.label')}
                type="date"
                value={methods.watch('depreciationDate')}
                onChange={e => methods.setValue('depreciationDate', e.target.value, { shouldValidate: true, shouldDirty: true })}
                InputLabelProps={{ shrink: true }}
                error={!!errors.depreciationDate}
                helperText={errors.depreciationDate?.message || t('inventory.form.fields.depreciationDate.helperText')}
              />
            </FormControl>

            <FormControl size="small">
              <TextField
                name="warrantyExpiration"
                label={t('inventory.form.fields.warrantyExpiration.label')}
                type="date"
                value={methods.watch('warrantyExpiration')}
                onChange={e => methods.setValue('warrantyExpiration', e.target.value, { shouldValidate: true, shouldDirty: true })}
                InputLabelProps={{ shrink: true }}
                error={!!errors.warrantyExpiration}
                helperText={errors.warrantyExpiration?.message || t('inventory.form.fields.warrantyExpiration.helperText')}
              />
            </FormControl>
          </Box>
        </Box>
      </Stack>
    </Card>
  );

  const renderAssignments = () => (
    <Card>
      <Stack spacing={2} sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{t('inventory.assignments.currentAssignments')}</Typography>
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:user-plus-bold" />}
            onClick={handleOpenAssignmentDialog}
          >
            {t('inventory.assignments.addAssignment')}
          </Button>
        </Stack>

        {currentAssignments && currentAssignments.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('inventory.assignments.table.employee')}</TableCell>
                  <TableCell>{t('inventory.assignments.table.assignedAt')}</TableCell>
                  <TableCell>{t('inventory.assignments.table.notes')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {assignment.employeeName?.charAt(0) || 'U'}
                        </Avatar>
                        <Typography variant="body2">{assignment.employeeName}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{fDate(assignment.assignedAt)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {assignment.notes || '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box
            sx={{
              py: 4,
              textAlign: 'center',
              color: 'text.secondary',
            }}
          >
            <Iconify icon={"solar:user-id-bold" as any} width={48} sx={{ mb: 1, opacity: 0.5 }} />
            <Typography variant="body2">{t('inventory.assignments.noAssignments')}</Typography>
          </Box>
        )}
      </Stack>
    </Card>
  );

  const renderActions = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: 'flex-start' }}>
      <Button
        size="medium"
        variant="soft"
        color="inherit"
        onClick={() => router.back()}
      >
        {t('inventory.form.actions.cancel')}
      </Button>
      <Button
        size="medium"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator={t('inventory.form.actions.saving')}
      >
        {currentInventoryItem ? t('inventory.form.actions.update') : t('inventory.form.actions.create')}
      </Button>
    </Box>
  );

  return (
    <>
      <Form methods={methods} onSubmit={onSubmit}>
        <Stack spacing={3}>
          {renderDetails()}
          {renderAssignments()}
          {renderActions()}
        </Stack>
      </Form>

      <InventoryAssignmentDialog
        open={assignmentDialog.value}
        onClose={assignmentDialog.onFalse}
        onSave={handleSaveAssignments}
      />

      <ConfirmDialog
        open={confirmSaveDialog.value}
        onClose={confirmSaveDialog.onFalse}
        title={t('inventory.assignments.confirmSave.title')}
        content={t('inventory.assignments.confirmSave.content')}
        action={
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmSaveAndAssign}
          >
            {t('inventory.assignments.confirmSave.confirm')}
          </Button>
        }
      />
    </>
  );
}