import type { TextFieldProps } from '@mui/material/TextField';
import type { AutocompleteProps } from '@mui/material/Autocomplete';
import type { IUserOption } from 'src/types/users';

import { Controller, useFormContext } from 'react-hook-form';
import { useRef, useState, useEffect, useCallback } from 'react';

import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';

import { GetUsersPaginationService } from 'src/services/security/users.service';

// ----------------------------------------------------------------------

type Multiple = boolean | undefined;
type DisableClearable = boolean | undefined;
type FreeSolo = boolean | undefined;

type ExcludedProps = 'renderInput' | 'options' | 'loading' | 'onInputChange' | 'disabled';

export type UserAutocompleteStandaloneBaseProps = Omit<
  AutocompleteProps<IUserOption, Multiple, DisableClearable, FreeSolo>,
  ExcludedProps
>;

export type UserAutocompleteStandaloneProps = UserAutocompleteStandaloneBaseProps & {
  name: string;
  label?: string;
  placeholder?: string;
  helperText?: React.ReactNode;
  onUserChange?: (user: IUserOption | null) => void;
  preloadUserId?: string;
  disabled?: boolean;
  slotProps?: UserAutocompleteStandaloneBaseProps['slotProps'] & {
    textField?: Partial<TextFieldProps>;
  };
};

export function UserAutocompleteStandalone({
  name,
  label,
  slotProps,
  helperText,
  placeholder,
  onUserChange,
  preloadUserId,
  disabled = false,
  ...other
}: UserAutocompleteStandaloneProps) {
  const { control, setValue } = useFormContext();
  const [options, setOptions] = useState<IUserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const preloadedRef = useRef(false);

  const { textField } = slotProps ?? {};

  const fetchUsers = useCallback(async (searchTerm?: string) => {
    try {
      setLoading(true);

      const params = {
        page: 1,
        perPage: 20, // Cargar hasta 1000 usuarios
        ...(searchTerm && { search: searchTerm }),
      };

      const response = await GetUsersPaginationService(params);

      if (response?.data?.data) {
        const usersOptions: IUserOption[] = response.data.data.map((user: any) => ({
          id: user.id,
          names: user.names,
          lastnames: user.lastnames,
          email: user.email,
          isActive: user.isActive,
        }));

        setOptions(usersOptions);

        // Si estamos precargando, buscar y establecer el valor específico
        if (preloadUserId && !preloadedRef.current) {
          const preloadedUser = usersOptions.find(user => user.id === preloadUserId);
          if (preloadedUser) {
            setValue(name, preloadedUser);
            if (onUserChange) {
              onUserChange(preloadedUser);
            }
            preloadedRef.current = true;
          }
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [setValue, name, onUserChange, preloadUserId]);

  // Cargar usuarios al montar el componente
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Buscar con debounce cuando el usuario escribe
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (inputValue && inputValue.length >= 2) {
      timeoutId = setTimeout(() => {
        fetchUsers(inputValue);
      }, 300);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [inputValue, fetchUsers]);

  // Función para generar el label del usuario
  const getUserLabel = (user: IUserOption) => {
    const fullName = user.lastnames
      ? `${user.names} ${user.lastnames}`
      : user.names;
    return fullName;
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Autocomplete
          options={options}
          loading={loading}
          disabled={disabled}
          value={field.value || null}
          getOptionLabel={(option: any) => getUserLabel(option)}
          isOptionEqualToValue={(option, value) => option?.id === value?.id}
          onInputChange={(event, newInputValue, reason) => {
            if (reason === 'input') {
              setInputValue(newInputValue);
            }
          }}
          onChange={(event, newValue) => {
            field.onChange(newValue);
            if (onUserChange) {
              onUserChange(newValue as any);
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
                <div style={{ fontWeight: 'bold' }}>
                  {getUserLabel(option)}
                </div>
                <div style={{ fontSize: '0.8em', color: 'text.secondary' }}>
                  {option.email}
                  {!option.isActive && (
                    <span style={{ color: 'red', marginLeft: '8px' }}>
                      (Inactivo)
                    </span>
                  )}
                </div>
              </div>
            </li>
          )}
          {...other}
        />
      )}
    />
  );
}