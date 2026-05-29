'use client';

import type { IUserManagement } from 'src/types/employees';

import { useDebounce } from 'minimal-shared/hooks';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import { GetUserManagmentPaginationService } from 'src/services/employees/user-managment.service';

// ----------------------------------------------------------------------

export type EmployeeOption = {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string | null;
};

type Props = {
  value: EmployeeOption[];
  onChange: (employees: EmployeeOption[]) => void;
  maxEmployees?: number;
};

export function PositionEmployeesAutocomplete({ value, onChange, maxEmployees }: Props) {
  const { t } = useTranslate('organization');
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(false);

  const debouncedSearch = useDebounce(inputValue, 400);

  const fetchEmployees = useCallback(async (search?: string) => {
    setLoading(true);
    try {
      const response = await GetUserManagmentPaginationService({
        page: 1,
        perPage: 20,
        ...(search?.trim() ? { search: search.trim() } : {}),
      });

      const data: EmployeeOption[] = (response.data?.data || []).map(
        (emp: IUserManagement) => {
          const nameParts = [
            emp.firstName,
            emp.secondName,
            emp.firstLastName,
            emp.secondLastName,
          ]
            .filter(Boolean)
            .join(' ');

          return {
            id: String(emp.id),
            name: nameParts || emp.email || String(emp.id),
            email: emp.email,
            avatarUrl: null,
          };
        }
      );

      setOptions(data);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees(debouncedSearch);
  }, [debouncedSearch, fetchEmployees]);

  const getInitials = (name: string) =>
    name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();

  const isAtMax = maxEmployees !== undefined && value.length >= maxEmployees;

  return (
    <Box>
      <Autocomplete
        multiple
        size="small"
        options={options}
        loading={loading}
        value={value}
        onChange={(_, newValue) => onChange(newValue)}
        inputValue={inputValue}
        onInputChange={(_, newInput) => setInputValue(newInput)}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, val) => option.id === val.id}
        filterOptions={(x) => x}
        getOptionDisabled={() => isAtMax}
        renderTags={(tagValue, getTagProps) =>
          tagValue.map((option, index) => {
            const { key, ...tagProps } = getTagProps({ index });
            return (
              <Chip
                key={key}
                size="small"
                avatar={
                  <Avatar src={option.avatarUrl ?? undefined} sx={{ width: 20, height: 20, fontSize: '0.6rem' }}>
                    {!option.avatarUrl && getInitials(option.name)}
                  </Avatar>
                }
                label={option.name}
                {...tagProps}
                sx={{ maxWidth: 160 }}
              />
            );
          })
        }
        renderOption={(props, option) => {
          const listProps = { ...props } as any;
          delete listProps.key;
          return (
            <Box component="li" key={String(option.id)} {...listProps} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
              <Avatar
                src={option.avatarUrl ?? undefined}
                sx={{
                  width: 32,
                  height: 32,
                  fontSize: '0.75rem',
                  flexShrink: 0,
                }}
              >
                {!option.avatarUrl && getInitials(option.name)}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" noWrap>
                  {option.name}
                </Typography>
                {option.email && (
                  <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
                    {option.email}
                  </Typography>
                )}
              </Box>
            </Box>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={isAtMax ? '' : t('organigrama.form.fields.employees.add')}
            slotProps={{
              input: {
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading && <CircularProgress size={14} />}
                    {params.InputProps.endAdornment}
                  </>
                ),
              },
            }}
          />
        )}
      />

      {maxEmployees !== undefined && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            mt: 0.5,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: isAtMax ? 'warning.main' : 'text.disabled',
              fontWeight: isAtMax ? 600 : 400,
              transition: 'color 0.2s',
            }}
          >
            {value.length}/{maxEmployees}{' '}
            {t('organigrama.form.fields.employees.label').toLowerCase()}
            {isAtMax && ` · ${t('organigrama.form.fields.employees.maxReached')}`}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
