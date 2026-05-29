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

export type RegionAutocompleteUltraSimpleBaseProps = Omit<
  AutocompleteProps<IRegionOption, Multiple, DisableClearable, FreeSolo>,
  ExcludedProps
>;

export type RegionAutocompleteUltraSimpleProps = RegionAutocompleteUltraSimpleBaseProps & {
  name: string;
  label?: string;
  placeholder?: string;
  helperText?: React.ReactNode;
  countryId?: string;
  onRegionChange?: (region: IRegionOption | null) => void;
  preloadRegionId?: string;
  disabled?: boolean;
  slotProps?: RegionAutocompleteUltraSimpleBaseProps['slotProps'] & {
    textField?: Partial<TextFieldProps>;
  };
};

export function RegionAutocompleteUltraSimple({
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
}: RegionAutocompleteUltraSimpleProps) {
  const { control, setValue } = useFormContext();
  const [options, setOptions] = useState<IRegionOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const preloadedRef = useRef(false);

  const { textField } = slotProps ?? {};

  const fetchRegions = useCallback(async (searchTerm?: string, regionId?: string) => {
    try {
      setLoading(true);
      const params: any = {};

      if (regionId) {
        // Para precargar una región específica
        params.id = regionId;
      } else if (countryId) {
        // Para buscar regiones por país
        params.countryId = countryId;
        if (searchTerm) {
          params.search = searchTerm;
        }
      } else {
        return; // No hacer nada si no hay país ni región específica
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

        // Si estamos precargando, establecer el valor
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

  // Cargar regiones cuando cambia el país
  useEffect(() => {
    if (countryId && !preloadRegionId) {
      fetchRegions();
    } else if (!countryId) {
      setOptions([]);
      setInputValue('');
    }
  }, [countryId, fetchRegions, preloadRegionId]);

  // Buscar con debounce cuando el usuario escribe
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