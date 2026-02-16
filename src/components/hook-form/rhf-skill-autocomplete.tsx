// types
import type { TextFieldProps } from '@mui/material/TextField';
import type { AutocompleteProps } from '@mui/material/Autocomplete';
import type { ISkillOption } from 'src/types/employees';

import {
  Controller,
  useFormContext
} from 'react-hook-form';
import {
  useRef,
  useState,
  useEffect,
  useCallback,
} from 'react';

import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';

// services
import { GetSkillsPaginationService } from 'src/services/employees/skills.service';

// ----------------------------------------------------------------------

type Multiple = true;
type DisableClearable = false;
type FreeSolo = false;

type ExcludedProps = 'renderInput' | 'options' | 'loading' | 'onInputChange';

export type SkillAutocompleteBaseProps = Omit<
  AutocompleteProps<ISkillOption, Multiple, DisableClearable, FreeSolo>,
  ExcludedProps
>;

export type SkillAutocompleteProps = SkillAutocompleteBaseProps & {
  name: string;
  label?: string;
  placeholder?: string;
  helperText?: React.ReactNode;
  onSkillChange?: (skills: ISkillOption[]) => void;
  preloadSkillIds?: string[]; // Para cargar skills específicos al editar (ahora es array)
  slotProps?: SkillAutocompleteBaseProps['slotProps'] & {
    textField?: Partial<TextFieldProps>;
  };
};

export function SkillAutocomplete({
  name,
  label,
  slotProps,
  helperText,
  placeholder,
  onSkillChange,
  preloadSkillIds,
  ...other
}: SkillAutocompleteProps) {
  const { control, setValue } = useFormContext();
  const [options, setOptions] = useState<ISkillOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const preloadedRef = useRef(false);
  const initialLoadRef = useRef(false);

  const { textField, ...otherSlotProps } = slotProps ?? {};

  const fetchSkills = useCallback(async (searchTerm?: string) => {
    try {
      setLoading(true);
      const params = {
        page: 1,
        perPage: 100,
        ...(searchTerm && { search: searchTerm }),
      };

      const response = await GetSkillsPaginationService(params);

      if (response?.data?.data) {
        const skillsOptions: ISkillOption[] = response.data.data.map((skill) => ({
          id: skill.id,
          name: skill.name,
          color: skill.color,
        }));
        setOptions(skillsOptions);
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar skills iniciales (solo una vez)
  useEffect(() => {
    if (!initialLoadRef.current) {
      fetchSkills();
      initialLoadRef.current = true;
    }
  }, [fetchSkills]);

  // Buscar skills mientras el usuario escribe
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (inputValue) {
        fetchSkills(inputValue);
      } else {
        // Si no hay búsqueda, cargar todos los skills
        fetchSkills();
      }
    }, 300); // Debounce de 300ms

    return () => clearTimeout(delayedSearch);
  }, [inputValue, fetchSkills]);

  // Precargar skills específicos al editar (solo una vez)
  useEffect(() => {
    if (preloadSkillIds && preloadSkillIds.length > 0 && options.length > 0 && !preloadedRef.current) {
      const preloadedSkills = options.filter(option => preloadSkillIds.includes(option.id));
      if (preloadedSkills.length > 0) {
        setValue(name, preloadedSkills, { shouldValidate: true });
        preloadedRef.current = true;
      }
    }
  }, [preloadSkillIds, options, setValue, name]);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Autocomplete
          multiple
          options={options}
          loading={loading}
          value={field.value || []}
          id={`${name}-skill-autocomplete`}
          getOptionLabel={(option) => (typeof option === 'string' ? option : option?.name || '')}
          isOptionEqualToValue={(option, value) =>
            typeof option === 'object' && typeof value === 'object' && option?.id === value?.id
          }
          onInputChange={(event, newInputValue) => {
            setInputValue(newInputValue);
          }}
          onChange={(event, newValue) => {
            const skillsValue = Array.isArray(newValue) ? newValue as ISkillOption[] : [];
            field.onChange(skillsValue);
            if (onSkillChange) {
              onSkillChange(skillsValue);
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              {...textField}
              label={label}
              placeholder={placeholder}
              error={!!error}
              helperText={error?.message ?? helperText}
              slotProps={{
                ...textField?.slotProps,
                htmlInput: {
                  ...params.inputProps,
                  ...textField?.slotProps?.htmlInput,
                  autoComplete: 'new-password',
                },
                input: {
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                },
              }}
            />
          )}
          slotProps={{
            ...otherSlotProps,
            chip: {
              size: 'small',
              variant: 'soft',
              ...otherSlotProps?.chip,
            },
          }}
          {...other}
        />
      )}
    />
  );
}