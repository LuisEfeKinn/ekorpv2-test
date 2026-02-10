import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { GetLearningCategoriesPaginationService } from 'src/services/learning/categories.service';
import { SaveOrUpdateLearningObjectsService, GetLearningObjectsSelectLevelsService } from 'src/services/learning/learningObjects.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';
import { ImageUploader } from 'src/components/image-uploader';

import { AddCourseModal } from './learning-objects-add-course-modal';

// ----------------------------------------------------------------------

type CourseItem = {
  courseLmsId: string;
  fullName: string;
  order: number;
};

type CategoryOption = {
  id: string;
  name: string;
};

type DifficultyLevelOption = {
  id: string;
  name: string;
};

export type LearningObjectsFormSchemaType = {
  name: string;
  description: string;
  imageUrl: string;
  videoUrl: string;
  bannerUrl: string;
  objective: string;
  skillsToAcquire: string;
  whatYouWillLearn: string;
  tags: string;
  categoryId: string;
  difficultyLevelId: string;
  isActive: boolean;
  order: number;
};

// ----------------------------------------------------------------------

type Props = {
  currentLearningObject?: any;
};

export function LearningObjectsCreateEditForm({ currentLearningObject }: Props) {
  const router = useRouter();
  const { t } = useTranslate('learning');
  const modalAddCourse = useBoolean();

  // Estados para gestión de cursos
  const [courses, setCourses] = useState<CourseItem[]>([]);

  // Estados para categorías y niveles
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [difficultyLevels, setDifficultyLevels] = useState<DifficultyLevelOption[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [levelsLoading, setLevelsLoading] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');

  // Estado para precarga de valores
  const [preloadedCategory, setPreloadedCategory] = useState<CategoryOption | null>(null);
  const [preloadedDifficultyLevel, setPreloadedDifficultyLevel] = useState<DifficultyLevelOption | null>(null);

  const LearningObjectsFormSchema = z.object({
    name: z.string().min(1, { message: t('learning-objects.form.fields.name.required') }),
    description: z.string().min(1, { message: t('learning-objects.form.fields.description.required') }),
    imageUrl: z.string(),
    videoUrl: z.string(),
    bannerUrl: z.string(),
    objective: z.string(),
    skillsToAcquire: z.string(),
    whatYouWillLearn: z.string(),
    tags: z.string(),
    categoryId: z.string().min(1, { message: t('learning-objects.form.fields.category.required', 'Categoría es requerida') }),
    difficultyLevelId: z.string().min(1, { message: t('learning-objects.form.fields.difficultyLevel.required', 'Nivel de dificultad es requerido') }),
    isActive: z.boolean(),
    order: z.number().min(0),
  });

  const defaultValues: LearningObjectsFormSchemaType = useMemo(() => ({
    name: currentLearningObject?.name || '',
    description: currentLearningObject?.description || '',
    imageUrl: currentLearningObject?.imageUrl || '',
    videoUrl: currentLearningObject?.videoUrl || '',
    bannerUrl: currentLearningObject?.bannerUrl || '',
    objective: currentLearningObject?.objective || '',
    skillsToAcquire: currentLearningObject?.skillsToAcquire || '',
    whatYouWillLearn: currentLearningObject?.whatYouWillLearn || '',
    tags: currentLearningObject?.tags || '',
    categoryId: currentLearningObject?.category?.id || '',
    difficultyLevelId: currentLearningObject?.difficultyLevel?.id || '',
    isActive: currentLearningObject?.isActive ?? true,
    order: currentLearningObject?.order || 1,
  }), [currentLearningObject]);

  // Estado para manejar tags como array
  const [tagsArray, setTagsArray] = useState<string[]>([]);

  // Inicializar tags al cargar
  useEffect(() => {
    if (currentLearningObject?.tags) {
      const tags = currentLearningObject.tags
        .split(',')
        .map((tag: string) => tag.trim())
        .filter((tag: string) => tag.length > 0);
      setTagsArray(tags);
    }
  }, [currentLearningObject]);

  // Inicializar cursos precargados al editar
  useEffect(() => {
    if (currentLearningObject?.courses && Array.isArray(currentLearningObject.courses)) {
      const loadedCourses: CourseItem[] = currentLearningObject.courses.map((course: any) => ({
        courseLmsId: course.lmsCourseId,
        fullName: course.fullName,
        order: course.order,
      }));
      setCourses(loadedCourses);
    }

    // Precargar categoría
    if (currentLearningObject?.category) {
      setPreloadedCategory({
        id: currentLearningObject.category.id,
        name: currentLearningObject.category.name,
      });
    }

    // Precargar nivel de dificultad
    if (currentLearningObject?.difficultyLevel) {
      setPreloadedDifficultyLevel({
        id: currentLearningObject.difficultyLevel.id,
        name: currentLearningObject.difficultyLevel.name,
      });
    }
  }, [currentLearningObject]);

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(LearningObjectsFormSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  // Cargar categorías
  const loadCategories = useCallback(async (search: string = '') => {
    setCategoriesLoading(true);
    try {
      const params = {
        page: 1,
        perPage: 20,
        ...(search && { search }),
      };
      const response = await GetLearningCategoriesPaginationService(params);
      const data = response?.data?.data || [];
      
      const mappedCategories: CategoryOption[] = data.map((item: any) => ({
        id: item.id,
        name: item.name,
      }));
      
      setCategories(mappedCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  // Cargar niveles de dificultad
  const loadDifficultyLevels = useCallback(async () => {
    setLevelsLoading(true);
    try {
      const response = await GetLearningObjectsSelectLevelsService();
      const data = response?.data || [];
      
      const mappedLevels: DifficultyLevelOption[] = data.map((item: any) => ({
        id: item.id,
        name: item.name,
      }));
      
      setDifficultyLevels(mappedLevels);
    } catch (error) {
      console.error('Error loading difficulty levels:', error);
      setDifficultyLevels([]);
    } finally {
      setLevelsLoading(false);
    }
  }, []);

  // Cargar niveles al montar el componente
  useEffect(() => {
    loadDifficultyLevels();
  }, [loadDifficultyLevels]);

  // Cargar categorías con debounce
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      loadCategories(categorySearch);
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [categorySearch, loadCategories]);

  // Funciones para gestionar cursos
  const handleAddCourse = (course: { courseLmsId: string; fullName: string; order: number }) => {
    setCourses((prev) => [...prev, course]);
  };

  const handleRemoveCourse = (index: number) => {
    setCourses((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateCourseOrder = (index: number, newOrder: number) => {
    setCourses((prev) =>
      prev.map((course, i) => (i === index ? { ...course, order: newOrder } : course))
    );
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      // Preparar cursos con su orden
      const coursesToSend = courses.map((course) => ({
        courseLmsId: Number(course.courseLmsId),
        order: course.order,
      }));

      // Convertir tags de array a string separado por comas
      const tagsString = tagsArray.join(', ');

      // Preparar datos para enviar al backend
      const dataToSend = {
        name: data.name,
        duration: '', // Calcular si es necesario
        description: data.description,
        imageUrl: data.imageUrl,
        videoUrl: data.videoUrl,
        bannerUrl: data.bannerUrl,
        isActive: data.isActive,
        objective: data.objective,
        skillsToAcquire: data.skillsToAcquire,
        whatYouWillLearn: data.whatYouWillLearn,
        tags: tagsString,
        order: data.order,
        categoryId: Number(data.categoryId),
        difficultyLevelId: Number(data.difficultyLevelId),
        courses: coursesToSend,
      };

      const response = await SaveOrUpdateLearningObjectsService(
        dataToSend,
        currentLearningObject?.id
      );

      if (response.data.statusCode === 200 || response.data.statusCode === 201) {
        reset();
        toast.success(
          currentLearningObject
            ? t('learning-objects.messages.success.updated')
            : t('learning-objects.messages.success.created')
        );
        router.push(paths.dashboard.learning.learningObjects);
      }
    } catch (error) {
      console.error('Error saving learning object:', error);
      toast.error(t('learning-objects.messages.error.saving'));
    }
  });

  const renderBasicInfo = () => (
    <Card>
      <Stack spacing={3} sx={{ p: 3 }}>
        <Typography variant="h6">{t('learning-objects.form.sections.basicInfo')}</Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Field.Text
              name="name"
              label={t('learning-objects.form.fields.name.label')}
              placeholder={t('learning-objects.form.fields.name.placeholder')}
              fullWidth
              required
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Field.Text
              name="order"
              label={t('learning-objects.form.fields.order.label', 'Orden')}
              placeholder={t('learning-objects.form.fields.order.placeholder', '1')}
              type="number"
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {t('learning-objects.form.fields.description.label')}
            <Box component="span" sx={{ color: 'error.main' }}> *</Box>
          </Typography>
          <Field.Editor
            name="description"
            placeholder={t('learning-objects.form.fields.description.placeholder')}
            sx={{ maxHeight: 480 }}
          />
        </Box>

        {/* Objective */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {t('learning-objects.form.fields.objective.label', 'Objetivo')}
          </Typography>
          <Field.Editor
            name="objective"
            placeholder={t('learning-objects.form.fields.objective.placeholder', 'Describe el objetivo del paquete...')}
            sx={{ maxHeight: 480 }}
          />
        </Box>

        {/* Skills to Acquire */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {t('learning-objects.form.fields.skillsToAcquire.label', 'Habilidades a Adquirir')}
          </Typography>
          <Field.Editor
            name="skillsToAcquire"
            placeholder={t('learning-objects.form.fields.skillsToAcquire.placeholder', 'Lista las habilidades que se adquirirán...')}
            sx={{ maxHeight: 480 }}
          />
        </Box>

        {/* What You Will Learn */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {t('learning-objects.form.fields.whatYouWillLearn.label', 'Qué Aprenderás')}
          </Typography>
          <Field.Editor
            name="whatYouWillLearn"
            placeholder={t('learning-objects.form.fields.whatYouWillLearn.placeholder', 'Describe qué aprenderán los estudiantes...')}
            sx={{ maxHeight: 480 }}
          />
        </Box>

        {/* Video URL */}
        <Field.Text
          name="videoUrl"
          label={t('learning-objects.form.fields.videoUrl.label', 'URL del Video')}
          placeholder={t('learning-objects.form.fields.videoUrl.placeholder', 'https://ejemplo.com/video.mp4')}
          fullWidth
        />

        {/* Tags */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            {t('learning-objects.form.fields.tags.label', 'Etiquetas')}
          </Typography>
          <Autocomplete
            multiple
            freeSolo
            disableCloseOnSelect
            options={[]}
            value={tagsArray}
            onChange={(event, newValue) => {
              setTagsArray(newValue);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={t('learning-objects.form.fields.tags.placeholder', 'Presiona Enter para agregar etiquetas')}
              />
            )}
            slotProps={{
              chip: { color: 'info', size: 'small', variant: 'soft' },
            }}
          />
        </Box>

        {/* Image URL */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            {t('learning-objects.form.fields.imageUrl.label', 'Imagen del Paquete')}
          </Typography>
          <ImageUploader
            imageUrl={watch('imageUrl')}
            placeholderText={t('learning-objects.form.fields.imageUrl.placeholder', 'Sube la imagen del paquete de aprendizaje')}
            height={320}
            onUploadSuccess={(url) => {
              setValue('imageUrl', url, { shouldValidate: true });
            }}
            onDeleteSuccess={() => {
              setValue('imageUrl', '', { shouldValidate: true });
            }}
          />
        </Box>

        {/* Banner URL */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            {t('learning-objects.form.fields.bannerUrl.label', 'Banner del Paquete')}
          </Typography>
          <ImageUploader
            imageUrl={watch('bannerUrl')}
            placeholderText={t('learning-objects.form.fields.bannerUrl.placeholder', 'Sube el banner del paquete de aprendizaje')}
            height={200}
            onUploadSuccess={(url) => {
              setValue('bannerUrl', url, { shouldValidate: true });
            }}
            onDeleteSuccess={() => {
              setValue('bannerUrl', '', { shouldValidate: true });
            }}
          />
        </Box>
      </Stack>
    </Card>
  );

  const renderCategorization = () => (
    <Card>
      <Stack spacing={3} sx={{ p: 3 }}>
        <Typography variant="h6">
          {t('learning-objects.form.sections.categorization', 'Categorización')}
        </Typography>

        <Grid container spacing={3}>
          {/* Category */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Autocomplete
              fullWidth
              options={preloadedCategory ? [preloadedCategory, ...categories] : categories}
              value={
                preloadedCategory && watch('categoryId') === preloadedCategory.id
                  ? preloadedCategory
                  : categories.find((cat) => cat.id === watch('categoryId')) || null
              }
              loading={categoriesLoading}
              onChange={(event, newValue) => {
                setValue('categoryId', newValue?.id || '', { shouldValidate: true });
              }}
              onInputChange={(event, value) => setCategorySearch(value)}
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('learning-objects.form.fields.category.label', 'Categoría')}
                  placeholder={t('learning-objects.form.fields.category.placeholder', 'Seleccionar categoría...')}
                  required
                  error={!watch('categoryId')}
                  slotProps={{
                    input: {
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {categoriesLoading ? (
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
          </Grid>

          {/* Difficulty Level */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Autocomplete
              fullWidth
              options={preloadedDifficultyLevel ? [preloadedDifficultyLevel, ...difficultyLevels] : difficultyLevels}
              value={
                preloadedDifficultyLevel && watch('difficultyLevelId') === preloadedDifficultyLevel.id
                  ? preloadedDifficultyLevel
                  : difficultyLevels.find((level) => level.id === watch('difficultyLevelId')) || null
              }
              loading={levelsLoading}
              onChange={(event, newValue) => {
                setValue('difficultyLevelId', newValue?.id || '', { shouldValidate: true });
              }}
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('learning-objects.form.fields.difficultyLevel.label', 'Nivel de Dificultad')}
                  placeholder={t('learning-objects.form.fields.difficultyLevel.placeholder', 'Seleccionar nivel...')}
                  required
                  error={!watch('difficultyLevelId')}
                  slotProps={{
                    input: {
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {levelsLoading ? (
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
          </Grid>
        </Grid>
      </Stack>
    </Card>
  );

  const renderCourses = () => (
    <Card>
      <Stack spacing={3} sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            {t('learning-objects.form.sections.courses', 'Cursos del Paquete')}
          </Typography>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={modalAddCourse.onTrue}
          >
            {t('learning-objects.form.actions.addCourse', 'Agregar Curso')}
          </Button>
        </Stack>

        {courses.length === 0 && (
          <Box
            sx={{
              p: 3,
              textAlign: 'center',
              color: 'text.secondary',
              bgcolor: 'background.neutral',
              borderRadius: 1,
            }}
          >
            <Typography variant="body2">
              {t('learning-objects.form.messages.noCourses', 'No hay cursos agregados. Haz clic en "Agregar Curso" para comenzar.')}
            </Typography>
          </Box>
        )}

        {/* Lista de cursos */}
        {courses.map((course, index) => (
          <Stack
            key={`course-${index}`}
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{
              p: 2,
              border: (theme) => `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              bgcolor: 'background.paper',
            }}
          >
            <Stack flex={1} spacing={0.5}>
              <Typography variant="subtitle2">{course.fullName}</Typography>
              <Typography variant="caption" color="text.secondary">
                {t('learning-objects.form.fields.courseLmsId.label', 'ID LMS')}: {course.courseLmsId}
              </Typography>
            </Stack>

            <TextField
              type="number"
              label={t('learning-objects.form.fields.order.label', 'Orden')}
              value={course.order}
              onChange={(e) => handleUpdateCourseOrder(index, Number(e.target.value))}
              size="small"
              sx={{ width: 100 }}
              inputProps={{ min: 1 }}
            />

            <IconButton
              size="small"
              color="error"
              onClick={() => handleRemoveCourse(index)}
            >
              <Iconify icon="solar:trash-bin-trash-bold" />
            </IconButton>
          </Stack>
        ))}
      </Stack>
    </Card>
  );



  const renderSettings = () => (
    <Card>
      <Stack spacing={3} sx={{ p: 3 }}>
        <Typography variant="h6">{t('learning-objects.form.sections.settings')}</Typography>

        <Field.Switch
          name="isActive"
          label={t('learning-objects.form.fields.isActive.label')}
          helperText={t('learning-objects.form.fields.isActive.helperText')}
        />
      </Stack>
    </Card>
  );

  const renderActions = () => (
    <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-start' }}>
      <LoadingButton
        size="medium"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator={t('learning-objects.messages.saving')}
      >
        {currentLearningObject
          ? t('learning-objects.actions.update')
          : t('learning-objects.actions.create')}
      </LoadingButton>

      <Button
        size="medium"
        variant="outlined"
        color="inherit"
        onClick={() => router.back()}
      >
        {t('learning-objects.actions.cancel')}
      </Button>
    </Stack>
  );

  return (
    <>
      <Form methods={methods} onSubmit={onSubmit}>
        <Stack spacing={3}>
          {/* Información Básica */}
          {renderBasicInfo()}

          {/* Categorización */}
          {renderCategorization()}

          {/* Cursos */}
          {renderCourses()}

          {/* Configuración y Acciones */}
          {renderSettings()}
          {renderActions()}
        </Stack>
      </Form>

      {/* Modal para agregar cursos */}
      <AddCourseModal
        open={modalAddCourse.value}
        onClose={modalAddCourse.onFalse}
        onAddCourse={handleAddCourse}
        currentOrder={courses.length + 1}
      />
    </>
  );
}