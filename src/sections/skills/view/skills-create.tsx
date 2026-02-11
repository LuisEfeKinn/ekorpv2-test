'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { SkillsCreateEditForm } from '../skills-create-edit-form';

// ----------------------------------------------------------------------

export function SkillsCreateView() {
  const { t } = useTranslate('employees');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('skills.actions.create')}
        links={[
          { name: t('skills.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('skills.breadcrumbs.skills'), href: paths.dashboard.employees.skills },
          { name: t('skills.breadcrumbs.create') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <SkillsCreateEditForm />
    </DashboardContent>
  );
}