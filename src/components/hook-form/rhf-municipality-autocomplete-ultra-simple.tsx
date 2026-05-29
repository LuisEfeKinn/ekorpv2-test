import type { TextFieldProps } from '@mui/material/TextField';
import type { AutocompleteProps } from '@mui/material/Autocomplete';
import type { IMunicipalityOption } from 'src/types/locations';

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

import { GetMunicipalitiesService } from 'src/services/locations/locations.service';

// ----------------------------------------------------------------------

type Multiple = boolean | undefined;
type DisableClearable = boolean | undefined;
type FreeSolo = boolean | undefined;

type ExcludedProps = 'renderInput' | 'options' | 'loading' | 'onInputChange' | 'disabled';

export type MunicipalityAutocompleteUltraSimpleBaseProps = Omit<
  AutocompleteProps<IMunicipalityOption, Multiple, DisableClearable, FreeSolo>,
  ExcludedProps
>;

export type MunicipalityAutocompleteUltraSimpleProps = MunicipalityAutocompleteUltraSimpleBaseProps & {
  name: string;
  label?: string;
  placeholder?: string;
  helperText?: React.ReactNode;
  regionId?: string;
  onMunicipalityChange?: (municipality: IMunicipalityOption | null) => void;
  preloadMunicipalityId?: string;
  disabled?: boolean;
  slotProps?: MunicipalityAutocompleteUltraSimpleBaseProps['slotProps'] & {
    textField?: Partial<TextFieldProps>;
  };
};

export function MunicipalityAutocompleteUltraSimple({
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
}: MunicipalityAutocompleteUltraSimpleProps) {
  const { control, setValue } = useFormContext();
  const [options, setOptions] = useState<IMunicipalityOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const preloadedRef = useRef(false);

  const { textField } = slotProps ?? {};

  const fetchMunicipalities = useCallback(async (searchTerm?: string, municipalityId?: string) => {
    try {
      setLoading(true);
      const params: any = {};

      if (municipalityId) {
        // Para precargar un municipio específico
        params.municipalityId = municipalityId;
      } else if (regionId) {
        // Para buscar municipios por región
        params.regionId = regionId;
        if (searchTerm) {
          params.search = searchTerm;
        }
      } else {
        return; // No hacer nada si no hay región ni municipio específico
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

        // Si estamos precargando, establecer el valor
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

  // Cargar municipios cuando cambia la región
  useEffect(() => {
    if (regionId && !preloadMunicipalityId) {
      fetchMunicipalities();
    } else if (!regionId) {
      setOptions([]);
      setInputValue('');
    }
  }, [regionId, fetchMunicipalities, preloadMunicipalityId]);

  // Buscar con debounce cuando el usuario escribe
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (inputValue && inputValue.length >= 2 && regionId) {
      timeoutId = setTimeout(() => {
        fetchMunicipalities(inputValue);
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