import type { TextFieldProps } from '@mui/material/TextField';
import type { AutocompleteProps } from '@mui/material/Autocomplete';
import type { IEmploymentTypeOption } from 'src/types/employees';

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

import { GetTypeEmploymentPaginationService } from 'src/services/employees/employment-type.service';

// ----------------------------------------------------------------------

type Multiple = boolean | undefined;
type DisableClearable = boolean | undefined;
type FreeSolo = boolean | undefined;

type ExcludedProps = 'renderInput' | 'options' | 'loading' | 'onInputChange';

export type EmploymentTypeAutocompleteBaseProps = Omit<
  AutocompleteProps<IEmploymentTypeOption, Multiple, DisableClearable, FreeSolo>,
  ExcludedProps
>;

export type EmploymentTypeAutocompleteProps = EmploymentTypeAutocompleteBaseProps & {
  name: string;
  label?: string;
  placeholder?: string;
  helperText?: React.ReactNode;
  onEmploymentTypeChange?: (employmentType: IEmploymentTypeOption | null) => void;
  preloadEmploymentTypeId?: string; // Para cargar un tipo de empleo específico al editar
  slotProps?: EmploymentTypeAutocompleteBaseProps['slotProps'] & {
    textField?: Partial<TextFieldProps>;
  };
};

export function EmploymentTypeAutocomplete({
  name,
  label,
  slotProps,
  helperText,
  placeholder,
  onEmploymentTypeChange,
  preloadEmploymentTypeId,
  ...other
}: EmploymentTypeAutocompleteProps) {
  const { control, setValue } = useFormContext();
  const [options, setOptions] = useState<IEmploymentTypeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const preloadedRef = useRef(false);
  const initialLoadRef = useRef(false);

  const { textField, ...otherSlotProps } = slotProps ?? {};

  const fetchEmploymentTypes = useCallback(async (searchTerm?: string) => {
    try {
      setLoading(true);
      const params = {
        page: 1,
        perPage: 100,
        ...(searchTerm && { search: searchTerm }),
      };

      const response = await GetTypeEmploymentPaginationService(params);

      if (response?.data?.data) {
        const employmentTypesOptions: IEmploymentTypeOption[] = response.data.data.map((employmentType) => ({
          id: employmentType.id,
          name: employmentType.name,
        }));
        setOptions(employmentTypesOptions);
      }
    } catch (error) {
      console.error('Error fetching employment types:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar tipos de empleo iniciales (solo una vez)
  useEffect(() => {
    if (!initialLoadRef.current) {
      fetchEmploymentTypes();
      initialLoadRef.current = true;
    }
  }, [fetchEmploymentTypes]);

  // Buscar tipos de empleo mientras el usuario escribe
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (inputValue) {
        fetchEmploymentTypes(inputValue);
      } else {
        // Si no hay búsqueda, cargar todos los tipos de empleo
        fetchEmploymentTypes();
      }
    }, 300); // Debounce de 300ms

    return () => clearTimeout(delayedSearch);
  }, [inputValue, fetchEmploymentTypes]);

  // Precargar tipo de empleo específico al editar (solo una vez)
  useEffect(() => {
    if (preloadEmploymentTypeId && options.length > 0 && !preloadedRef.current) {
      const preloadedEmploymentType = options.find(option => option.id === preloadEmploymentTypeId);
      if (preloadedEmploymentType) {
        setValue(name, preloadedEmploymentType, { shouldValidate: true });
        preloadedRef.current = true;
      }
    }
  }, [preloadEmploymentTypeId, options, setValue, name]);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Autocomplete
          options={options}
          loading={loading}
          value={field.value}
          id={`${name}-employment-type-autocomplete`}
          getOptionLabel={(option) => (typeof option === 'string' ? option : option?.name || '')}
          isOptionEqualToValue={(option, value) =>
            typeof option === 'object' && typeof value === 'object' && option?.id === value?.id
          }
          onInputChange={(event, newInputValue) => {
            setInputValue(newInputValue);
          }}
          onChange={(event, newValue) => {
            const employmentTypeValue = (newValue && typeof newValue === 'object' && !Array.isArray(newValue)) ? newValue as IEmploymentTypeOption : null;
            field.onChange(employmentTypeValue);
            if (onEmploymentTypeChange) {
              onEmploymentTypeChange(employmentTypeValue);
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