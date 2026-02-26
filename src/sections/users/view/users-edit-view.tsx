'use client';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';
import { GetUserByIdService } from 'src/services/security/users.service';

import { Iconify } from 'src/components/iconify';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { UsersGeneral } from '../users-general';
import { UsersSecurity } from '../users-security';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function UsersEditView({ id }: Props) {
  const { t } = useTranslate('security');
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState('general');

  const TABS = [
    { value: 'general', label: t('users.tabs.general'), icon: 'solar:user-id-bold' },
    { value: 'security', label: t('users.tabs.security'), icon: 'ic:round-vpn-key' },
  ];

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await GetUserByIdService(id);
        
        if (response.data.statusCode === 200) {
          setCurrentUser(response.data.data);
        } else {
          setError(t('users.messages.error.notFound'));
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError(t('users.messages.error.loading'));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUser();
    }
  }, [id, t]);

  const handleChangeTab = useCallback((event: React.SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue);
  }, []);

  const renderTab = () => {
    if (currentTab === 'general') {
      return <UsersGeneral currentUser={currentUser} />;
    }
    if (currentTab === 'security') {
      return <UsersSecurity currentUser={currentUser} />;
    }
    return null;
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('users.actions.edit')}
          links={[
            { name: t('users.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('users.breadcrumbs.users'), href: paths.dashboard.security.users },
            { name: t('users.actions.edit') },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <Typography variant="h6" color="error">
            {error}
          </Typography>
        </Box>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('users.actions.edit')}
        links={[
          { name: t('users.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('users.breadcrumbs.users'), href: paths.dashboard.security.users },
          { name: currentUser?.names || t('users.actions.edit') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Tabs value={currentTab} onChange={handleChangeTab} sx={{ mb: { xs: 3, md: 5 } }}>
        {TABS.map((tab) => (
          <Tab
            key={tab.value}
            iconPosition="start"
            value={tab.value}
            label={tab.label}
            icon={<Iconify icon={tab.icon as any} width={24} />}
          />
        ))}
      </Tabs>

      {renderTab()}
    </DashboardContent>
  );
}