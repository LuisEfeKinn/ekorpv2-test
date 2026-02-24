import type { IRewardsRuleTableFilters } from 'src/types/rewards';

import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import { GetRewardRuleTypePaginationService } from 'src/services/rewards/ruleType.service';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  filters: IRewardsRuleTableFilters;
  onFilters: (name: string, value: string) => void;
  onResetFilters?: () => void;
};

export function RewardRulesTableToolbar({
  filters,
  onFilters,
  onResetFilters,
}: Props) {
  const { t } = useTranslate('rewards');

  const [typeRuleOptions, setTypeRuleOptions] = useState<any[]>([]);
  const [loadingTypeRules, setLoadingTypeRules] = useState(false);

  const hasActiveFilters = !!filters.typeRuleId;

  const handleFilterName = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFilters('name', event.target.value);
    },
    [onFilters]
  );

  const loadTypeRules = useCallback(async (searchTerm: string = '') => {
    try {
      setLoadingTypeRules(true);
      const response = await GetRewardRuleTypePaginationService({
        page: 1,
        perPage: 20,
        search: searchTerm,
      });
      const typeRules = response?.data?.data || [];
      setTypeRuleOptions(typeRules);
    } catch (error) {
      console.error('Error loading type rules:', error);
      setTypeRuleOptions([]);
    } finally {
      setLoadingTypeRules(false);
    }
  }, []);

  const handleTypeRuleChange = useCallback(
    (_event: any, newValue: any) => {
      onFilters('typeRuleId', newValue?.id || '');
    },
    [onFilters]
  );

  const handleTypeRuleInputChange = useCallback(
    (_event: any, newInputValue: string) => {
      loadTypeRules(newInputValue);
    },
    [loadTypeRules]
  );

  const selectedTypeRule = useMemo(
    () => typeRuleOptions.find((tr) => tr.id === filters.typeRuleId) || null,
    [filters.typeRuleId, typeRuleOptions]
  );

  return (
    <Box sx={{ p: 2.5 }}>
      <Box
        display="grid"
        gap={2}
        gridTemplateColumns={{
          xs: '1fr',
          sm: hasActiveFilters ? '1fr auto' : '1fr',
          md: hasActiveFilters ? '1fr 300px auto' : '1fr 300px',
        }}
      >
        <TextField
          fullWidth
          value={filters.name}
          onChange={handleFilterName}
          placeholder={t('reward-rules.table.search')}
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
          options={typeRuleOptions}
          loading={loadingTypeRules}
          getOptionLabel={(option) => option.name || ''}
          value={selectedTypeRule}
          onChange={handleTypeRuleChange}
          onInputChange={handleTypeRuleInputChange}
          onOpen={() => loadTypeRules()}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('reward-rules.table.filters.typeRuleId')}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loadingTypeRules ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />

        {hasActiveFilters && onResetFilters && (
          <Button
            color="error"
            variant="outlined"
            onClick={onResetFilters}
            startIcon={<Iconify icon="solar:restart-bold" />}
            sx={{ whiteSpace: 'nowrap' }}
          >
            {t('reward-rules.table.toolbar.resetFilters')}
          </Button>
        )}
      </Box>
    </Box>
  );
}