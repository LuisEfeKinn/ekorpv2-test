import type { TextFieldProps } from '@mui/material/TextField';
import type { IRegionOption } from 'src/types/locations';

import { useState, useEffect, useCallback } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';

import { GetRegionsService } from 'src/services/locations/locations.service';

// ----------------------------------------------------------------------

type Props = {
  name: string;
  label?: string;
  placeholder?: string;
  helperText?: React.ReactNode;
  countryId?: string;
  onRegionChange?: (region: IRegionOption | null) => void;
  preloadRegionId?: string;
  disabled?: boolean;
  textField?: TextFieldProps;
};

export function RegionAutocompleteSimple({
  name,
  label,
  placeholder,
  helperText,
  countryId,
  onRegionChange,
  preloadRegionId,
  disabled,
  textField,
}: Props) {
  const { control, setValue } = useFormContext();

  const [options, setOptions] = useState<IRegionOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const fetchRegions = useCallback(async (searchTerm?: string) => {
    if (!countryId) return;

    setLoading(true);
    try {
      const params = {
        ...(searchTerm && { search: searchTerm }),
        countryId,
      };
      const response = await GetRegionsService(params);

      if (response?.data?.data) {
        const regionsOptions: IRegionOption[] = response.data.data.map((region) => ({
          id: region.id,
          name: region.name,
          code: region.code,
          countryId: region.countryId,
        }));
        setOptions(regionsOptions);
      }
    } catch (error) {
      console.error('Error fetching regions:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [countryId]);

  // Limpiar opciones cuando cambia el país
  useEffect(() => {
    if (!countryId) {
      setOptions([]);
      setInputValue('');
    }
  }, [countryId]);

  // Cargar regiones al abrir el autocomplete
  useEffect(() => {
    if (open && countryId && options.length === 0 && !preloadRegionId) {
      fetchRegions();
    }
  }, [open, countryId, fetchRegions, options.length, preloadRegionId]);

  // Buscar regiones cuando el usuario escribe (con debounce)
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (inputValue && inputValue.length >= 2 && countryId) {
      timeoutId = setTimeout(() => {
        fetchRegions(inputValue);
      }, 300);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [inputValue, countryId, fetchRegions]);

  // Precargar región específica si es necesario
  useEffect(() => {
    if (preloadRegionId && countryId && options.length === 0) {
      GetRegionsService({ id: preloadRegionId }).then((response) => {
        if (response?.data?.data && response.data.data.length > 0) {
          const region = response.data.data[0];
          const regionOption: IRegionOption = {
            id: region.id,
            name: region.name,
            code: region.code,
            countryId: region.countryId,
          };

          // Establecer las opciones
          setOptions([regionOption]);

          // Establecer el valor en el formulario
          setValue(name, regionOption);

          // Notificar al componente padre
          if (onRegionChange) {
            onRegionChange(regionOption);
          }
        }
      });
    }
  }, [preloadRegionId, countryId, onRegionChange, setValue, name, options.length]);

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
          disabled={disabled || !countryId}
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
            if (onRegionChange) {
              onRegionChange(newValue);
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              {...textField}
              label={label}
              placeholder={disabled || !countryId ? 'Selecciona un país primero' : placeholder}
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