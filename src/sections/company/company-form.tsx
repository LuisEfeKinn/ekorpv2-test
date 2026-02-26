import type { ICoin, ICompany, ICompanyFormData } from 'src/types/organization';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';
import { GetSelectCoinService, SaveOrUpdateCompanyService } from 'src/services/organization/company.service';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { LoadingScreen } from 'src/components/loading-screen';

// ----------------------------------------------------------------------

export type CompanyFormSchemaType = {
  name: string;
  coinId: ICoin | null;
  oficialName: string;
  taxId: string;
  webSite: string;
  registerDate: Date | string;
  primaryAddress: string;
  secondaryAddress: string;
  latitude: string;
  longitude: string;
};

// ----------------------------------------------------------------------

type Props = {
  currentCompany?: ICompany | null;
  onSuccess?: () => void;
};

export function CompanyForm({ currentCompany, onSuccess }: Props) {
  const { t } = useTranslate('organization');

  const [coinsOptions, setCoinsOptions] = useState<ICoin[]>([]);
  const [loadingCoins, setLoadingCoins] = useState(true);

  const CompanyFormSchema = z.object({
    name: z.string().min(1, { message: t('company.form.fields.name.required') }),
    coinId: z.any().refine((value) => value && value.id, {
      message: t('company.form.fields.coinId.required')
    }),
    oficialName: z.string().min(1, { message: t('company.form.fields.oficialName.required') }),
    taxId: z.string().min(1, { message: t('company.form.fields.taxId.required') }),
    webSite: z.string().url({ message: 'Invalid website URL' }).min(1, { message: t('company.form.fields.webSite.required') }),
    registerDate: z.coerce.date({ message: t('company.form.fields.registerDate.required') }),
    primaryAddress: z.string().min(1, { message: t('company.form.fields.primaryAddress.required') }),
    secondaryAddress: z.string().optional(),
    latitude: z.string().min(1, { message: t('company.form.fields.latitude.required') }),
    longitude: z.string().min(1, { message: t('company.form.fields.longitude.required') }),
  });

  const defaultValues: CompanyFormSchemaType = useMemo(() => ({
    name: '',
    coinId: null,
    oficialName: '',
    taxId: '',
    webSite: '',
    registerDate: new Date(),
    primaryAddress: '',
    secondaryAddress: '',
    latitude: '',
    longitude: '',
  }), []);

  // Transform current company data to form values
  const getFormValues = useCallback((): CompanyFormSchemaType => {
    if (!currentCompany) return defaultValues;

    // Find the coin object from the options to set the correct value for autocomplete
    const coinOption = coinsOptions.find(coin => coin.id === currentCompany.coinId);

    return {
      name: currentCompany.name,
      coinId: coinOption || null,
      oficialName: currentCompany.oficialName,
      taxId: currentCompany.taxId,
      webSite: currentCompany.webSite,
      registerDate: new Date(currentCompany.registerDate),
      primaryAddress: currentCompany.primaryAddress,
      secondaryAddress: currentCompany.secondaryAddress || '',
      latitude: currentCompany.latitude,
      longitude: currentCompany.longitude,
    };
  }, [currentCompany, coinsOptions, defaultValues]);

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(CompanyFormSchema),
    defaultValues,
    values: getFormValues(),
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  // Load coins options
  const loadCoinsOptions = useCallback(async () => {
    try {
      setLoadingCoins(true);
      const response = await GetSelectCoinService();

      if (response.data && response.data.data) {
        setCoinsOptions(response.data.data);
      }
    } catch (error) {
      console.error('Error loading coins options:', error);
      toast.error('Error loading currency options');
    } finally {
      setLoadingCoins(false);
    }
  }, []);

  useEffect(() => {
    loadCoinsOptions();
  }, [loadCoinsOptions]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const formData: ICompanyFormData = {
        ...data,
        coinId: data.coinId ? parseInt(data.coinId.id, 10) : 0,
        secondaryAddress: data.secondaryAddress || '',
        registerDate: data.registerDate instanceof Date
          ? data.registerDate.toISOString()
          : data.registerDate,
      };

      const response = await SaveOrUpdateCompanyService(
        formData,
        currentCompany?.id
      );

      if (response.data.statusCode === 200 || response.data.statusCode === 201) {
        toast.success(t('company.messages.updateSuccess'));
        onSuccess?.();
      }
    } catch (error) {
      console.error('Error saving company:', error);
      toast.error(t('company.messages.saveError'));
    }
  });

  if (loadingCoins) {
    return <LoadingScreen />;
  }

  const renderCompanyDetails = () => (
    <Card>
      <Stack spacing={3} sx={{ p: 3 }}>
        <Typography variant="h6">{t('company.form.sections.details')}</Typography>

        <Box sx={{ display: 'grid', gap: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Field.Text
              name="name"
              label={t('company.form.fields.name.label')}
              placeholder={t('company.form.fields.name.placeholder')}
              helperText={t('company.form.fields.name.helperText')}
            />

            <Field.Text
              name="oficialName"
              label={t('company.form.fields.oficialName.label')}
              placeholder={t('company.form.fields.oficialName.placeholder')}
              helperText={t('company.form.fields.oficialName.helperText')}
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Field.Text
              name="taxId"
              label={t('company.form.fields.taxId.label')}
              placeholder={t('company.form.fields.taxId.placeholder')}
              helperText={t('company.form.fields.taxId.helperText')}
            />

            <Field.Autocomplete
              name="coinId"
              label={t('company.form.fields.coinId.label')}
              placeholder={t('company.form.fields.coinId.placeholder')}
              helperText={t('company.form.fields.coinId.helperText')}
              options={coinsOptions}
              getOptionLabel={(option) => `${option.name} (${option.code})`}
              isOptionEqualToValue={(option, value) => option.id === value?.id}
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Field.Text
              name="webSite"
              label={t('company.form.fields.webSite.label')}
              placeholder={t('company.form.fields.webSite.placeholder')}
              helperText={t('company.form.fields.webSite.helperText')}
            />

            <Field.DatePicker
              name="registerDate"
              label={t('company.form.fields.registerDate.label')}
              slotProps={{
                textField: {
                  helperText: t('company.form.fields.registerDate.helperText'),
                },
              }}
            />
          </Box>
        </Box>
      </Stack>
    </Card>
  );

  const renderAddressInformation = () => (
    <Card>
      <Stack spacing={3} sx={{ p: 3 }}>
        <Typography variant="h6">{t('company.form.sections.address')}</Typography>

        <Box sx={{ display: 'grid', gap: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Field.Text
              name="primaryAddress"
              label={t('company.form.fields.primaryAddress.label')}
              placeholder={t('company.form.fields.primaryAddress.placeholder')}
              helperText={t('company.form.fields.primaryAddress.helperText')}
            />

            <Field.Text
              name="secondaryAddress"
              label={t('company.form.fields.secondaryAddress.label')}
              placeholder={t('company.form.fields.secondaryAddress.placeholder')}
              helperText={t('company.form.fields.secondaryAddress.helperText')}
            />
          </Box>
        </Box>
      </Stack>
    </Card>
  );

  const renderLocationInformation = () => (
    <Card>
      <Stack spacing={3} sx={{ p: 3 }}>
        <Typography variant="h6">{t('company.form.sections.location')}</Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <Field.Text
            name="latitude"
            label={t('company.form.fields.latitude.label')}
            placeholder={t('company.form.fields.latitude.placeholder')}
            helperText={t('company.form.fields.latitude.helperText')}
            type="number"
            slotProps={{
              htmlInput: {
                step: 'any',
              },
            }}
          />

          <Field.Text
            name="longitude"
            label={t('company.form.fields.longitude.label')}
            placeholder={t('company.form.fields.longitude.placeholder')}
            helperText={t('company.form.fields.longitude.helperText')}
            type="number"
            slotProps={{
              htmlInput: {
                step: 'any',
              },
            }}
          />
        </Box>
      </Stack>
    </Card>
  );

  const renderActions = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: 'flex-start' }}>
      <Button
        size="medium"
        variant="soft"
        color="inherit"
        onClick={() => reset()}
        disabled={isSubmitting}
      >
        {t('company.actions.cancel')}
      </Button>

      <Button
        size="medium"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator={t('company.actions.saving')}
      >
        {t('company.actions.update')}
      </Button>
    </Box>
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={3}>
        {renderCompanyDetails()}
        {renderAddressInformation()}
        {renderLocationInformation()}
        {renderActions()}
      </Stack>
    </Form>
  );
}
