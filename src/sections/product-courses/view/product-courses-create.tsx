'use client';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ProductCoursesCreateEditForm } from '../product-courses-create-edit-form';

// ----------------------------------------------------------------------

export function ProductCoursesCreateView() {
  const { t } = useTranslate('learning');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('product-courses.actions.create')}
        links={[
          { name: t('product-courses.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('product-courses.breadcrumbs.productCourses'), href: paths.dashboard.learning.productCourses },
          { name: t('product-courses.breadcrumbs.create') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ProductCoursesCreateEditForm />
    </DashboardContent>
  );
}