import { useState, useEffect, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import {
  GetIntegrationsPaginationService,
  GetCategoriesByInstanceIdService,
  GetCoursesByCategoryLmsIdService
} from 'src/services/settings/integrations.service';

// ----------------------------------------------------------------------

type IntegrationOption = {
  id: string;
  instanceName: string;
  image?: string;
};

type CategoryOption = {
  id: string;
  name: string;
  courseCount?: number;
};

type CourseOption = {
  id: string;
  fullName: string;
  lmsCourseId: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onAddCourse: (course: { courseLmsId: string; fullName: string; order: number }) => void;
  currentOrder: number;
};

export function AddCourseModal({ open, onClose, onAddCourse, currentOrder }: Props) {
  const { t } = useTranslate('learning');

  // Estados de los autocompletes
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationOption | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryOption | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<CourseOption | null>(null);

  // Estados de las opciones
  const [integrations, setIntegrations] = useState<IntegrationOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);

  // Estados de loading
  const [integrationsLoading, setIntegrationsLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(false);

  // Estados de búsqueda
  const [integrationSearch, setIntegrationSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [courseSearch, setCourseSearch] = useState('');

  // Estado del order
  const [order, setOrder] = useState<number>(currentOrder);

  // Cargar integraciones
  const loadIntegrations = useCallback(async (search: string = '') => {
    setIntegrationsLoading(true);
    try {
      const params = {
        page: 1,
        perPage: 20,
        ...(search && { search }),
      };
      const response = await GetIntegrationsPaginationService(params);
      const data = response?.data?.data || [];

      const mappedIntegrations: IntegrationOption[] = data.map((item: any) => ({
        id: item.id,
        instanceName: item.instanceName,
        image: item.integration?.image,
      }));

      setIntegrations(mappedIntegrations);
    } catch (error) {
      console.error('Error loading integrations:', error);
      setIntegrations([]);
    } finally {
      setIntegrationsLoading(false);
    }
  }, []);

  // Cargar categorías
  const loadCategories = useCallback(async (instanceId: string, search: string = '') => {
    setCategoriesLoading(true);
    try {
      const params = {
        page: 1,
        perPage: 20,
        ...(search && { search }),
      };
      const response = await GetCategoriesByInstanceIdService(instanceId, params);
      const data = response?.data?.data || [];

      const mappedCategories: CategoryOption[] = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        courseCount: item.courseCount,
      }));

      setCategories(mappedCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  // Cargar cursos
  const loadCourses = useCallback(
    async (instanceId: string, categoryId: string, search: string = '') => {
      setCoursesLoading(true);
      try {
        const params = {
          page: 1,
          perPage: 20,
          ...(search && { search }),
        };
        const response = await GetCoursesByCategoryLmsIdService(instanceId, categoryId, params);
        const data = response?.data?.data || [];

        const mappedCourses: CourseOption[] = data.map((item: any) => ({
          id: item.id,
          fullName: item.fullName,
          lmsCourseId: item.lmsCourseId,
        }));

        setCourses(mappedCourses);
      } catch (error) {
        console.error('Error loading courses:', error);
        setCourses([]);
      } finally {
        setCoursesLoading(false);
      }
    },
    []
  );

  // Efectos para cargar datos con debounce
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      loadIntegrations(integrationSearch);
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [integrationSearch, loadIntegrations]);

  useEffect(() => {
    if (selectedIntegration) {
      const delayDebounce = setTimeout(() => {
        loadCategories(selectedIntegration.id, categorySearch);
      }, 500);

      return () => clearTimeout(delayDebounce);
    }
    return undefined;
  }, [categorySearch, selectedIntegration, loadCategories]);

  useEffect(() => {
    if (selectedIntegration && selectedCategory) {
      const delayDebounce = setTimeout(() => {
        loadCourses(selectedIntegration.id, selectedCategory.id, courseSearch);
      }, 500);

      return () => clearTimeout(delayDebounce);
    }
    return undefined;
  }, [courseSearch, selectedIntegration, selectedCategory, loadCourses]);

  // Actualizar order cuando cambia currentOrder
  useEffect(() => {
    setOrder(currentOrder);
  }, [currentOrder]);

  // Limpiar datos en cascada
  const handleIntegrationChange = (newValue: IntegrationOption | null) => {
    setSelectedIntegration(newValue);
    setSelectedCategory(null);
    setSelectedCourse(null);
    setCategories([]);
    setCourses([]);
    setCategorySearch('');
    setCourseSearch('');
  };

  const handleCategoryChange = (newValue: CategoryOption | null) => {
    setSelectedCategory(newValue);
    setSelectedCourse(null);
    setCourses([]);
    setCourseSearch('');
  };

  const handleClose = () => {
    // Limpiar todos los estados
    setSelectedIntegration(null);
    setSelectedCategory(null);
    setSelectedCourse(null);
    setIntegrations([]);
    setCategories([]);
    setCourses([]);
    setIntegrationSearch('');
    setCategorySearch('');
    setCourseSearch('');
    setOrder(currentOrder);
    onClose();
  };

  const handleSave = () => {
    if (selectedCourse) {
      onAddCourse({
        courseLmsId: selectedCourse.lmsCourseId,
        fullName: selectedCourse.fullName,
        order,
      });
      handleClose();
    }
  };

  const canSave = selectedIntegration && selectedCategory && selectedCourse && order > 0;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {t('learning-objects.modal.title', 'Agregar Curso')}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {/* Autocomplete Plataforma */}
          <Autocomplete
            fullWidth
            options={integrations}
            value={selectedIntegration}
            loading={integrationsLoading}
            onChange={(event, newValue) => handleIntegrationChange(newValue)}
            onInputChange={(event, value) => setIntegrationSearch(value)}
            getOptionLabel={(option) => option.instanceName}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('learning-objects.modal.platform', 'Plataforma')}
                placeholder={t('learning-objects.modal.platformPlaceholder', 'Buscar plataforma...')}
                slotProps={{
                  input: {
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {integrationsLoading ? (
                          <CircularProgress color="inherit" size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  },
                }}
              />
            )}
          />

          {/* Autocomplete Categoría */}
          <Autocomplete
            fullWidth
            disabled={!selectedIntegration}
            options={categories}
            value={selectedCategory}
            loading={categoriesLoading}
            onChange={(event, newValue) => handleCategoryChange(newValue)}
            onInputChange={(event, value) => setCategorySearch(value)}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('learning-objects.modal.category', 'Categoría')}
                placeholder={t('learning-objects.modal.categoryPlaceholder', 'Buscar categoría...')}
                slotProps={{
                  input: {
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {categoriesLoading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  },
                }}
              />
            )}
          />

          {/* Autocomplete Curso */}
          <Autocomplete
            fullWidth
            disabled={!selectedCategory}
            options={courses}
            value={selectedCourse}
            loading={coursesLoading}
            onChange={(event, newValue) => setSelectedCourse(newValue)}
            onInputChange={(event, value) => setCourseSearch(value)}
            getOptionLabel={(option) => option.fullName}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('learning-objects.modal.course', 'Curso')}
                placeholder={t('learning-objects.modal.coursePlaceholder', 'Buscar curso...')}
                slotProps={{
                  input: {
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {coursesLoading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  },
                }}
              />
            )}
          />

          {/* Input de Order */}
          <TextField
            fullWidth
            type="number"
            label={t('learning-objects.modal.order', 'Orden')}
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            inputProps={{ min: 1 }}
            helperText={t('learning-objects.modal.orderHelper', 'Define el orden de este curso en el paquete')}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          {t('learning-objects.actions.cancel', 'Cancelar')}
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={!canSave}>
          {t('learning-objects.actions.add', 'Agregar')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
