import type { IUserManagementTableFilters } from 'src/types/employees';

import { useState, useEffect, useCallback } from 'react';

import Chip, { chipClasses } from '@mui/material/Chip';

import { useTranslate } from 'src/locales';
import { GetJobsKmService } from 'src/services/organization/job-km.service';
import { GetSkillsPaginationService } from 'src/services/employees/skills.service';
import { GetRegionsService, GetCountriesService } from 'src/services/locations/locations.service';
import {
  GetOrganizationUnitPaginationService,
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
          const response = await GetJobsKmService({ page: 1, perPage: 20 });
          const position = response.data.data.find((p) => String(p.id) === String(filters.positionId));
          setPositionName(position?.name || '');
        } else {
          setPositionName('');
        }

        if (filters.competencyId) {
          const response = await GetSkillsPaginationService({ page: 1, perPage: 20 });
          const skill = response.data.data.data.find((s) => s.id === filters.competencyId);
          setSkillName(skill?.name || '');
        } else {
          setSkillName('');
        }

        if (filters.organizationalUnitId) {
          const response = await GetOrganizationUnitPaginationService({ page: 1, perPage: 20 });
          const list = response.data.data || [];
          const unit = list.find((u) => String(u.id) === String(filters.organizationalUnitId));
          setOrganizationalUnitName(unit?.name || '');
        } else {
          setOrganizationalUnitName('');
        }

        if (filters.countryId) {
          const response = await GetCountriesService({ id: filters.countryId });
          const country =
            response.data.data?.find((c) => String(c.id) === String(filters.countryId)) ||
            response.data.data?.[0];
          setCountryName(country?.name || '');
        } else {
          setCountryName('');
        }

        if (filters.regionId) {
          const response = await GetRegionsService({ id: filters.regionId });
          const region =
            response.data.data?.find((r) => String(r.id) === String(filters.regionId)) ||
            response.data.data?.[0];
          setRegionName(region?.name || '');
        } else {
          setRegionName('');
        }
      } catch (error) {
        console.error('Error loading filter names:', error);
      }
    };

    loadFilterNames();
  }, [filters.positionId, filters.competencyId, filters.organizationalUnitId, filters.countryId, filters.regionId]);

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
    onFilters('competencyId', '');
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

      <FiltersBlock label={`${t('user-management.table.filters.skill')}:`} isShow={!!filters.competencyId}>
        <Chip {...chipProps} label={skillName || filters.competencyId} onDelete={handleRemoveSkill} />
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
