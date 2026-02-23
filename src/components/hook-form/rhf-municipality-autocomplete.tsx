import type { TextFieldProps } from '@mui/material/TextField';
import type { AutocompleteProps } from '@mui/material/Autocomplete';
import type { IMunicipalityOption } from 'src/types/locations';

import { useState, useEffect, useCallback } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';

import { GetMunicipalitiesService } from 'src/services/locations/locations.service';

// ----------------------------------------------------------------------

type Multiple = boolean | undefined;
type DisableClearable = boolean | undefined;
type FreeSolo = boolean | undefined;

type ExcludedProps = 'renderInput' | 'options' | 'loading' | 'onInputChange' | 'disabled';

export type MunicipalityAutocompleteBaseProps = Omit<
  AutocompleteProps<IMunicipalityOption, Multiple, DisableClearable, FreeSolo>,
  ExcludedProps
>;

export type MunicipalityAutocompleteProps = MunicipalityAutocompleteBaseProps & {
  name: string;
  label?: string;
  placeholder?: string;
  helperText?: React.ReactNode;
  regionId?: string; // ID de la región seleccionada
  onMunicipalityChange?: (municipality: IMunicipalityOption | null) => void;
  preloadMunicipalityId?: string; // Para cargar un municipio específico al editar
  disabled?: boolean;
  slotProps?: MunicipalityAutocompleteBaseProps['slotProps'] & {
    textField?: Partial<TextFieldProps>;
  };
};

export function MunicipalityAutocomplete({
  name,
  label,
  slotProps,
  helperText,
  placeholder,
  regionId,
  onMunicipalityChange,
  preloadMunicipalityId,
  disabled = false,
  ...other
}: MunicipalityAutocompleteProps) {
  const { control } = useFormContext();
  const [options, setOptions] = useState<IMunicipalityOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const { textField, ...otherSlotProps } = slotProps ?? {};

  const fetchMunicipalities = useCallback(async (searchTerm?: string, municipalityId?: string, selectedRegionId?: string) => {
    if (!selectedRegionId && !municipalityId) {
      setOptions([]);
      return;
    }

    try {
      setLoading(true);
      const params = {
        ...(searchTerm && { search: searchTerm }),
        ...(municipalityId && { municipalityId }),
        ...(selectedRegionId && { regionId: selectedRegionId }),
      };
      
      const response = await GetMunicipalitiesService(params);
      
      if (response?.data?.data) {
        const municipalitiesOptions: IMunicipalityOption[] = response.data.data.map((municipality) => ({
          id: municipality.id,
          name: municipality.name,
          regionId: municipality.regionId,
          regionName: municipality.regionName,
          countryId: municipality.countryId,
          countryName: municipality.countryName,
        }));
        setOptions(municipalitiesOptions);
      }
    } catch (error) {
      console.error('Error fetching municipalities:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Precargar municipio específico al editar
  useEffect(() => {
    if (preloadMunicipalityId) {
      fetchMunicipalities(undefined, preloadMunicipalityId);
    }
  }, [preloadMunicipalityId, fetchMunicipalities]);

  // Cargar municipios cuando se selecciona una región
  useEffect(() => {
    if (regionId && !preloadMunicipalityId) {
      fetchMunicipalities(undefined, undefined, regionId);
      setInputValue(''); // Limpiar búsqueda previa
    } else if (!regionId && !preloadMunicipalityId) {
      setOptions([]);
    }
  }, [regionId, fetchMunicipalities, preloadMunicipalityId]);

  // Buscar municipios mientras el usuario escribe
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (inputValue && regionId && !preloadMunicipalityId) {
        fetchMunicipalities(inputValue, undefined, regionId);
      }
    }, 300); // Debounce de 300ms

    return () => clearTimeout(delayedSearch);
  }, [inputValue, regionId, fetchMunicipalities, preloadMunicipalityId]);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Autocomplete
          options={options}
          loading={loading}
          value={field.value}
          disabled={disabled || !regionId}
          id={`${name}-municipality-autocomplete`}
          getOptionLabel={(option) => (typeof option === 'string' ? option : option?.name || '')}
          isOptionEqualToValue={(option, value) => 
            typeof option === 'object' && typeof value === 'object' && option?.id === value?.id
          }
          onInputChange={(event, newInputValue) => {
            setInputValue(newInputValue);
          }}
          onChange={(event, newValue) => {
            const municipalityValue = (newValue && typeof newValue === 'object' && !Array.isArray(newValue)) ? newValue as IMunicipalityOption : null;
            field.onChange(municipalityValue);
            if (onMunicipalityChange) {
              onMunicipalityChange(municipalityValue);
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              {...textField}
              label={label}
              placeholder={disabled || !regionId ? 'Selecciona una región primero' : placeholder}
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