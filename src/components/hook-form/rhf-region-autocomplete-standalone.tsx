import type { TextFieldProps } from '@mui/material/TextField';
import type { AutocompleteProps } from '@mui/material/Autocomplete';
import type { IRegionOption } from 'src/types/locations';

import { Controller, useFormContext } from 'react-hook-form';
import { useRef, useState, useEffect, useCallback } from 'react';

import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';

import { GetRegionsService } from 'src/services/locations/locations.service';

// ----------------------------------------------------------------------

type Multiple = boolean | undefined;
type DisableClearable = boolean | undefined;
type FreeSolo = boolean | undefined;

type ExcludedProps = 'renderInput' | 'options' | 'loading' | 'onInputChange' | 'disabled';

export type RegionAutocompleteStandaloneBaseProps = Omit<
  AutocompleteProps<IRegionOption, Multiple, DisableClearable, FreeSolo>,
  ExcludedProps
>;

export type RegionAutocompleteStandaloneProps = RegionAutocompleteStandaloneBaseProps & {
  name: string;
  label?: string;
  placeholder?: string;
  helperText?: React.ReactNode;
  countryId?: string;
  onRegionChange?: (region: IRegionOption | null) => void;
  preloadRegionId?: string;
  disabled?: boolean;
  slotProps?: RegionAutocompleteStandaloneBaseProps['slotProps'] & {
    textField?: Partial<TextFieldProps>;
  };
};

export function RegionAutocompleteStandalone({
  name,
  label,
  slotProps,
  helperText,
  placeholder,
  countryId,
  onRegionChange,
  preloadRegionId,
  disabled = false,
  ...other
}: RegionAutocompleteStandaloneProps) {
  const { control, setValue } = useFormContext();
  const [options, setOptions] = useState<IRegionOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const preloadedRef = useRef(false);
  const currentCountryRef = useRef<string | undefined>(undefined);

  const { textField } = slotProps ?? {};

  const fetchRegions = useCallback(async (searchTerm?: string, regionId?: string, forceCountryId?: string) => {
    try {
      setLoading(true);
      const params: any = {};

      if (regionId) {
        params.id = regionId;
      } else {
        const currentCountryId = forceCountryId || countryId;
        if (currentCountryId) {
          params.countryId = currentCountryId;
          if (searchTerm) {
            params.search = searchTerm;
          }
        } else {
          setOptions([]);
          return;
        }
      }

      const response = await GetRegionsService(params);

      if (response?.data?.data) {
        const regionsOptions: IRegionOption[] = response.data.data.map((region) => ({
          id: region.id,
          name: region.name,
          code: region.code,
          countryId: region.countryId,
        }));

        setOptions(regionsOptions);

        if (regionId && regionsOptions.length > 0) {
          const regionOption = regionsOptions[0];
          setValue(name, regionOption);
          if (onRegionChange) {
            onRegionChange(regionOption);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching regions:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [countryId, setValue, name, onRegionChange]);

  // Precargar región específica solo una vez
  useEffect(() => {
    if (preloadRegionId && !preloadedRef.current) {
      preloadedRef.current = true;
      fetchRegions(undefined, preloadRegionId);
    }
  }, [preloadRegionId, fetchRegions]);

  // Manejar cambios de país
  useEffect(() => {
    const currentCountryId = countryId;

    // Si no hay país, limpiar todo
    if (!currentCountryId) {
      setOptions([]);
      setInputValue('');
      currentCountryRef.current = undefined;
      return;
    }

    // Si cambió el país (incluye primera selección)
    if (currentCountryRef.current !== currentCountryId) {

      // Si había un país anterior diferente y no estamos precargando, limpiar el valor actual
      if (currentCountryRef.current && currentCountryRef.current !== currentCountryId && !preloadRegionId) {
        setValue(name, null);
        if (onRegionChange) {
          onRegionChange(null);
        }
      }

      // Actualizar referencia del país actual
      currentCountryRef.current = currentCountryId;

      // Cargar regiones del país siempre que haya un país válido
      // Solo omitir si estamos en el proceso de preload inicial de una región específica
      if (!preloadRegionId || preloadedRef.current) {
        fetchRegions(undefined, undefined, currentCountryId);
      }
    }
  }, [countryId, fetchRegions, preloadRegionId, setValue, name, onRegionChange]);

  // Buscar con debounce cuando el usuario escribe
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (inputValue && inputValue.length >= 2 && countryId) {
      timeoutId = setTimeout(() => {
        fetchRegions(inputValue, undefined, countryId);
      }, 300);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [inputValue, countryId, fetchRegions]);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Autocomplete
          options={options}
          loading={loading}
          disabled={disabled || !countryId}
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
            if (onRegionChange) {
              onRegionChange(newValue as any);
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
          {...other}
        />
      )}
    />
  );
}