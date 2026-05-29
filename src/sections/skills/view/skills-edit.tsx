'use client';

import type { ISkills } from 'src/types/employees';

import { useState, useEffect } from 'react';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetSkillsByIdService } from 'src/services/employees/skills.service';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { SkillsCreateEditForm } from '../skills-create-edit-form';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function SkillsEditView({ id }: Props) {
  const { t } = useTranslate('employees');
  const [currentSkills, setCurrentSkills] = useState<ISkills | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        setLoading(true);
        const response = await GetSkillsByIdService(id);

        if (response.data.statusCode === 200) {
          setCurrentSkills(response.data.data);
        } else {
          setError(t('skills.messages.notFound'));
        }
      } catch (err) {
        console.error('Error fetching skills:', err);
        setError(t('skills.messages.loadError'));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSkills();
    }
  }, [id, t]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('skills.actions.edit')}
          links={[
            { name: t('skills.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('skills.breadcrumbs.skills'), href: paths.dashboard.employees.skills },
            { name: t('skills.breadcrumbs.edit') },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <div>{t('skills.messages.error')}: {error}</div>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('employment-type.actions.edit')}
        links={[
          { name: t('skills.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('skills.breadcrumbs.skills'), href: paths.dashboard.employees.skills },
          { name: currentSkills?.name || t('skills.breadcrumbs.edit') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <SkillsCreateEditForm currentSkills={currentSkills || undefined} />
    </DashboardContent>
  );
}