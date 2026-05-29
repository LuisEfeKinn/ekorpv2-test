import type { IRewardsRuleTableFilters } from 'src/types/rewards';

import { useState, useEffect, useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { useTranslate } from 'src/locales';
import { GetRewardRuleTypePaginationService } from 'src/services/rewards/ruleType.service';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

type Props = {
  filters: IRewardsRuleTableFilters;
  onFilters: (name: string, value: string) => void;
  onReset?: () => void;
  totalResults: number;
  sx?: object;
};

export function RewardRulesTableFiltersResult({ filters, onFilters, onReset, totalResults, sx }: Props) {
  const { t } = useTranslate('rewards');

  const [typeRuleName, setTypeRuleName] = useState<string>('');

  useEffect(() => {
    const loadTypeRuleName = async () => {
      try {
        if (filters.typeRuleId) {
          const response = await GetRewardRuleTypePaginationService({
            page: 1,
            perPage: 20,
            search: '',
          });
          const typeRules = response?.data?.data || [];
          const typeRule = typeRules.find((tr: any) => tr.id === filters.typeRuleId);
          setTypeRuleName(typeRule?.name || '');
        }
      } catch (error) {
        console.error('Error loading type rule name:', error);
      }
    };

    loadTypeRuleName();
  }, [filters.typeRuleId]);
  
  const handleRemoveKeyword = useCallback(() => {
    onFilters('name', '');
  }, [onFilters]);

  const handleRemoveTypeRule = useCallback(() => {
    onFilters('typeRuleId', '');
  }, [onFilters]);

  return (
    <FiltersResult totalResults={totalResults} onReset={onReset} sx={sx}>
      <FiltersBlock label={`${t('reward-rules.table.filters.keyword')}:`} isShow={!!filters.name}>
        <Chip {...chipProps} label={filters.name} onDelete={handleRemoveKeyword} />
      </FiltersBlock>

      <FiltersBlock label={`${t('reward-rules.table.filters.typeRuleId')}:`} isShow={!!filters.typeRuleId}>
        <Chip {...chipProps} label={typeRuleName} onDelete={handleRemoveTypeRule} />
      </FiltersBlock>
    </FiltersResult>
  );
}