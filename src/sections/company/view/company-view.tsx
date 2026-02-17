'use client';

import type { ICompany } from 'src/types/organization';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Container from '@mui/material/Container';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { GetCompanyService } from 'src/services/organization/company.service';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CompanyForm } from '../company-form';

// ----------------------------------------------------------------------

export function CompanyView() {
  const { t } = useTranslate('organization');

  const [company, setCompany] = useState<ICompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCompanyData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await GetCompanyService();
      
      if (response.data && response.data.data) {
        setCompany(response.data.data);
      } else {
        setError(t('company.messages.loadError'));
      }
    } catch (err) {
      console.error('Error loading company data:', err);
      setError(t('company.messages.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Load company data on component mount
  useEffect(() => {
    loadCompanyData();
  }, [loadCompanyData]);

  const handleSuccess = useCallback(() => {
    // Reload company data after successful update
    loadCompanyData();
  }, [loadCompanyData]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <>
        <CustomBreadcrumbs
          heading={t('company.title')}
          links={[
            { name: t('company.breadcrumbs.dashboard'), href: paths.dashboard.root },
            { name: t('company.breadcrumbs.company') },
          ]}
          sx={{ mb: 3 }}
        />
        <Card sx={{ p: 3 }}>
          <Box sx={{ textAlign: 'center', py: 5 }}>
            {error}
          </Box>
        </Card>
      </>
    );
  }

  return (
    <Container maxWidth="xl">
      <CustomBreadcrumbs
        heading={t('company.title')}
        links={[
          { name: t('company.breadcrumbs.dashboard'), href: paths.dashboard.root },
          { name: t('company.breadcrumbs.company') },
        ]}
        sx={{ mb: 3 }}
      />

      <Card sx={{ p: 3 }}>
        <CompanyForm 
          currentCompany={company} 
          onSuccess={handleSuccess}
        />
      </Card>
    </Container>
  );
}