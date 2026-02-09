import type { ICourseTableFilters, IIntegrationInstance } from 'src/types/settings';

import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  filters: ICourseTableFilters;
  onFilters: (name: string, value: string | boolean) => void;
  integrations: IIntegrationInstance[];
  loadingIntegrations: boolean;
  onSearchIntegrations: (value: string) => void;
};

export function CoursesTableToolbar({
  filters,
  onFilters,
  integrations,
  loadingIntegrations,
  onSearchIntegrations,
}: Props) {
  const { t } = useTranslate('settings');

  const handleFilterSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFilters('search', event.target.value);
    },
    [onFilters]
  );

  const handleFilterInactive = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFilters('includeInactive', event.target.checked);
    },
    [onFilters]
  );

  const handleFilterIntegration = useCallback(
    (_: any, newValue: IIntegrationInstance | null) => {
      onFilters('integrationId', newValue?.id || '');
    },
    [onFilters]
  );

  const selectedIntegration =
    integrations.find((integration) => integration.id === filters.integrationId) || null;

  return (
    <Stack
      spacing={2}
      alignItems={{ xs: 'flex-end', md: 'center' }}
      direction={{ xs: 'column', md: 'row' }}
      sx={{ p: 2.5 }}
    >
      <Stack direction="row" alignItems="center" spacing={2} flexGrow={1} sx={{ width: 1 }}>
        <TextField
          fullWidth
          value={filters.search}
          onChange={handleFilterSearch}
          placeholder={t('courses.table.toolbar.search')}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />

        <Autocomplete
          fullWidth
          options={integrations}
          value={selectedIntegration}
          onChange={handleFilterIntegration}
          onInputChange={(_, newInputValue) => {
            onSearchIntegrations(newInputValue);
          }}
          getOptionLabel={(option) => option.instanceName}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          loading={loadingIntegrations}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('courses.table.toolbar.selectIntegration')}
              placeholder={t('courses.table.toolbar.searchIntegration')}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loadingIntegrations ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          sx={{ minWidth: 300 }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch checked={filters.includeInactive} onChange={handleFilterInactive} />
            }
            label={
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('courses.table.toolbar.includeInactive')}
              </Typography>
            }
          />
        </Box>
      </Stack>
    </Stack>
  );
}
