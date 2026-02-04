import type {
  IProductCourse,
  ILearningCategory,
  ILearningCourseLms,
  ILearningDifficultyLevel
} from 'src/types/learning';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { SaveOrUpdateCoursesService } from 'src/services/learning/courses.service';
import {
  GetLearningObjectsSelectLevelsService,
  GetLearningObjectsSelectCoursesService,
  GetLearningObjectsSelectCategoriesService
} from 'src/services/learning/learningObjects.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

// Helper para evitar errores de TypeScript con iconos personalizados
const Icon = ({ icon, ...props }: any) => <Iconify icon={icon as any} {...props} />;

export type LearningObjectsFormSchemaType = {
  name: string;
  description: string;
  duration: string;
  categoryId: string;
  difficultyLevelId: string;
  courseLmsId: string | null;
  price: number;
  priceDiscount: number;
  isFree: boolean;
  isActive: boolean;
  tags: string[];
  imageUrl: string;
  videoUrl: string;
  bannerUrl: string;
  isStudentLimited: boolean;
  studentLimit: string;
  objective: string;
  skillsToAcquire: string;
  whatYouWillLearn: string;
};

// ----------------------------------------------------------------------

type Props = {
  currentProductCourse?: IProductCourse;
};

export function ProductCoursesCreateEditForm({ currentProductCourse }: Props) {
  const router = useRouter();
  const { t } = useTranslate('learning');

  const [categories, setCategories] = useState<ILearningCategory[]>([]);
  const [levels, setLevels] = useState<ILearningDifficultyLevel[]>([]);
  const [courses, setCourses] = useState<ILearningCourseLms[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [inputTagValue, setInputTagValue] = useState('');

  const ProductCoursesFormSchema = z.object({
    name: z.string().min(1, { message: t('product-courses.form.fields.name.required') }),
    description: z.string().min(1, { message: t('product-courses.form.fields.description.required') }),
    duration: z.string().min(1, { message: t('product-courses.form.fields.duration.required') }),
    categoryId: z.string().optional(),
    difficultyLevelId: z.string().min(1, { message: t('product-courses.form.fields.difficultyLevel.required') }),
    courseLmsId: z.string().nullable().optional(),
    price: z.number().min(0, { message: t('product-courses.form.fields.price.min') }),
    priceDiscount: z.number().min(0, { message: t('product-courses.form.fields.priceDiscount.min') }),
    isFree: z.boolean(),
    isActive: z.boolean(),
    tags: z.array(z.string()).min(1, { message: t('product-courses.form.fields.tags.required') }),
    imageUrl: z.string(),
    videoUrl: z.string(),
    bannerUrl: z.string(),
    isStudentLimited: z.boolean(),
    studentLimit: z.string(),
    objective: z.string(),
    skillsToAcquire: z.string(),
    whatYouWillLearn: z.string(),
  });

  const defaultValues: LearningObjectsFormSchemaType = useMemo(() => ({
    name: currentProductCourse?.name || '',
    description: currentProductCourse?.description || '',
    duration: currentProductCourse?.duration || '',
    categoryId: currentProductCourse?.categoryId || '',
    difficultyLevelId: currentProductCourse?.difficultyLevelId || '',
    courseLmsId: currentProductCourse?.courseLmsId || null,
    price: currentProductCourse?.price || 0,
    priceDiscount: currentProductCourse?.priceDiscount || 0,
    isFree: currentProductCourse?.isFree ?? true,
    isActive: currentProductCourse?.isActive ?? true,
    tags: currentProductCourse?.tags ? currentProductCourse.tags.split(',').map(tag => tag.trim()) : [],
    imageUrl: currentProductCourse?.imageUrl || '',
    videoUrl: currentProductCourse?.videoUrl || '',
    bannerUrl: currentProductCourse?.bannerUrl || '',
    isStudentLimited: currentProductCourse?.isStudentLimited ?? false,
    studentLimit: currentProductCourse?.studentLimit || '',
    objective: currentProductCourse?.objective || '',
    skillsToAcquire: currentProductCourse?.skillsToAcquire || '',
    whatYouWillLearn: currentProductCourse?.whatYouWillLearn || '',
  }), [currentProductCourse]);

  const methods = useForm({
    mode: 'onBlur',
    resolver: zodResolver(ProductCoursesFormSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const isFreeValue = watch('isFree');

  // Cargar categorías
  useEffect(() => {
    const params = {
      page: 1,
      perPage: 20,
    };
    const loadCategories = async () => {
      try {
        const response = await GetLearningObjectsSelectCategoriesService(params);
        const categoriesData = response?.data?.data || [];
        setCategories(categoriesData);

        // Precargar categoría si existe
        if (currentProductCourse?.category) {
          const categoryExists = categoriesData.some(
            (cat: ILearningCategory) => cat.id === currentProductCourse.category!.id
          );
          if (!categoryExists) {
            setCategories((prev) => [currentProductCourse.category!, ...prev]);
          }
        }
      } catch (error) {
        console.error('Error loading categories:', error);
        toast.error(t('product-courses.messages.error.loadingCategories'));
      }
    };

    loadCategories();
  }, [currentProductCourse, t]);

  // Cargar niveles de dificultad
  useEffect(() => {
    const loadLevels = async () => {
      try {
        const response = await GetLearningObjectsSelectLevelsService();
        const levelsData = response?.data || [];
        // Normalizar defensivamente: asegurar que id y name sean strings
        const normalized = (levelsData || []).map((l: any) => ({
          ...l,
          id: l.id != null ? String(l.id) : '',
          name: l.name != null ? String(l.name) : String(l.label || ''),
        }));
        setLevels(normalized);

        // Precargar nivel si existe (usar normalized para comparaciones string)
        if (currentProductCourse?.difficultyLevel) {
          const normalizedCurrent = {
            ...currentProductCourse.difficultyLevel,
            id: currentProductCourse.difficultyLevel.id != null ? String(currentProductCourse.difficultyLevel.id) : '',
            name: currentProductCourse.difficultyLevel.name || '',
          } as ILearningDifficultyLevel;

          const levelExists = normalized.some(
            (level: ILearningDifficultyLevel) => String(level.id) === String(normalizedCurrent.id)
          );

          if (!levelExists) {
            setLevels((prev) => [normalizedCurrent, ...prev]);
          }
        }
      } catch (error) {
        console.error('Error loading levels:', error);
        toast.error(t('product-courses.messages.error.loadingLevels'));
      }
    };

    loadLevels();
  }, [currentProductCourse, t]);

  // Cargar cursos LMS
  const loadCourses = useCallback(async (search: string = '') => {
    setCoursesLoading(true);
    try {
      const params = {
        page: 1,
        perPage: 20,
        ...(search && { search }),
      };
      const response = await GetLearningObjectsSelectCoursesService(params);
      const coursesData = response?.data?.data || [];
      setCourses(coursesData);

      // Precargar curso si existe (solo en la carga inicial sin búsqueda)
      if (currentProductCourse?.courseLms && !search) {
        const courseExists = coursesData.some(
          (course: ILearningCourseLms) => course.id === currentProductCourse.courseLms!.id
        );
        if (!courseExists) {
          setCourses((prev) => [currentProductCourse.courseLms!, ...prev]);
        }
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error(t('product-courses.messages.error.loadingCourses'));
    } finally {
      setCoursesLoading(false);
    }
  }, [currentProductCourse, t]);

  useEffect(() => {
    loadCourses();
    // Marcar que ya pasó la carga inicial después de un pequeño delay
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [loadCourses]);

  // Buscar cursos al escribir (solo después de la carga inicial)
  useEffect(() => {
    if (!isInitialLoad && courseSearchTerm) {
      const delayDebounce = setTimeout(() => {
        loadCourses(courseSearchTerm);
      }, 500);

      return () => clearTimeout(delayDebounce);
    }
    return undefined;
  }, [courseSearchTerm, loadCourses, isInitialLoad]);

  // Sincronizar el valor del autocomplete de categoría cuando se cargan
  useEffect(() => {
    if (currentProductCourse?.categoryId && categories.length > 0) {
      const categoryOption = categories.find(
        (cat) => cat.id === currentProductCourse.categoryId
      );

      if (categoryOption) {
        setValue('categoryId', categoryOption.id);
      }
    }
  }, [categories, currentProductCourse, setValue]);

  // Sincronizar el valor del autocomplete de nivel cuando se cargan
  useEffect(() => {
    if (currentProductCourse?.difficultyLevelId && levels.length > 0) {
      const levelOption = levels.find(
        (level) => level.id === currentProductCourse.difficultyLevelId
      );

      if (levelOption) {
        setValue('difficultyLevelId', levelOption.id);
      }
    }
  }, [levels, currentProductCourse, setValue]);

  // Sincronizar el valor del autocomplete de curso cuando se cargan
  useEffect(() => {
    if (currentProductCourse?.courseLmsId && courses.length > 0) {
      const courseOption = courses.find(
        (course) => course.id === currentProductCourse.courseLmsId
      );

      if (courseOption) {
        setValue('courseLmsId', courseOption.id);
      }
    }
  }, [courses, currentProductCourse, setValue]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      // Preparar datos para enviar al backend con las conversiones necesarias
      const dataToSend = {
        name: data.name,
        description: data.description,
        duration: data.duration,
        categoryId: Number(data.categoryId),
        difficultyLevelId: Number(data.difficultyLevelId),
        courseLmsId: data.courseLmsId ? Number(data.courseLmsId) : null,
        isFree: data.isFree,
        isActive: data.isActive,
        // Si es gratuito, enviar 0 en ambos precios, sino enviar los valores del formulario
        price: data.isFree ? 0 : data.price,
        priceDiscount: data.isFree ? 0 : data.priceDiscount,
        tags: data.tags.join(','),
        // Nuevos campos agregados
        imageUrl: data.imageUrl,
        videoUrl: data.videoUrl,
        bannerUrl: data.bannerUrl,
        isStudentLimited: data.isStudentLimited,
        studentLimit: data.studentLimit,
        objective: data.objective,
        skillsToAcquire: data.skillsToAcquire,
        whatYouWillLearn: data.whatYouWillLearn,
      };

      const response = await SaveOrUpdateCoursesService(
        dataToSend,
        currentProductCourse?.id
      );

      if (response.data.statusCode === 200 || response.data.statusCode === 201) {
        reset();
        toast.success(
          currentProductCourse
            ? t('product-courses.messages.success.updated')
            : t('product-courses.messages.success.created')
        );
        router.push(paths.dashboard.learning.productCourses);
      }
    } catch (error) {
      console.error('Error saving product course:', error);
      toast.error(t('product-courses.messages.error.saving'));
    }
  });

  const categoryOptions = useMemo(
    () => categories.map((category) => ({
      label: category.name,
      value: category.id,
    })),
    [categories]
  );

  const levelOptions = useMemo(
    () => levels.map((level) => ({
      label: level.name,
      value: level.id,
    })),
    [levels]
  );

  const courseOptions = useMemo(
    () => courses.map((course) => ({
      label: course.fullName,
      value: course.id,
    })),
    [courses]
  );

  const renderBasicInfo = () => (
    <Card 
      elevation={0}
      sx={{ 
        borderRadius: 2.5,
        border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.primary.main, 0.08)}`,
        }
      }}
    >
      <Stack spacing={3} sx={{ p: 4 }}>
        {/* Header con icono */}
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            sx={{
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
              color: 'primary.main',
              width: 48,
              height: 48,
            }}
          >
            <Iconify icon="solar:file-bold-duotone" width={28} />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {t('product-courses.form.sections.basicInfo')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Información esencial del curso
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Field.Text
              name="name"
              label={t('product-courses.form.fields.name.label')}
              placeholder={t('product-courses.form.fields.name.placeholder')}
              fullWidth
              required
              InputProps={{
                startAdornment: (
                  <Box sx={{ mr: 1, display: 'flex', color: 'text.secondary' }}>
                    <Iconify icon="solar:pen-bold" width={20} />
                  </Box>
                ),
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Field.Text
              name="duration"
              label={t('product-courses.form.fields.duration.label')}
              placeholder={t('product-courses.form.fields.duration.placeholder')}
              helperText={t('product-courses.form.fields.duration.helperText')}
              fullWidth
              required
              InputProps={{
                startAdornment: (
                  <Box sx={{ mr: 1, display: 'flex', color: 'text.secondary' }}>
                    <Iconify icon="solar:clock-circle-bold" width={20} />
                  </Box>
                ),
              }}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: 2,
                borderColor: (theme) => alpha(theme.palette.grey[500], 0.12),
                bgcolor: (theme) => alpha(theme.palette.grey[500], 0.02),
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <Iconify icon="solar:notes-bold-duotone" width={22} color="primary.main" />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {t('product-courses.form.fields.description.label')}
                  <Box component="span" sx={{ color: 'error.main' }}> *</Box>
                </Typography>
              </Stack>
              <Field.Editor
                name="description"
                placeholder={t('product-courses.form.fields.description.placeholder')}
                sx={{ maxHeight: 480 }}
              />
            </Paper>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: 2,
                borderColor: (theme) => alpha(theme.palette.grey[500], 0.12),
                bgcolor: (theme) => alpha(theme.palette.grey[500], 0.02),
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <Iconify icon="solar:atom-bold-duotone" width={22} color="primary.main" />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {t('product-courses.form.fields.tags.label')}
                </Typography>
              </Stack>
              <Field.Autocomplete
                name="tags"
                placeholder={t('product-courses.form.fields.tags.placeholder')}
                helperText={t('product-courses.form.fields.tags.helperText')}
                multiple
                freeSolo
                options={[]}
                inputValue={inputTagValue}
                getOptionLabel={(option: string) => option}
                onChange={(event, newValue) => {
                  const cleanedTags = (newValue as string[])
                    .filter((tag: string) => tag.trim() !== '')
                    .map((tag: string) => tag.trim());
                  const uniqueTags = Array.from(new Set(cleanedTags));
                  setValue('tags', uniqueTags, { shouldValidate: true });
                }}
                onInputChange={(event, newInputValue, reason) => {
                  if (reason !== 'reset') {
                    setInputTagValue(newInputValue);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === ',') {
                    event.preventDefault();
                    const value = inputTagValue.trim();
                    if (value) {
                      const currentTags = watch('tags') || [];
                      const newTags = [...currentTags, value];
                      const uniqueTags = Array.from(new Set(newTags));
                      setValue('tags', uniqueTags, { shouldValidate: true });
                      setInputTagValue('');
                    }
                  }
                }}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={option}
                      label={option}
                      size="medium"
                      sx={{
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                        color: 'primary.main',
                        fontWeight: 500,
                        '& .MuiChip-deleteIcon': {
                          color: 'primary.main',
                          '&:hover': {
                            color: 'primary.dark',
                          },
                        },
                      }}
                    />
                  ))
                }
                fullWidth
              />
            </Paper>
          </Grid>
        </Grid>
      </Stack>
    </Card>
  );

  const renderClassification = () => (
    <Card 
      elevation={0}
      sx={{ 
        borderRadius: 2.5,
        border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.info.main, 0.08)}`,
        }
      }}
    >
      <Stack spacing={3} sx={{ p: 4 }}>
        {/* Header con icono */}
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            sx={{
              bgcolor: (theme) => alpha(theme.palette.info.main, 0.08),
              color: 'info.main',
              width: 48,
              height: 48,
            }}
          >
            <Iconify icon="solar:atom-bold-duotone" width={28} />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {t('product-courses.form.sections.classification')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Organiza y categoriza tu curso
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Iconify icon="solar:file-bold-duotone" width={18} color="info.main" />
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  {t('product-courses.form.fields.category.label')}
                </Typography>
              </Stack>
              <Field.Autocomplete
                name="categoryId"
                placeholder={t('product-courses.form.fields.category.placeholder')}
                options={categoryOptions}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') {
                    const category = categoryOptions.find((c) => c.value === option);
                    if (category) return category.label;
                    if (currentProductCourse?.category?.id === option) {
                      return currentProductCourse.category.name;
                    }
                    return option;
                  }
                  return option?.label || '';
                }}
                isOptionEqualToValue={(option, value) => {
                  if (typeof value === 'string') {
                    return option.value === value;
                  }
                  return option.value === value?.value;
                }}
                onChange={(event, newValue) => {
                  setValue('categoryId', newValue?.value || '', { shouldValidate: true });
                }}
                fullWidth
              />
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Icon icon="solar:graph-up-bold-duotone" width={18} color="info.main" />
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  {t('product-courses.form.fields.difficultyLevel.label')}
                </Typography>
              </Stack>
              <Field.Autocomplete
                name="difficultyLevelId"
                placeholder={t('product-courses.form.fields.difficultyLevel.placeholder')}
                options={levelOptions}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') {
                    const level = levelOptions.find((l) => l.value === option);
                    if (level) return level.label;
                    if (currentProductCourse?.difficultyLevel?.id === option) {
                      return currentProductCourse.difficultyLevel.name;
                    }
                    return option;
                  }
                  return option?.label || '';
                }}
                isOptionEqualToValue={(option, value) => {
                  if (typeof value === 'string') {
                    return option.value === value;
                  }
                  return option.value === value?.value;
                }}
                onChange={(event, newValue) => {
                  setValue('difficultyLevelId', newValue?.value || '', { shouldValidate: true });
                }}
                fullWidth
              />
            </Stack>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: 2,
                borderColor: (theme) => alpha(theme.palette.grey[500], 0.12),
                bgcolor: (theme) => alpha(theme.palette.info.main, 0.04),
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <Icon icon="solar:notebook-bold-duotone" width={22} color="info.main" />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {t('product-courses.form.fields.courseLms.label')}
                </Typography>
              </Stack>
              <Field.Autocomplete
                name="courseLmsId"
                placeholder={t('product-courses.form.fields.courseLms.placeholder')}
                helperText={t('product-courses.form.fields.courseLms.helperText')}
                options={courseOptions}
                loading={coursesLoading}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') {
                    const course = courseOptions.find((c) => c.value === option);
                    if (course) return course.label;
                    if (currentProductCourse?.courseLms?.id === option) {
                      return currentProductCourse.courseLms.fullName;
                    }
                    return option;
                  }
                  return option?.label || '';
                }}
                isOptionEqualToValue={(option, value) => {
                  if (typeof value === 'string') {
                    return option.value === value;
                  }
                  return option.value === value?.value;
                }}
                onChange={(event, newValue) => {
                  setValue('courseLmsId', newValue?.value || null, { shouldValidate: true });
                }}
                onInputChange={(event, value, reason) => {
                  if (reason === 'input') {
                    setCourseSearchTerm(value);
                  }
                }}
                fullWidth
              />
            </Paper>
          </Grid>
        </Grid>
      </Stack>
    </Card>
  );

  const renderPricing = () => (
    <Card 
      elevation={0}
      sx={{ 
        borderRadius: 2.5,
        border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.success.main, 0.08)}`,
        }
      }}
    >
      <Stack spacing={3} sx={{ p: 4 }}>
        {/* Header con icono */}
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            sx={{
              bgcolor: (theme) => alpha(theme.palette.success.main, 0.08),
              color: 'success.main',
              width: 48,
              height: 48,
            }}
          >
            <Icon icon="solar:money-bag-bold-duotone" width={28} />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {t('product-courses.form.sections.pricing')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configura los precios del curso
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            borderRadius: 2,
            borderColor: (theme) => alpha(theme.palette.grey[500], 0.12),
            bgcolor: (theme) => alpha(theme.palette.success.main, 0.04),
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Icon icon="solar:gift-bold" width={24} color="success.main" />
            <Box sx={{ flexGrow: 1 }}>
              <Field.Switch
                name="isFree"
                label={t('product-courses.form.fields.isFree.label')}
                helperText={t('product-courses.form.fields.isFree.helperText')}
              />
            </Box>
          </Stack>
        </Paper>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: 2,
                borderColor: (theme) => alpha(theme.palette.grey[500], 0.12),
                bgcolor: (theme) => isFreeValue ? alpha(theme.palette.grey[500], 0.04) : alpha(theme.palette.success.main, 0.04),
                transition: 'all 0.3s ease',
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                <Icon 
                  icon="solar:tag-price-bold-duotone" 
                  width={22} 
                  color={isFreeValue ? 'text.disabled' : 'success.main'} 
                />
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    fontWeight: 600,
                    color: isFreeValue ? 'text.disabled' : 'text.primary'
                  }}
                >
                  {t('product-courses.form.fields.price.label')}
                </Typography>
              </Stack>
              <Field.Text
                name="price"
                placeholder={t('product-courses.form.fields.price.placeholder')}
                type="number"
                fullWidth
                disabled={isFreeValue}
                required={!isFreeValue}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <Box sx={{ mr: 1, display: 'flex', color: isFreeValue ? 'text.disabled' : 'success.main' }}>
                      $
                    </Box>
                  ),
                }}
              />
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: 2,
                borderColor: (theme) => alpha(theme.palette.grey[500], 0.12),
                bgcolor: (theme) => isFreeValue ? alpha(theme.palette.grey[500], 0.04) : alpha(theme.palette.warning.main, 0.04),
                transition: 'all 0.3s ease',
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                <Icon 
                  icon="solar:sale-bold-duotone" 
                  width={22} 
                  color={isFreeValue ? 'text.disabled' : 'warning.main'} 
                />
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    fontWeight: 600,
                    color: isFreeValue ? 'text.disabled' : 'text.primary'
                  }}
                >
                  {t('product-courses.form.fields.priceDiscount.label')}
                </Typography>
              </Stack>
              <Field.Text
                name="priceDiscount"
                placeholder={t('product-courses.form.fields.priceDiscount.placeholder')}
                helperText={t('product-courses.form.fields.priceDiscount.helperText')}
                type="number"
                fullWidth
                disabled={isFreeValue}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <Box sx={{ mr: 1, display: 'flex', color: isFreeValue ? 'text.disabled' : 'warning.main' }}>
                      $
                    </Box>
                  ),
                }}
              />
            </Paper>
          </Grid>
        </Grid>
      </Stack>
    </Card>
  );

  const renderMedia = () => (
    <Card 
      elevation={0}
      sx={{ 
        borderRadius: 2.5,
        border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.warning.main, 0.08)}`,
        }
      }}
    >
      <Stack spacing={3} sx={{ p: 4 }}>
        {/* Header con icono */}
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            sx={{
              bgcolor: (theme) => alpha(theme.palette.warning.main, 0.08),
              color: 'warning.main',
              width: 48,
              height: 48,
            }}
          >
            <Icon icon="solar:gallery-bold" width={28} />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {t('product-courses.form.sections.media', 'Medios')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Contenido visual del curso
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: 2,
                borderColor: (theme) => alpha(theme.palette.grey[500], 0.12),
                bgcolor: (theme) => alpha(theme.palette.warning.main, 0.04),
              }}
            >
              <Stack spacing={2}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Iconify icon="solar:gallery-add-bold" width={22} color="warning.main" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {t('product-courses.form.fields.imageUrl.label', 'URL de Imagen')}
                  </Typography>
                </Stack>
                <Field.Text
                  name="imageUrl"
                  placeholder={t('product-courses.form.fields.imageUrl.placeholder', 'https://ejemplo.com/imagen.jpg')}
                  helperText={t('product-courses.form.fields.imageUrl.helperText', 'URL de la imagen principal del objeto de aprendizaje')}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 1, display: 'flex', color: 'text.secondary' }}>
                        <Icon icon="solar:link-bold" width={20} />
                      </Box>
                    ),
                  }}
                />

                {watch('imageUrl') && (
                  <Box sx={{ mt: 2 }}>
                    <Chip 
                      icon={<Iconify icon="solar:eye-bold" width={16} />}
                      label={t('product-courses.form.fields.imageUrl.preview', 'Vista previa:')}
                      size="small"
                      sx={{ 
                        mb: 1.5,
                        bgcolor: (theme) => alpha(theme.palette.warning.main, 0.08),
                        color: 'warning.main',
                        fontWeight: 600,
                      }}
                    />
                    <Box
                      component="img"
                      src={watch('imageUrl')}
                      alt="Preview"
                      sx={{
                        width: '100%',
                        height: 200,
                        objectFit: 'cover',
                        borderRadius: 2,
                        border: (theme) => `2px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                        boxShadow: (theme) => `0 8px 16px ${alpha(theme.palette.warning.main, 0.16)}`,
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </Box>
                )}
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: 2,
                borderColor: (theme) => alpha(theme.palette.grey[500], 0.12),
                bgcolor: (theme) => alpha(theme.palette.warning.main, 0.04),
              }}
            >
              <Stack spacing={2}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Icon icon="solar:panorama-bold" width={22} color="warning.main" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {t('product-courses.form.fields.bannerUrl.label', 'URL de Banner')}
                  </Typography>
                </Stack>
                <Field.Text
                  name="bannerUrl"
                  placeholder={t('product-courses.form.fields.bannerUrl.placeholder', 'https://ejemplo.com/banner.jpg')}
                  helperText={t('product-courses.form.fields.bannerUrl.helperText', 'URL del banner para la página de detalles')}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 1, display: 'flex', color: 'text.secondary' }}>
                        <Icon icon="solar:link-bold" width={20} />
                      </Box>
                    ),
                  }}
                />

                {watch('bannerUrl') && (
                  <Box sx={{ mt: 2 }}>
                    <Chip 
                      icon={<Iconify icon="solar:eye-bold" width={16} />}
                      label={t('product-courses.form.fields.bannerUrl.preview', 'Vista previa del banner:')}
                      size="small"
                      sx={{ 
                        mb: 1.5,
                        bgcolor: (theme) => alpha(theme.palette.warning.main, 0.08),
                        color: 'warning.main',
                        fontWeight: 600,
                      }}
                    />
                    <Box
                      component="img"
                      src={watch('bannerUrl')}
                      alt="Banner Preview"
                      sx={{
                        width: '100%',
                        height: 200,
                        objectFit: 'cover',
                        borderRadius: 2,
                        border: (theme) => `2px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                        boxShadow: (theme) => `0 8px 16px ${alpha(theme.palette.warning.main, 0.16)}`,
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </Box>
                )}
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: 2,
                borderColor: (theme) => alpha(theme.palette.grey[500], 0.12),
                bgcolor: (theme) => alpha(theme.palette.error.main, 0.04),
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <Iconify icon="solar:videocamera-record-bold" width={22} color="error.main" />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {t('product-courses.form.fields.videoUrl.label', 'URL de Video')}
                </Typography>
              </Stack>
              <Field.Text
                name="videoUrl"
                placeholder={t('product-courses.form.fields.videoUrl.placeholder', 'https://youtube.com/watch?v=...')}
                helperText={t('product-courses.form.fields.videoUrl.helperText', 'URL del video introductorio o demo')}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <Box sx={{ mr: 1, display: 'flex', color: 'text.secondary' }}>
                      <Icon icon="solar:link-bold" width={20} />
                    </Box>
                  ),
                }}
              />
            </Paper>
          </Grid>
        </Grid>
      </Stack>
    </Card>
  );

  const renderContent = () => (
    <Card 
      elevation={0}
      sx={{ 
        borderRadius: 2.5,
        border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.secondary.main, 0.08)}`,
        }
      }}
    >
      <Stack spacing={4} sx={{ p: 4 }}>
        {/* Header con icono */}
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            sx={{
              bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.08),
              color: 'secondary.main',
              width: 48,
              height: 48,
            }}
          >
            <Icon icon="solar:notebook-bold" width={28} />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {t('product-courses.form.sections.content', 'Contenido')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Descripción detallada del programa
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Paper
          variant="outlined"
          sx={{
            p: 3,
            borderRadius: 2,
            borderColor: (theme) => alpha(theme.palette.grey[500], 0.12),
            bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.04),
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
            <Icon icon="solar:target-bold" width={22} color="secondary.main" />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {t('product-courses.form.fields.objective.label', 'Objetivo')}
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            {t('product-courses.form.fields.objective.helperText', 'Meta principal que el estudiante alcanzará')}
          </Typography>
          <Field.Editor
            name="objective"
            placeholder={t('product-courses.form.fields.objective.placeholder', 'Describe el objetivo principal del curso')}
            sx={{ maxHeight: 350 }}
          />
        </Paper>

        <Paper
          variant="outlined"
          sx={{
            p: 3,
            borderRadius: 2,
            borderColor: (theme) => alpha(theme.palette.grey[500], 0.12),
            bgcolor: (theme) => alpha(theme.palette.info.main, 0.04),
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
            <Iconify icon="solar:cup-star-bold" width={22} color="info.main" />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {t('product-courses.form.fields.skillsToAcquire.label', 'Habilidades a Adquirir')}
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            {t('product-courses.form.fields.skillsToAcquire.helperText', 'Competencias y destrezas que obtendrá el estudiante')}
          </Typography>
          <Field.Editor
            name="skillsToAcquire"
            placeholder={t('product-courses.form.fields.skillsToAcquire.placeholder', 'Lista las habilidades específicas que se desarrollarán')}
            sx={{ maxHeight: 400 }}
          />
        </Paper>

        <Paper
          variant="outlined"
          sx={{
            p: 3,
            borderRadius: 2,
            borderColor: (theme) => alpha(theme.palette.grey[500], 0.12),
            bgcolor: (theme) => alpha(theme.palette.success.main, 0.04),
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
            <Icon icon="solar:book-2-bold" width={22} color="success.main" />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {t('product-courses.form.fields.whatYouWillLearn.label', 'Qué Aprenderás')}
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            {t('product-courses.form.fields.whatYouWillLearn.helperText', 'Contenidos y temas específicos del programa')}
          </Typography>
          <Field.Editor
            name="whatYouWillLearn"
            placeholder={t('product-courses.form.fields.whatYouWillLearn.placeholder', 'Detalla los conocimientos específicos del curso')}
            sx={{ maxHeight: 400 }}
          />
        </Paper>
      </Stack>
    </Card>
  );

  const renderLimits = () => (
    <Card 
      elevation={0}
      sx={{ 
        borderRadius: 2.5,
        border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.error.main, 0.08)}`,
        }
      }}
    >
      <Stack spacing={3} sx={{ p: 4 }}>
        {/* Header con icono */}
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            sx={{
              bgcolor: (theme) => alpha(theme.palette.error.main, 0.08),
              color: 'error.main',
              width: 48,
              height: 48,
            }}
          >
            <Iconify icon="solar:users-group-rounded-bold" width={28} />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {t('product-courses.form.sections.limits', 'Límites y Restricciones')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Control de capacidad del curso
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: 2,
                borderColor: (theme) => alpha(theme.palette.grey[500], 0.12),
                bgcolor: (theme) => alpha(theme.palette.error.main, 0.04),
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Icon icon="solar:shield-warning-bold" width={24} color="error.main" />
                <Box sx={{ flexGrow: 1 }}>
                  <Field.Switch
                    name="isStudentLimited"
                    label={t('product-courses.form.fields.isStudentLimited.label', 'Limitar Estudiantes')}
                    helperText={t('product-courses.form.fields.isStudentLimited.helperText', 'Activar si quieres establecer un límite máximo de estudiantes')}
                  />
                </Box>
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: 2,
                borderColor: (theme) => alpha(theme.palette.grey[500], 0.12),
                bgcolor: (theme) => watch('isStudentLimited') 
                  ? alpha(theme.palette.error.main, 0.04) 
                  : alpha(theme.palette.grey[500], 0.04),
                transition: 'all 0.3s ease',
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                <Icon 
                  icon="solar:users-group-two-rounded-bold" 
                  width={22} 
                  color={watch('isStudentLimited') ? 'error.main' : 'text.disabled'} 
                />
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    fontWeight: 600,
                    color: watch('isStudentLimited') ? 'text.primary' : 'text.disabled'
                  }}
                >
                  {t('product-courses.form.fields.studentLimit.label', 'Límite de Estudiantes')}
                </Typography>
              </Stack>
              <Field.Text
                name="studentLimit"
                placeholder={t('product-courses.form.fields.studentLimit.placeholder', '50')}
                helperText={t('product-courses.form.fields.studentLimit.helperText', 'Número máximo de estudiantes permitidos')}
                type="number"
                fullWidth
                disabled={!watch('isStudentLimited')}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <Box sx={{ mr: 1, display: 'flex', color: watch('isStudentLimited') ? 'error.main' : 'text.disabled' }}>
                      <Icon icon="solar:user-bold" width={20} />
                    </Box>
                  ),
                }}
              />
            </Paper>
          </Grid>
        </Grid>
      </Stack>
    </Card>
  );

  const renderSettings = () => (
    <Card 
      elevation={0}
      sx={{ 
        borderRadius: 2.5,
        border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.primary.main, 0.08)}`,
        }
      }}
    >
      <Stack spacing={3} sx={{ p: 4 }}>
        {/* Header con icono */}
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            sx={{
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
              color: 'primary.main',
              width: 48,
              height: 48,
            }}
          >
            <Iconify icon="solar:settings-bold" width={28} />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {t('product-courses.form.sections.settings')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configuración general del curso
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            borderRadius: 2,
            borderColor: (theme) => alpha(theme.palette.grey[500], 0.12),
            bgcolor: (theme) => watch('isActive')
              ? alpha(theme.palette.success.main, 0.04)
              : alpha(theme.palette.grey[500], 0.04),
            transition: 'all 0.3s ease',
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Iconify 
              icon={watch('isActive') ? "solar:check-circle-bold" : "solar:close-circle-bold"} 
              width={24} 
              color={watch('isActive') ? 'success.main' : 'text.disabled'} 
            />
            <Box sx={{ flexGrow: 1 }}>
              <Field.Switch
                name="isActive"
                label={t('product-courses.form.fields.isActive.label')}
                helperText={t('product-courses.form.fields.isActive.helperText')}
              />
            </Box>
            <Chip
              label={watch('isActive') ? 'Activo' : 'Inactivo'}
              size="small"
              sx={{
                bgcolor: (theme) => watch('isActive')
                  ? alpha(theme.palette.success.main, 0.16)
                  : alpha(theme.palette.grey[500], 0.16),
                color: watch('isActive') ? 'success.main' : 'text.secondary',
                fontWeight: 600,
              }}
            />
          </Stack>
        </Paper>
      </Stack>
    </Card>
  );

  const renderActions = () => (
    <Card 
      elevation={0}
      sx={{ 
        borderRadius: 2.5,
        border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
        bgcolor: (theme) => alpha(theme.palette.grey[500], 0.02),
      }}
    >
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        spacing={2} 
        justifyContent="space-between" 
        alignItems="center"
        sx={{ p: 3 }}
      >
        <Stack direction="row" spacing={2}>
          <Button
            size="large"
            variant="outlined"
            color="inherit"
            onClick={() => router.back()}
            startIcon={<Icon icon="solar:arrow-left-bold" width={20} />}
            sx={{ 
              minWidth: 140,
              borderRadius: 1.5,
            }}
          >
            {t('product-courses.actions.cancel')}
          </Button>

          <LoadingButton
            size="large"
            type="submit"
            variant="contained"
            loading={isSubmitting}
            loadingIndicator={t('product-courses.messages.saving')}
            startIcon={
              !isSubmitting && (
                <Icon 
                  icon={currentProductCourse ? "solar:diskette-bold" : "solar:add-circle-bold"} 
                  width={20} 
                />
              )
            }
            sx={{ 
              minWidth: 180,
              borderRadius: 1.5,
              boxShadow: (theme) => `0 8px 16px ${alpha(theme.palette.primary.main, 0.24)}`,
              '&:hover': {
                boxShadow: (theme) => `0 12px 24px ${alpha(theme.palette.primary.main, 0.32)}`,
              }
            }}
          >
            {currentProductCourse
              ? t('product-courses.actions.update')
              : t('product-courses.actions.create')}
          </LoadingButton>
        </Stack>
      </Stack>
    </Card>
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={4} sx={{ pb: 5 }}>
        {renderBasicInfo()}
        {renderClassification()}
        {renderMedia()}
        {renderContent()}
        {renderPricing()}
        {renderLimits()}
        {renderSettings()}
        {renderActions()}
      </Stack>
    </Form>
  );
}
