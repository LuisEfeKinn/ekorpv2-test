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

export type RegionAutocompleteBaseProps = Omit<
  AutocompleteProps<IRegionOption, Multiple, DisableClearable, FreeSolo>,
  ExcludedProps
>;

export type RegionAutocompleteProps = RegionAutocompleteBaseProps & {
  name: string;
  label?: string;
  placeholder?: string;
  helperText?: React.ReactNode;
  countryId?: string; // ID del país seleccionado
  onRegionChange?: (region: IRegionOption | null) => void;
  preloadRegionId?: string; // Para cargar una región específica al editar
  disabled?: boolean;
  slotProps?: RegionAutocompleteBaseProps['slotProps'] & {
    textField?: Partial<TextFieldProps>;
  };
};

export function RegionAutocomplete({
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
}: RegionAutocompleteProps) {
  const { control } = useFormContext();
  const [options, setOptions] = useState<IRegionOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const initialLoadRef = useRef<string | undefined>(undefined);

  const { textField, ...otherSlotProps } = slotProps ?? {};

  const fetchRegions = useCallback(async (searchTerm?: string, regionId?: string, selectedCountryId?: string) => {
    if (!selectedCountryId && !regionId) {
      setOptions([]);
      return;
    }

    try {
      setLoading(true);
      const params = {
        ...(searchTerm && { search: searchTerm }),
        ...(regionId && { id: regionId }),
        ...(selectedCountryId && { countryId: selectedCountryId }),
      };
      
      const response = await GetRegionsService(params);
      
      console.log('Regions response:', response);
      console.log('Regions data:', response?.data);
      
      if (response?.data?.data) {
        const regionsData = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
        
        const regionsOptions: IRegionOption[] = regionsData.map((region) => ({
          id: region.id,
          name: region.name,
          code: region.code,
          countryId: region.countryId,
        }));
        console.log('Regions options:', regionsOptions);
        setOptions(regionsOptions);
      } else {
        console.log('No regions data found');
      }
    } catch (error) {
      console.error('Error fetching regions:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Precargar región específica al editar
  useEffect(() => {
    if (preloadRegionId) {
      fetchRegions(undefined, preloadRegionId);
    }
  }, [preloadRegionId, fetchRegions]);

  // Cargar regiones cuando se selecciona un país
  useEffect(() => {
    if (countryId && !preloadRegionId && initialLoadRef.current !== countryId) {
      fetchRegions(undefined, undefined, countryId);
      setInputValue(''); // Limpiar búsqueda previa
      initialLoadRef.current = countryId;
    } else if (!countryId && !preloadRegionId) {
      setOptions([]);
      initialLoadRef.current = undefined;
    }
  }, [countryId, fetchRegions, preloadRegionId]);

  // Buscar regiones mientras el usuario escribe
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (inputValue && countryId && !preloadRegionId) {
        fetchRegions(inputValue, undefined, countryId);
      }
    }, 300); // Debounce de 300ms

    return () => clearTimeout(delayedSearch);
  }, [inputValue, countryId, fetchRegions, preloadRegionId]);

  console.log(`Rendering ${name} with ${options.length} regions:`, options);
  console.log(`Region loading state: ${loading}, disabled: ${disabled || !countryId}`);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        console.log(`Region field value for ${name}:`, field.value);
        return (
        <Autocomplete
          options={options}
          loading={loading}
          value={field.value}
          disabled={disabled || !countryId}
          id={`${name}-region-autocomplete`}
          getOptionLabel={(option) => {
            console.log('getOptionLabel for region:', option);
            return typeof option === 'string' ? option : option?.name || '';
          }}
          isOptionEqualToValue={(option, value) => {
            console.log('isOptionEqualToValue region:', { option, value });
            return typeof option === 'object' && typeof value === 'object' && option?.id === value?.id;
          }}
          onInputChange={(event, newInputValue) => {
            setInputValue(newInputValue);
          }}
          onChange={(event, newValue) => {
            const regionValue = (newValue && typeof newValue === 'object' && !Array.isArray(newValue)) ? newValue as IRegionOption : null;
            field.onChange(regionValue);
            if (onRegionChange) {
              onRegionChange(regionValue);
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