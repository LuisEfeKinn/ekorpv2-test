import type { IOrganization } from 'src/types/organization';

import * as z from 'zod';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { SaveOrUpdateOrganizationalUnitService } from 'src/services/organization/organizationalUnit.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export type OrganizationCreateSchemaType = {
  name: string;
  code?: string;
  description?: string;
  color?: string;
};

// ----------------------------------------------------------------------

type Props = {
  currentOrganization?: IOrganization;
};

export function OrganizationCreateEditForm({ currentOrganization }: Props) {
  const router = useRouter();
  const { t } = useTranslate('organization');
  const colorInputRef = useRef<HTMLInputElement>(null);

  const OrganizationCreateSchema = z.object({
    name: z.string().min(1, { message: t('organization.form.name.required') }),
    code: z.string().optional(),
    description: z.string().optional(),
    color: z.string().optional(),
  });

  const defaultValues: OrganizationCreateSchemaType = {
    name: '',
    code: '',
    description: '',
    color: '#6177d6ff',
  };

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(OrganizationCreateSchema),
    defaultValues,
    values: currentOrganization,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const response = await SaveOrUpdateOrganizationalUnitService(
        data,
        currentOrganization?.id
      );

      if (response.data.statusCode === 200 || response.data.statusCode === 201) {
        reset();
        toast.success(currentOrganization ? t('organization.messages.updateSuccess') : t('organization.messages.createSuccess'));
        router.push(paths.dashboard.organizations.organizationalUnitTable);
      }
    } catch (error) {
      console.error('Error saving employment type:', error);
      toast.error(t('organization.messages.saveError'));
    }
  });

  const renderDetails = () => (
    <Card>
      <Stack spacing={3} sx={{ p: 3 }}>
        <Typography variant="h6">{t('organization.form.sections.details')}</Typography>

        <Field.Text
          name="name"
          label={t('organization.form.fields.name.label')}
          helperText={t('organization.form.fields.name.helperText')}
          fullWidth
        />

        <Field.Text
          name="code"
          label={t('organization.form.fields.code.label')}
          helperText={t('organization.form.fields.code.helperText')}
          fullWidth
        />

        <Field.Text
          name="description"
          label={t('organization.form.fields.description.label')}
          helperText={t('organization.form.fields.description.helperText')}
          multiline
          minRows={4}
          fullWidth
        />

        <Field.Text
          name="color"
          label={t('organization.form.fields.color.label')}
          helperText={t('organization.form.fields.color.helperText')}
          slotProps={{
            input: {
              readOnly: true,
              startAdornment: (
                <InputAdornment position="start">
                  <IconButton
                    onClick={() => colorInputRef.current?.click()}
                    size="small"
                    sx={{
                      width: 40,
                      height: 40,
                      backgroundColor: methods.watch('color') || '#1976d2',
                      border: '2px solid',
                      borderColor: 'divider',
                      borderRadius: 1.5,
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover': {
                        backgroundColor: methods.watch('color') || '#1976d2',
                        transform: 'scale(1.1)',
                        borderColor: 'primary.main',
                        boxShadow: (theme) => theme.shadows[8],
                      },
                      '&:active': {
                        transform: 'scale(1.05)',
                      },
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
                        transform: 'translateX(-100%)',
                        transition: 'transform 0.6s',
                      },
                      '&:hover::before': {
                        transform: 'translateX(100%)',
                      },
                    }}
                  >
                    <Iconify
                      icon="solar:palette-bold"
                      sx={{
                        color: 'white',
                        filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.5))',
                        fontSize: 20,
                      }}
                    />
                  </IconButton>
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => colorInputRef.current?.click()}
                    size="small"
                    sx={{
                      '&:hover': {
                        color: 'primary.main',
                        transform: 'rotate(15deg)',
                      },
                      transition: 'all 0.2s ease-in-out',
                    }}
                  >
                    <Iconify icon="solar:pen-bold" />
                  </IconButton>
                </InputAdornment>
              ),
              sx: {
                '& .MuiInputBase-input': {
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  textAlign: 'center',
                  letterSpacing: '0.1em',
                },
                '&:hover': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                  },
                },
              },
            },
          }}
          onClick={() => colorInputRef.current?.click()}
        />

        {/* Input de color oculto */}
        <input
          ref={colorInputRef}
          type="color"
          value={methods.watch('color') || '#1976d2'}
          onChange={(e) => methods.setValue('color', e.target.value)}
          style={{
            position: 'absolute',
            opacity: 0,
            pointerEvents: 'none',
            width: 0,
            height: 0,
          }}
        />
      </Stack>
    </Card>
  );

  const renderActions = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
      <Button
        size="large"
        variant="soft"
        color="inherit"
        onClick={() => router.back()}
      >
        {t('organization.actions.cancel')}
      </Button>

      <Button
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator={t('organization.actions.saving')}
      >
        {currentOrganization ? t('organization.actions.update') : t('organization.actions.create')}
      </Button>
    </Box>
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={3}>
            {renderDetails()}
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3}>
            {renderActions()}
          </Stack>
        </Grid>
      </Grid>
    </Form>
  );
}
