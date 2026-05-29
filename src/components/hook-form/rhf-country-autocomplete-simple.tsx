import type { TextFieldProps } from '@mui/material/TextField';
import type { ICountryOption } from 'src/types/locations';

import { useState, useEffect, useCallback } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';

import { GetCountriesService } from 'src/services/locations/locations.service';

// ----------------------------------------------------------------------

type Props = {
  name: string;
  label?: string;
  placeholder?: string;
  helperText?: React.ReactNode;
  onCountryChange?: (country: ICountryOption | null) => void;
  preloadCountryId?: string;
  textField?: TextFieldProps;
};

export function CountryAutocompleteSimple({
  name,
  label,
  placeholder,
  helperText,
  onCountryChange,
  preloadCountryId,
  textField,
}: Props) {
  const { control, setValue } = useFormContext();

  const [options, setOptions] = useState<ICountryOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const fetchCountries = useCallback(async (searchTerm?: string) => {
    setLoading(true);
    try {
      const params = searchTerm ? { search: searchTerm } : {};
      const response = await GetCountriesService(params);

      if (response?.data?.data) {
        const countriesOptions: ICountryOption[] = response.data.data.map((country) => ({
          id: country.id,
          name: country.name,
          code: country.code,
        }));
        setOptions(countriesOptions);
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar países al abrir el autocomplete
  useEffect(() => {
    if (open && options.length === 0 && !preloadCountryId) {
      fetchCountries();
    }
  }, [open, fetchCountries, options.length, preloadCountryId]);

  // Buscar países cuando el usuario escribe (con debounce)
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (inputValue && inputValue.length >= 2) {
      timeoutId = setTimeout(() => {
        fetchCountries(inputValue);
      }, 300);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [inputValue, fetchCountries]);

  // Precargar país específico si es necesario
  useEffect(() => {
    if (preloadCountryId && options.length === 0) {
      GetCountriesService({ id: preloadCountryId }).then((response) => {
        if (response?.data?.data && response.data.data.length > 0) {
          const country = response.data.data[0];
          const countryOption: ICountryOption = {
            id: country.id,
            name: country.name,
            code: country.code,
          };

          // Establecer las opciones
          setOptions([countryOption]);

          // Establecer el valor en el formulario
          setValue(name, countryOption);

          // Notificar al componente padre sobre la selección
          if (onCountryChange) {
            onCountryChange(countryOption);
          }
        }
      });
    }
  }, [preloadCountryId, onCountryChange, setValue, name, options.length]);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Autocomplete
          open={open}
          onOpen={() => setOpen(true)}
          onClose={() => setOpen(false)}
          options={options}
          loading={loading}
          value={field.value || null}
          getOptionLabel={(option) => option.name || ''}
          isOptionEqualToValue={(option, value) => option.id === value?.id}
          onInputChange={(event, newInputValue, reason) => {
            // Solo actualizar inputValue si es por input del usuario
            if (reason === 'input') {
              setInputValue(newInputValue);
            }
          }}
          onChange={(event, newValue) => {
            field.onChange(newValue);
            if (onCountryChange) {
              onCountryChange(newValue);
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
        />
      )}
    />
  );
}