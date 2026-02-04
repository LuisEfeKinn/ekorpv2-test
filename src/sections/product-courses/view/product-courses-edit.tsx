'use client';

import type { IProductCourse } from 'src/types/learning';

import { useState, useEffect } from 'react';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetCoursesByIdService } from 'src/services/learning/courses.service';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ProductCoursesCreateEditForm } from '../product-courses-create-edit-form';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function ProductCoursesEditView({ id }: Props) {
  const { t } = useTranslate('learning');
  const [currentProductCourses, setCurrentProductCourses] = useState<IProductCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProductCourses = async () => {
      try {
        setLoading(true);
        const response = await GetCoursesByIdService(id);

        if (response.data.statusCode === 200) {
          setCurrentProductCourses(response.data.data);
        } else {
          setError(t('product-courses.messages.notFound'));
        }
      } catch (err) {
        console.error('Error fetching product course:', err);
        setError(t('product-courses.messages.loadError'));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProductCourses();
    }
  }, [id, t]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('product-courses.actions.edit')}
          links={[
            { name: t('product-courses.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('product-courses.breadcrumbs.product-courses'), href: paths.dashboard.learning.productCourses },
            { name: t('product-courses.breadcrumbs.edit') },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <div>{t('product-courses.messages.error')}: {error}</div>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('product-courses.actions.edit')}
        links={[
          { name: t('product-courses.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('product-courses.breadcrumbs.product-courses'), href: paths.dashboard.learning.productCourses },
          { name: currentProductCourses?.name || t('product-courses.breadcrumbs.edit') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ProductCoursesCreateEditForm currentProductCourse={currentProductCourses || undefined} />
    </DashboardContent>
  );
}