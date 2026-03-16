import type { TextFieldProps } from '@mui/material/TextField';
import type { AutocompleteProps } from '@mui/material/Autocomplete';
import type { ICountryOption } from 'src/types/locations';

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

import { GetCountriesService } from 'src/services/locations/locations.service';

// ----------------------------------------------------------------------

type Multiple = boolean | undefined;
type DisableClearable = boolean | undefined;
type FreeSolo = boolean | undefined;

type ExcludedProps = 'renderInput' | 'options' | 'loading' | 'onInputChange';

export type CountryAutocompleteBaseProps = Omit<
  AutocompleteProps<ICountryOption, Multiple, DisableClearable, FreeSolo>,
  ExcludedProps
>;

export type CountryAutocompleteProps = CountryAutocompleteBaseProps & {
  name: string;
  label?: string;
  placeholder?: string;
  helperText?: React.ReactNode;
  onCountryChange?: (country: ICountryOption | null) => void;
  preloadCountryId?: string; // Para cargar un país específico al editar
  slotProps?: CountryAutocompleteBaseProps['slotProps'] & {
    textField?: Partial<TextFieldProps>;
  };
};

export function CountryAutocomplete({
  name,
  label,
  slotProps,
  helperText,
  placeholder,
  onCountryChange,
  preloadCountryId,
  ...other
}: CountryAutocompleteProps) {
  const { control } = useFormContext();
  const [options, setOptions] = useState<ICountryOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const initialLoadRef = useRef(false);

  const { textField, ...otherSlotProps } = slotProps ?? {};

  const fetchCountries = useCallback(async (searchTerm?: string, countryId?: string) => {
    try {
      setLoading(true);
      const params = {
        ...(searchTerm && { search: searchTerm }),
        ...(countryId && { id: countryId }),
      };

      const response = await GetCountriesService(params);

      console.log('Countries response:', response);
      console.log('Countries data:', response?.data);

      if (response?.data?.data) {
        const countriesOptions: ICountryOption[] = response.data.data.map((country) => ({
          id: country.id,
          name: country.name,
          code: country.code,
        }));
        console.log('Countries options:', countriesOptions);
        setOptions(countriesOptions);
      } else {
        console.log('No countries data found');
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Precargar país específico al editar
  useEffect(() => {
    if (preloadCountryId) {
      fetchCountries(undefined, preloadCountryId);
      initialLoadRef.current = true;
    } else if (!initialLoadRef.current) {
      // Cargar países iniciales sin filtro solo una vez
      fetchCountries();
      initialLoadRef.current = true;
    }
  }, [preloadCountryId, fetchCountries]);

  // Buscar países mientras el usuario escribe
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (inputValue && !preloadCountryId) {
        fetchCountries(inputValue);
      }
    }, 300); // Debounce de 300ms

    return () => clearTimeout(delayedSearch);
  }, [inputValue, fetchCountries, preloadCountryId]);

  console.log(`Rendering ${name} with ${options.length} options:`, options);
  console.log(`Loading state: ${loading}`);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        console.log(`Field value for ${name}:`, field.value);
        return (
          <Autocomplete
            options={options}
            loading={loading}
            value={field.value}
            id={`${name}-country-autocomplete`}
            getOptionLabel={(option) => {
              console.log('getOptionLabel for country:', option);
              return typeof option === 'string' ? option : option?.name || '';
            }}
            isOptionEqualToValue={(option, value) => {
              console.log('isOptionEqualToValue country:', { option, value });
              return typeof option === 'object' && typeof value === 'object' && option?.id === value?.id;
            }}
            onInputChange={(event, newInputValue) => {
              setInputValue(newInputValue);
            }}
            onChange={(event, newValue) => {
              const countryValue = (newValue && typeof newValue === 'object' && !Array.isArray(newValue)) ? newValue as ICountryOption : null;
              field.onChange(countryValue);
              if (onCountryChange) {
                onCountryChange(countryValue);
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
        );
      }}
    />
  );
}