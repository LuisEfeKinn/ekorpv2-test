import type { TextFieldProps } from '@mui/material/TextField';
import type { AutocompleteProps } from '@mui/material/Autocomplete';
import type { IPositionOption } from 'src/types/organization';

import {
  Controller,
  useFormContext
} from 'react-hook-form';
import {
  useRef,
  useState,
  useEffect,
  useCallback
} from 'react';

import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';

import { GetPositionPaginationService } from 'src/services/organization/position.service';

// ----------------------------------------------------------------------

type Multiple = boolean | undefined;
type DisableClearable = boolean | undefined;
type FreeSolo = boolean | undefined;

type ExcludedProps = 'renderInput' | 'options' | 'loading' | 'onInputChange';

export type PositionAutocompleteBaseProps = Omit<
  AutocompleteProps<IPositionOption, Multiple, DisableClearable, FreeSolo>,
  ExcludedProps
>;

export type PositionAutocompleteProps = PositionAutocompleteBaseProps & {
  name: string;
  label?: string;
  placeholder?: string;
  helperText?: React.ReactNode;
  onPositionChange?: (position: IPositionOption | null) => void;
  preloadPositionId?: string; // Para cargar una posición específica al editar
  slotProps?: PositionAutocompleteBaseProps['slotProps'] & {
    textField?: Partial<TextFieldProps>;
  };
};

export function PositionAutocomplete({
  name,
  label,
  slotProps,
  helperText,
  placeholder,
  onPositionChange,
  preloadPositionId,
  ...other
}: PositionAutocompleteProps) {
  const { control, setValue } = useFormContext();
  const [options, setOptions] = useState<IPositionOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const preloadedRef = useRef(false);
  const initialLoadRef = useRef(false);

  const { textField, ...otherSlotProps } = slotProps ?? {};

  const fetchPositions = useCallback(async (searchTerm?: string) => {
    try {
      setLoading(true);
      const params = {
        page: 1,
        perPage: 100,
        ...(searchTerm && { search: searchTerm }),
      };

      const response = await GetPositionPaginationService(params);

      if (response?.data?.data) {
        const positionsOptions: IPositionOption[] = response.data.data.map((position) => ({
          id: position.id,
          name: position.name,
          objectives: position.objectives,
          expectedResults: position.expectedResults,
          requirements: position.requirements
        }));
        setOptions(positionsOptions);
      }
    } catch (error) {
      console.error('Error fetching positions:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar posiciones iniciales (solo una vez)
  useEffect(() => {
    if (!initialLoadRef.current) {
      fetchPositions();
      initialLoadRef.current = true;
    }
  }, [fetchPositions]);

  // Buscar posiciones mientras el usuario escribe
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (inputValue) {
        fetchPositions(inputValue);
      } else {
        // Si no hay búsqueda, cargar todas las posiciones
        fetchPositions();
      }
    }, 300); // Debounce de 300ms

    return () => clearTimeout(delayedSearch);
  }, [inputValue, fetchPositions]);

  // Precargar posición específica al editar (solo una vez)
  useEffect(() => {
    if (preloadPositionId && options.length > 0 && !preloadedRef.current) {
      const preloadedPosition = options.find(option => option.id === preloadPositionId);
      if (preloadedPosition) {
        setValue(name, preloadedPosition, { shouldValidate: true });
        preloadedRef.current = true;
      }
    }
  }, [preloadPositionId, options, setValue, name]);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Autocomplete
          options={options}
          loading={loading}
          value={field.value}
          id={`${name}-position-autocomplete`}
          getOptionLabel={(option) => (typeof option === 'string' ? option : option?.name || '')}
          isOptionEqualToValue={(option, value) =>
            typeof option === 'object' && typeof value === 'object' && option?.id === value?.id
          }
          onInputChange={(event, newInputValue) => {
            setInputValue(newInputValue);
          }}
          onChange={(event, newValue) => {
            const positionValue = (newValue && typeof newValue === 'object' && !Array.isArray(newValue)) ? newValue as IPositionOption : null;
            field.onChange(positionValue);
            if (onPositionChange) {
              onPositionChange(positionValue);
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