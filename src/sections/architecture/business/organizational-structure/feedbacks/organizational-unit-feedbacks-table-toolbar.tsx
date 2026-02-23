import { useCallback } from 'react';

import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  filters: { name: string };
  onFilters: (name: string, value: string) => void;
};

export function OrganizationalUnitFeedbacksTableToolbar({ filters, onFilters }: Props) {
  const { t } = useTranslate('common');

  const handleFilterName = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFilters('name', event.target.value);
    },
    [onFilters]
  );

  return (
    <Stack
      spacing={2}
      alignItems={{ xs: 'flex-end', md: 'center' }}
      direction={{ xs: 'column', md: 'row' }}
      sx={{ p: 2.5 }}
    >
      <Stack direction="row" alignItems="center" spacing={2} sx={{ flexGrow: 1, width: 1 }}>
        <TextField
          fullWidth
          value={filters.name}
          onChange={handleFilterName}
          placeholder={t('search')}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />
      </Stack>
    </Stack>
  );
}
