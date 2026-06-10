import type { TextFieldProps } from '@mui/material/TextField';
import type { AutocompleteProps } from '@mui/material/Autocomplete';
import type { IOrganizationalUnitOption } from 'src/types/organization';

import { Controller, useFormContext } from 'react-hook-form';
import {
  useRef,
  useState,
  useEffect,
  useCallback,
} from 'react';

import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';

import {
  GetOrganizationUnitPaginationService,
} from 'src/services/organization/organizationalUnit.service';

// ----------------------------------------------------------------------

type Multiple = boolean | undefined;
type DisableClearable = boolean | undefined;
type FreeSolo = boolean | undefined;

type ExcludedProps = 'renderInput' | 'options' | 'loading' | 'onInputChange' | 'disabled';

export type OrganizationalUnitAutocompleteStandaloneBaseProps = Omit<
  AutocompleteProps<IOrganizationalUnitOption, Multiple, DisableClearable, FreeSolo>,
  ExcludedProps
>;

export type OrganizationalUnitAutocompleteStandaloneProps = OrganizationalUnitAutocompleteStandaloneBaseProps & {
  name: string;
  label?: string;
  placeholder?: string;
  helperText?: React.ReactNode;
  onOrganizationalUnitChange?: (organizationalUnit: IOrganizationalUnitOption | null) => void;
  preloadOrganizationalUnitId?: string;
  disabled?: boolean;
  slotProps?: OrganizationalUnitAutocompleteStandaloneBaseProps['slotProps'] & {
    textField?: Partial<TextFieldProps>;
  };
};

const mapOrganizationalUnitOptions = (list: IOrganizationalUnitOption[]): IOrganizationalUnitOption[] =>
  list.map((unit) => ({
    id: String(unit.id),
    name: unit.name,
    code: unit.code,
    description: unit.description,
    color: unit.color,
  }));

export function OrganizationalUnitAutocompleteStandalone({
  name,
  label,
  slotProps,
  helperText,
  placeholder,
  onOrganizationalUnitChange,
  preloadOrganizationalUnitId,
  disabled = false,
  ...other
}: OrganizationalUnitAutocompleteStandaloneProps) {
  const { control, setValue } = useFormContext();
  const [options, setOptions] = useState<IOrganizationalUnitOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const preloadedRef = useRef(false);
  const skipFirstSearchEffectRef = useRef(true);

  const { textField } = slotProps ?? {};

  const fetchOrganizationalUnits = useCallback(async (searchTerm?: string) => {
    try {
      setLoading(true);

      const params = {
        page: 1,
        perPage: 50, // Cargar hasta 50 opciones
        ...(searchTerm && { search: searchTerm }),
      };

      const response = await GetOrganizationUnitPaginationService(params);
      const list = response?.data?.data ?? [];
      const organizationalUnitsOptions = mapOrganizationalUnitOptions(list);

      setOptions(organizationalUnitsOptions);

      // Si estamos precargando, buscar y establecer el valor específico
      if (preloadOrganizationalUnitId && !preloadedRef.current) {
        const preloadedUnit = organizationalUnitsOptions.find(
          (unit) => unit.id === String(preloadOrganizationalUnitId)
        );

        if (preloadedUnit) {
          setValue(name, preloadedUnit, { shouldValidate: true });
          if (onOrganizationalUnitChange) {
            onOrganizationalUnitChange(preloadedUnit);
          }
          preloadedRef.current = true;
        }
      }
    } catch (error) {
      console.error('Error fetching organizational units:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [setValue, name, onOrganizationalUnitChange, preloadOrganizationalUnitId]);

  // Cargar unidades organizacionales al montar el componente
  useEffect(() => {
    fetchOrganizationalUnits();
  }, [fetchOrganizationalUnits]);

  // Buscar con debounce cuando el usuario escribe
  useEffect(() => {
    if (skipFirstSearchEffectRef.current) {
      skipFirstSearchEffectRef.current = false;
      return undefined;
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const trimmedInputValue = inputValue.trim();

    if (trimmedInputValue.length === 0) {
      timeoutId = setTimeout(() => {
        fetchOrganizationalUnits();
      }, 300);
    } else if (trimmedInputValue.length >= 2) {
      timeoutId = setTimeout(() => {
        fetchOrganizationalUnits(trimmedInputValue);
      }, 300);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [inputValue, fetchOrganizationalUnits]);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Autocomplete
          options={options}
          loading={loading}
          disabled={disabled}
          value={field.value || null}
          getOptionLabel={(option: any) => option?.name || ''}
          isOptionEqualToValue={(option, value) => option?.id === value?.id}
          onInputChange={(event, newInputValue, reason) => {
            if (reason === 'input') {
              setInputValue(newInputValue);
            }
          }}
          onChange={(event, newValue) => {
            field.onChange(newValue);
            if (onOrganizationalUnitChange) {
              onOrganizationalUnitChange(newValue as any);
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
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          renderOption={(props, option) => (
            <li {...props} key={option.id}>
              <div>
                <div style={{ fontWeight: 'bold' }}>{option.name}</div>
                {option.code && (
                  <div style={{ fontSize: '0.8em', color: 'text.secondary' }}>
                    {option.code} {option.description && `- ${option.description}`}
                  </div>
                )}
              </div>
            </li>
          )}
          {...other}
        />
      )}
    />
  );
}
