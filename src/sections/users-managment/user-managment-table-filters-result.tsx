import type { IUserManagementTableFilters } from 'src/types/employees';

import { useState, useEffect, useCallback } from 'react';

import Chip, { chipClasses } from '@mui/material/Chip';

import { useTranslate } from 'src/locales';
import { GetSkillsPaginationService } from 'src/services/employees/skills.service';
import { GetPositionPaginationService } from 'src/services/organization/position.service';
import { GetRegionsService, GetCountriesService } from 'src/services/locations/locations.service';
import {
  GetOrganizationalUnitPaginationService,
  normalizeOrganizationalUnitListResponse,
} from 'src/services/organization/organizationalUnit.service';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

type Props = {
  filters: IUserManagementTableFilters;
  onFilters: (name: string, value: string) => void;
  onReset?: () => void;
  totalResults: number;
  sx?: object;
};

export function UserManagmentTableFiltersResult({ filters, onFilters, onReset, totalResults, sx }: Props) {
  const { t } = useTranslate('employees');
  
  // Estados para guardar los nombres de las opciones seleccionadas
  const [positionName, setPositionName] = useState<string>('');
  const [skillName, setSkillName] = useState<string>('');
  const [organizationalUnitName, setOrganizationalUnitName] = useState<string>('');
  const [countryName, setCountryName] = useState<string>('');
  const [regionName, setRegionName] = useState<string>('');

  // Cargar nombres cuando cambian los IDs de los filtros
  useEffect(() => {
    const loadFilterNames = async () => {
      try {
        if (filters.positionId) {
          const response = await GetPositionPaginationService({ page: 1, perPage: 20 });
          const position = response.data.data.find((p) => p.id === filters.positionId);
          setPositionName(position?.name || '');
        } else {
          setPositionName('');
        }

        if (filters.skillId) {
          const response = await GetSkillsPaginationService({ page: 1, perPage: 20 });
          const skill = response.data.data.find((s) => s.id === filters.skillId);
          setSkillName(skill?.name || '');
        } else {
          setSkillName('');
        }

        if (filters.organizationalUnitId) {
          const response = await GetOrganizationalUnitPaginationService({ page: 1, perPage: 20 });
          const list = normalizeOrganizationalUnitListResponse(response.data as any);
          const unit = list.find((u) => String(u.id) === String(filters.organizationalUnitId));
          setOrganizationalUnitName(unit?.name || '');
        } else {
          setOrganizationalUnitName('');
        }

        if (filters.countryId) {
          const response = await GetCountriesService();
          const country = response.data.data.find((c) => c.id === filters.countryId);
          setCountryName(country?.name || '');
        } else {
          setCountryName('');
        }

        if (filters.regionId) {
          const response = await GetRegionsService();
          const region = response.data.data.find((r) => r.id === filters.regionId);
          setRegionName(region?.name || '');
        } else {
          setRegionName('');
        }
      } catch (error) {
        console.error('Error loading filter names:', error);
      }
    };

    loadFilterNames();
  }, [filters.positionId, filters.skillId, filters.organizationalUnitId, filters.countryId, filters.regionId]);

  const handleRemoveKeyword = useCallback(() => {
    onFilters('name', '');
  }, [onFilters]);

  const handleRemoveStatus = useCallback(() => {
    onFilters('status', 'all');
  }, [onFilters]);

  const handleRemovePosition = useCallback(() => {
    onFilters('positionId', '');
  }, [onFilters]);

  const handleRemoveSkill = useCallback(() => {
    onFilters('skillId', '');
  }, [onFilters]);

  const handleRemoveOrganizationalUnit = useCallback(() => {
    onFilters('organizationalUnitId', '');
  }, [onFilters]);

  const handleRemoveCountry = useCallback(() => {
    onFilters('countryId', '');
  }, [onFilters]);

  const handleRemoveRegion = useCallback(() => {
    onFilters('regionId', '');
  }, [onFilters]);

  return (
    <FiltersResult totalResults={totalResults} onReset={onReset} sx={sx}>
      <FiltersBlock label={`${t('user-management.table.filters.status')}:`} isShow={filters.status !== 'all'}>
        <Chip
          {...chipProps}
          label={filters.status}
          onDelete={handleRemoveStatus}
          sx={{ [`&.${chipClasses.root}`]: { textTransform: 'capitalize' } }}
        />
      </FiltersBlock>

      <FiltersBlock label={`${t('user-management.table.filters.keyword')}:`} isShow={!!filters.name}>
        <Chip {...chipProps} label={filters.name} onDelete={handleRemoveKeyword} />
      </FiltersBlock>

      <FiltersBlock label={`${t('user-management.table.filters.position')}:`} isShow={!!filters.positionId}>
        <Chip {...chipProps} label={positionName || filters.positionId} onDelete={handleRemovePosition} />
      </FiltersBlock>

      <FiltersBlock label={`${t('user-management.table.filters.skill')}:`} isShow={!!filters.skillId}>
        <Chip {...chipProps} label={skillName || filters.skillId} onDelete={handleRemoveSkill} />
      </FiltersBlock>

      <FiltersBlock label={`${t('user-management.table.filters.organizationalUnit')}:`} isShow={!!filters.organizationalUnitId}>
        <Chip {...chipProps} label={organizationalUnitName || filters.organizationalUnitId} onDelete={handleRemoveOrganizationalUnit} />
      </FiltersBlock>

      <FiltersBlock label={`${t('user-management.table.filters.country')}:`} isShow={!!filters.countryId}>
        <Chip {...chipProps} label={countryName || filters.countryId} onDelete={handleRemoveCountry} />
      </FiltersBlock>

      <FiltersBlock label={`${t('user-management.table.filters.region')}:`} isShow={!!filters.regionId}>
        <Chip {...chipProps} label={regionName || filters.regionId} onDelete={handleRemoveRegion} />
      </FiltersBlock>
    </FiltersResult>
  );
}
