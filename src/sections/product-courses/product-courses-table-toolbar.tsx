import type { IProductCourseTableFilters } from 'src/types/learning';

import { useState, useEffect, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import {
  GetLearningObjectsSelectLevelsService,
  GetLearningObjectsSelectCategoriesService,
} from 'src/services/learning/learningObjects.service';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  filters: IProductCourseTableFilters;
  onFilters: (name: string, value: string) => void;
};

type OptionType = {
  id: string;
  name: string;
};

export function ProductCoursesTableToolbar({ filters, onFilters }: Props) {
  const { t } = useTranslate('learning');

  // Estados para categorías
  const [categories, setCategories] = useState<OptionType[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');

  // Estados para niveles de dificultad
  const [levels, setLevels] = useState<OptionType[]>([]);
  const [levelsLoading, setLevelsLoading] = useState(false);
  const [levelSearch, setLevelSearch] = useState('');

  // Cargar categorías
  const loadCategories = useCallback(async (search: string = '') => {
    setCategoriesLoading(true);
    try {
      const response = await GetLearningObjectsSelectCategoriesService({
        page: 1,
        perPage: 20,
        search: search || undefined,
      });
      setCategories(response.data?.data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  // Cargar niveles de dificultad
  const loadLevels = useCallback(async (search: string = '') => {
    setLevelsLoading(true);
    try {
      const response = await GetLearningObjectsSelectLevelsService({
        page: 1,
        perPage: 20,
        search: search || undefined,
      });
      setLevels(response?.data || []);
    } catch (error) {
      console.error('Error loading levels:', error);
      setLevels([]);
    } finally {
      setLevelsLoading(false);
    }
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    loadCategories();
    loadLevels();
  }, [loadCategories, loadLevels]);

  // Recargar categorías cuando cambia la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      loadCategories(categorySearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [categorySearch, loadCategories]);

  // Recargar niveles cuando cambia la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      loadLevels(levelSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [levelSearch, loadLevels]);

  const handleFilterName = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFilters('name', event.target.value);
    },
    [onFilters]
  );

  const handleFilterCategory = useCallback(
    (_event: any, newValue: OptionType | null) => {
      onFilters('categoryId', newValue?.id || '');
    },
    [onFilters]
  );

  const handleFilterLevel = useCallback(
    (_event: any, newValue: OptionType | null) => {
      onFilters('difficultyLevelId', newValue?.id || '');
    },
    [onFilters]
  );

  const selectedCategory = categories.find((cat) => cat.id === filters.categoryId) || null;
  const selectedLevel = levels.find((lvl) => lvl.id === filters.difficultyLevelId) || null;

  return (
    <Stack
      spacing={2}
      alignItems={{ xs: 'flex-end', md: 'center' }}
      direction={{ xs: 'column', md: 'row' }}
      sx={{ p: 2.5 }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems="center"
        spacing={2}
        flexGrow={1}
        sx={{ width: 1 }}
      >
        <TextField
          fullWidth
          value={filters.name}
          onChange={handleFilterName}
          placeholder={t('product-courses.table.toolbar.search')}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />

        <Autocomplete
          fullWidth
          options={categories}
          value={selectedCategory}
          onChange={handleFilterCategory}
          onInputChange={(_event, newInputValue) => setCategorySearch(newInputValue)}
          loading={categoriesLoading}
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={t('product-courses.table.toolbar.category', 'Categoría')}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <InputAdornment position="start">
                      <Iconify icon="solar:add-folder-bold" sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                    {params.InputProps.startAdornment}
                  </>
                ),
                endAdornment: (
                  <>
                    {categoriesLoading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          sx={{ minWidth: { md: 240 } }}
        />

        <Autocomplete
          fullWidth
          options={levels}
          value={selectedLevel}
          onChange={handleFilterLevel}
          onInputChange={(_event, newInputValue) => setLevelSearch(newInputValue)}
          loading={levelsLoading}
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={t('product-courses.table.toolbar.difficulty', 'Nivel')}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <InputAdornment position="start">
                      <Iconify icon="solar:star-bold" sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                    {params.InputProps.startAdornment}
                  </>
                ),
                endAdornment: (
                  <>
                    {levelsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          sx={{ minWidth: { md: 240 } }}
        />
      </Stack>
    </Stack>
  );
}