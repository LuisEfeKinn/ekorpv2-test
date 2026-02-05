import type { TextFieldProps } from '@mui/material/TextField';
import type { AutocompleteProps } from '@mui/material/Autocomplete';
import type { IMunicipalityOption } from 'src/types/locations';

import { Controller, useFormContext } from 'react-hook-form';
import {
  useRef,
  useState,
  useEffect,
  useCallback
} from 'react';

import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';

import { GetMunicipalitiesService } from 'src/services/locations/locations.service';

// ----------------------------------------------------------------------

type Multiple = boolean | undefined;
type DisableClearable = boolean | undefined;
type FreeSolo = boolean | undefined;

type ExcludedProps = 'renderInput' | 'options' | 'loading' | 'onInputChange' | 'disabled';

export type MunicipalityAutocompleteStandaloneBaseProps = Omit<
  AutocompleteProps<IMunicipalityOption, Multiple, DisableClearable, FreeSolo>,
  ExcludedProps
>;

export type MunicipalityAutocompleteStandaloneProps = MunicipalityAutocompleteStandaloneBaseProps & {
  name: string;
  label?: string;
  placeholder?: string;
  helperText?: React.ReactNode;
  regionId?: string;
  onMunicipalityChange?: (municipality: IMunicipalityOption | null) => void;
  preloadMunicipalityId?: string;
  disabled?: boolean;
  slotProps?: MunicipalityAutocompleteStandaloneBaseProps['slotProps'] & {
    textField?: Partial<TextFieldProps>;
  };
};

export function MunicipalityAutocompleteStandalone({
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
}: MunicipalityAutocompleteStandaloneProps) {
  const { control, setValue } = useFormContext();
  const [options, setOptions] = useState<IMunicipalityOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const preloadedRef = useRef(false);
  const currentRegionRef = useRef<string | undefined>(undefined);

  const { textField } = slotProps ?? {};

  const fetchMunicipalities = useCallback(async (searchTerm?: string, municipalityId?: string, forceRegionId?: string) => {
    try {
      setLoading(true);
      const params: any = {};

      if (municipalityId) {
        params.municipalityId = municipalityId;
      } else {
        const currentRegionId = forceRegionId || regionId;
        if (currentRegionId) {
          params.regionId = currentRegionId;
          if (searchTerm) {
            params.search = searchTerm;
          }
        } else {
          setOptions([]);
          return;
        }
      }
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

        if (municipalityId && municipalitiesOptions.length > 0) {
          const municipalityOption = municipalitiesOptions[0];
          setValue(name, municipalityOption);
          if (onMunicipalityChange) {
            onMunicipalityChange(municipalityOption);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching municipalities:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [regionId, setValue, name, onMunicipalityChange]);

  // Precargar municipio específico solo una vez
  useEffect(() => {
    if (preloadMunicipalityId && !preloadedRef.current) {
      preloadedRef.current = true;
      fetchMunicipalities(undefined, preloadMunicipalityId);
    }
  }, [preloadMunicipalityId, fetchMunicipalities]);

  // Manejar cambios de región
  useEffect(() => {
    const currentRegionId = regionId;

    // Si no hay región, limpiar todo
    if (!currentRegionId) {
      setOptions([]);
      setInputValue('');
      currentRegionRef.current = undefined;
      return;
    }

    // Si cambió la región (incluye primera selección)
    if (currentRegionRef.current !== currentRegionId) {

      // Si había una región anterior diferente y no estamos precargando, limpiar el valor actual
      if (currentRegionRef.current && currentRegionRef.current !== currentRegionId && !preloadMunicipalityId) {
        setValue(name, null);
        if (onMunicipalityChange) {
          onMunicipalityChange(null);
        }
      }

      // Actualizar referencia de la región actual
      currentRegionRef.current = currentRegionId;

      // Cargar municipios de la región siempre que haya una región válida
      // Solo omitir si estamos en el proceso de preload inicial de un municipio específico
      if (!preloadMunicipalityId || preloadedRef.current) {
        fetchMunicipalities(undefined, undefined, currentRegionId);
      }
    }
  }, [regionId, fetchMunicipalities, preloadMunicipalityId, setValue, name, onMunicipalityChange]);

  // Buscar con debounce cuando el usuario escribe
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (inputValue && inputValue.length >= 2 && regionId) {
      timeoutId = setTimeout(() => {
        fetchMunicipalities(inputValue, undefined, regionId);
      }, 300);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [inputValue, regionId, fetchMunicipalities]);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Autocomplete
          options={options}
          loading={loading}
          disabled={disabled || !regionId}
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
            if (onMunicipalityChange) {
              onMunicipalityChange(newValue as any);
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