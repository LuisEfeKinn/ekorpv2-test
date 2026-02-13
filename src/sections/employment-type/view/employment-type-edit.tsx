'use client';

import type { IEmploymentType } from 'src/types/employees';

import { useState, useEffect } from 'react';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetTypeEmploymentByIdService } from 'src/services/employees/employment-type.service';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { EmploymentTypeCreateEditForm } from '../employment-type-create-edit-form';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function EmploymentTypeEditView({ id }: Props) {
  const { t } = useTranslate('employees');
  const [currentEmploymentType, setCurrentEmploymentType] = useState<IEmploymentType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmploymentType = async () => {
      try {
        setLoading(true);
        const response = await GetTypeEmploymentByIdService(id);
        
        if (response.data.statusCode === 200) {
          setCurrentEmploymentType(response.data.data);
        } else {
          setError(t('employment-type.messages.notFound'));
        }
      } catch (err) {
        console.error('Error fetching employment type:', err);
        setError(t('employment-type.messages.loadError'));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEmploymentType();
    }
  }, [id, t]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('employment-type.actions.edit')}
          links={[
            { name: t('employment-type.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('employment-type.breadcrumbs.employmentTypes'), href: paths.dashboard.employees.typeEmployment },
            { name: t('employment-type.breadcrumbs.edit') },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <div>{t('employment-type.messages.error')}: {error}</div>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('employment-type.actions.edit')}
        links={[
          { name: t('employment-type.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('employment-type.breadcrumbs.employmentTypes'), href: paths.dashboard.employees.typeEmployment },
          { name: currentEmploymentType?.name || t('employment-type.breadcrumbs.edit') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <EmploymentTypeCreateEditForm currentEmploymentType={currentEmploymentType || undefined} />
    </DashboardContent>
  );
}