'use client';

import type { IUserProfile } from 'src/types/user-profile';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetUserProfileService } from 'src/services/auth/user.service';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { UserProfileEditForm } from '../user-profile-edit-form';

// ----------------------------------------------------------------------

export function UserProfileView() {
  const { t } = useTranslate('user-profile');
  const [currentProfile, setCurrentProfile] = useState<IUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await GetUserProfileService();

        if (response.data?.statusCode === 200) {
          setCurrentProfile(response.data.data);
        } else {
          setError(t('messages.error.notFound'));
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError(t('messages.error.loading'));
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [t]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error || !currentProfile) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('title')}
          links={[
            { name: t('breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('breadcrumbs.profile') },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <Box sx={{ py: 5, textAlign: 'center', color: 'text.secondary' }}>
          {error || t('messages.error.notFound')}
        </Box>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('title')}
        links={[
          { name: t('breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('breadcrumbs.profile') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <UserProfileEditForm currentProfile={currentProfile} />
    </DashboardContent>
  );
}
