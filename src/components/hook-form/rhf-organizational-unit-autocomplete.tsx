// types
import type { TextFieldProps } from '@mui/material/TextField';
import type { AutocompleteProps } from '@mui/material/Autocomplete';
import type { IOrganizationalUnitOption } from 'src/types/organization';

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
import {
  GetOrganizationalUnitPaginationService,
  normalizeOrganizationalUnitListResponse,
} from 'src/services/organization/organizationalUnit.service';

// ----------------------------------------------------------------------

type Multiple = false;
type DisableClearable = false;
type FreeSolo = false;

type ExcludedProps = 'renderInput' | 'options' | 'loading' | 'onInputChange';

export type OrganizationalUnitAutocompleteBaseProps = Omit<
  AutocompleteProps<IOrganizationalUnitOption, Multiple, DisableClearable, FreeSolo>,
  ExcludedProps
>;

export type OrganizationalUnitAutocompleteProps = OrganizationalUnitAutocompleteBaseProps & {
  name: string;
  label?: string;
  placeholder?: string;
  helperText?: React.ReactNode;
  onOrganizationalUnitChange?: (organizationalUnit: IOrganizationalUnitOption | null) => void;
  preloadOrganizationalUnitId?: string; // Para cargar una unidad organizacional específica al editar
  slotProps?: OrganizationalUnitAutocompleteBaseProps['slotProps'] & {
    textField?: Partial<TextFieldProps>;
  };
};

export function OrganizationalUnitAutocomplete({
  name,
  label,
  slotProps,
  helperText,
  placeholder,
  onOrganizationalUnitChange,
  preloadOrganizationalUnitId,
  ...other
}: OrganizationalUnitAutocompleteProps) {
  const { control, setValue } = useFormContext();
  const [options, setOptions] = useState<IOrganizationalUnitOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const preloadedRef = useRef(false);
  const initialLoadRef = useRef(false);

  const { textField, ...otherSlotProps } = slotProps ?? {};

  const fetchOrganizationalUnits = useCallback(async (searchTerm?: string) => {
    try {
      setLoading(true);
      const params = {
        page: 1,
        perPage: 100,
        ...(searchTerm && { search: searchTerm }),
      };

      const response = await GetOrganizationalUnitPaginationService(params);

      const list = response?.data ? normalizeOrganizationalUnitListResponse(response.data) : [];
      const organizationalUnitsOptions: IOrganizationalUnitOption[] = list.map((unit) => ({
        id: unit.id,
        name: unit.name,
        code: unit.code,
        description: unit.description,
        color: unit.color,
      }));
      setOptions(organizationalUnitsOptions);
    } catch (error) {
      console.error('Error fetching organizational units:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar unidades organizacionales iniciales (solo una vez)
  useEffect(() => {
    if (!initialLoadRef.current) {
      fetchOrganizationalUnits();
      initialLoadRef.current = true;
    }
  }, [fetchOrganizationalUnits]);

  // Buscar unidades organizacionales mientras el usuario escribe
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (inputValue) {
        fetchOrganizationalUnits(inputValue);
      } else {
        // Si no hay búsqueda, cargar todas las unidades organizacionales
        fetchOrganizationalUnits();
      }
    }, 300); // Debounce de 300ms

    return () => clearTimeout(delayedSearch);
  }, [inputValue, fetchOrganizationalUnits]);

  // Precargar unidad organizacional específica al editar (solo una vez)
  useEffect(() => {
    if (preloadOrganizationalUnitId && options.length > 0 && !preloadedRef.current) {
      const preloadedOrganizationalUnit = options.find(option => option.id === preloadOrganizationalUnitId);
      if (preloadedOrganizationalUnit) {
        setValue(name, preloadedOrganizationalUnit, { shouldValidate: true });
        preloadedRef.current = true;
      }
    }
  }, [preloadOrganizationalUnitId, options, setValue, name]);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Autocomplete
          {...field}
          options={options}
          loading={loading}
          id={`${name}-organizational-unit-autocomplete`}
          getOptionLabel={(option) => (typeof option === 'string' ? option : option?.name || '')}
          isOptionEqualToValue={(option, value) =>
            typeof option === 'object' && typeof value === 'object' && option?.id === value?.id
          }
          onInputChange={(event, newInputValue) => {
            setInputValue(newInputValue);
          }}
          onChange={(event, newValue) => {
            const organizationalUnitValue = (newValue && typeof newValue === 'object' && !Array.isArray(newValue)) ? newValue as IOrganizationalUnitOption : null;
            setValue(name, organizationalUnitValue, { shouldValidate: true });
            if (onOrganizationalUnitChange) {
              onOrganizationalUnitChange(organizationalUnitValue);
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
