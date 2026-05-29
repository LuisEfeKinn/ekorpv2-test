import { useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  filters: any;
  onFilters: (name: string, value: string) => void;
};

export function RiskTypesTableToolbar({ filters, onFilters }: Props) {
  const { t, currentLang } = useTranslate('catalogs');
  const tf = useCallback((key: string, en: string, es?: string) => {
    const v = t(key);
    if (v && v !== key) return v;
    return currentLang?.value === 'es' ? (es ?? en) : en;
  }, [t, currentLang?.value]);
  
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
      <Stack direction="row" alignItems="center" spacing={2} flexGrow={1} sx={{ width: 1 }}>
        <TextField
          fullWidth
          value={filters.name}
          onChange={handleFilterName}
          placeholder={t('risk-types.toolbar.search')}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />
        <Button
          component={RouterLink}
          href={paths.dashboard.architecture.catalogs.riskTypesMap}
          variant="contained"
          startIcon={<Iconify icon="eva:search-fill" />}
        >
          {tf('risk-types.actions.viewMap', 'View Risk Map', 'Ver mapa de riesgos')}
        </Button>
      </Stack>
    </Stack>
  );
}
