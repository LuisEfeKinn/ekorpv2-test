'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ToolsTableCreateEditForm } from '../tools-table-create-edit-form';

export function ToolsTableCreateView() {
  const { t } = useTranslate('architecture');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('tools.table.breadcrumbs.create')}
        links={[
          { name: t('tools.table.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('tools.table.title'), href: paths.dashboard.architecture.toolsTable },
          { name: t('tools.table.breadcrumbs.create') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ToolsTableCreateEditForm />
    </DashboardContent>
  );
}
