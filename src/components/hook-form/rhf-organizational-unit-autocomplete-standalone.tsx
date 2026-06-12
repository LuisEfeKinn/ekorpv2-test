import type { TextFieldProps } from '@mui/material/TextField';
import type { AutocompleteProps } from '@mui/material/Autocomplete';
import type { IOrganizationalUnitOption } from 'src/types/organization';

import { Controller, useFormContext } from 'react-hook-form';
import {
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
  jobPositionKmId?: string;
  onOrganizationalUnitChange?: (organizationalUnit: IOrganizationalUnitOption | null) => void;
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
  jobPositionKmId,
  onOrganizationalUnitChange,
  disabled = false,
  ...other
}: OrganizationalUnitAutocompleteStandaloneProps) {
  const { control, setValue, clearErrors } = useFormContext();
  const [options, setOptions] = useState<IOrganizationalUnitOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const { textField } = slotProps ?? {};
  const isDisabled = disabled || !jobPositionKmId;

  const fetchOrganizationalUnits = useCallback(async (searchTerm?: string) => {
    if (!jobPositionKmId) {
      setOptions([]);
      return;
    }

    try {
      setLoading(true);

      const params = {
        page: 1,
        perPage: 50, // Cargar hasta 50 opciones
        jobPositionId: jobPositionKmId,
        ...(searchTerm && { search: searchTerm }),
      };

      const response = await GetOrganizationUnitPaginationService(params);
      const list = response?.data?.data ?? [];
      const organizationalUnitsOptions = mapOrganizationalUnitOptions(list);

      setOptions(organizationalUnitsOptions);
    } catch (error) {
      console.error('Error fetching organizational units:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [jobPositionKmId]);

  useEffect(() => {
    setOptions([]);
    setInputValue('');
  }, [jobPositionKmId]);

  useEffect(() => {
    if (!open || !jobPositionKmId) {
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
  }, [open, inputValue, fetchOrganizationalUnits, jobPositionKmId]);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Autocomplete
          options={options}
          loading={loading}
          disabled={isDisabled}
          open={open}
          value={field.value || null}
          onOpen={() => setOpen(true)}
          onClose={() => setOpen(false)}
          getOptionLabel={(option: any) => option?.name || ''}
          isOptionEqualToValue={(option, value) => option?.id === value?.id}
          onInputChange={(event, newInputValue) => {
            setInputValue(newInputValue);
          }}
          onChange={(event, newValue) => {
            const organizationalUnitValue = (newValue && typeof newValue === 'object' && !Array.isArray(newValue))
              ? newValue as IOrganizationalUnitOption
              : null;

            setValue(name, organizationalUnitValue, {
              shouldValidate: true,
              shouldDirty: true,
              shouldTouch: true,
            });

            if (organizationalUnitValue) {
              clearErrors(name);
            }

            if (onOrganizationalUnitChange) {
              onOrganizationalUnitChange(organizationalUnitValue);
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
