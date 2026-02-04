import type { IPosition } from 'src/types/organization';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { GetOrganizationalUnitPaginationService } from 'src/services/organization/organizationalUnit.service';
import { SaveOrUpdatePositionService, GetPositionPaginationService, } from 'src/services/organization/position.service';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export type PositionCreateSchemaType = {
  name: string;
  objectives?: string;
  expectedResults?: string;
  requirements?: string;
  otherFunctions?: string;
  code?: string;
  minimumAcademicLevel?: string;
  desiredAcademicLevel?: string;
  minimumExperience?: string;
  desiredExperience?: string;
  supervises?: string;
  regionalLocation?: string;
  headquarters?: string;
  version?: string;
  superiorJob?: number | null;
  organizationalUnitId?: string | null;
};

// ----------------------------------------------------------------------

type Props = {
  currentPosition?: IPosition;
};

export function PositionCreateEditForm({ currentPosition }: Props) {
  const router = useRouter();
  const { t } = useTranslate('organization');
  const [positionOptions, setPositionOptions] = useState<Array<{ id: number; name: string }>>([]);
  const [loadingPositions, setLoadingPositions] = useState(false);
  const [organizationalUnitOptions, setOrganizationalUnitOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingOrganizationalUnits, setLoadingOrganizationalUnits] = useState(false);

  const OrganizationCreateSchema = z.object({
    name: z.string().min(1, { message: t('position.form.fields.name.required') }),
    objectives: z.string().optional(),
    expectedResults: z.string().optional(),
    requirements: z.string().optional(),
    otherFunctions: z.string().optional(),
    code: z.string().max(80).optional().or(z.literal('')),
    minimumAcademicLevel: z.string().max(512).optional().or(z.literal('')),
    desiredAcademicLevel: z.string().max(512).optional().or(z.literal('')),
    minimumExperience: z.string().max(512).optional().or(z.literal('')),
    desiredExperience: z.string().max(512).optional().or(z.literal('')),
    supervises: z.string().max(512).optional().or(z.literal('')),
    regionalLocation: z.string().max(512).optional().or(z.literal('')),
    headquarters: z.string().max(512).optional().or(z.literal('')),
    version: z.string().max(64).optional().or(z.literal('')),
    superiorJob: z.number().optional().nullable(),
    organizationalUnitId: z.string().optional().nullable(),
  });

  const defaultValues: PositionCreateSchemaType = {
    name: '',
    objectives: '',
    expectedResults: '',
    requirements: '',
    otherFunctions: '',
    code: '',
    minimumAcademicLevel: '',
    desiredAcademicLevel: '',
    minimumExperience: '',
    desiredExperience: '',
    supervises: '',
    regionalLocation: '',
    headquarters: '',
    version: '',
    superiorJob: null,
    organizationalUnitId: null,
  };

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(OrganizationCreateSchema),
    defaultValues,
    values: currentPosition ? {
      ...currentPosition,
      superiorJob: currentPosition.superiorJob?.id || null,
      organizationalUnitId: currentPosition.organizationalUnit?.id || null,
    } : undefined,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  // Precargar la opción inicial si existe currentPosition.superiorJob
  useEffect(() => {
    if (currentPosition?.superiorJob) {
      setPositionOptions([{
        id: currentPosition.superiorJob.id,
        name: currentPosition.superiorJob.name,
      }]);
    }
  }, [currentPosition]);

  // Precargar la opción inicial si existe currentPosition.organizationalUnit
  useEffect(() => {
    if (currentPosition?.organizationalUnit) {
      setOrganizationalUnitOptions([{
        id: currentPosition.organizationalUnit.id,
        name: currentPosition.organizationalUnit.name,
      }]);
    }
  }, [currentPosition]);

  const handleSearchPositions = async (searchValue: string) => {
    try {
      setLoadingPositions(true);
      const response = await GetPositionPaginationService({
        page: 1,
        perPage: 20,
        search: searchValue,
      });

      if (response.status === 200) {
        const data = response.data?.data || [];
        const options = data.map((position: any) => ({
          id: position.id,
          name: position.name,
        }));
        setPositionOptions(options);
      }
    } catch (error) {
      console.error('Error loading positions:', error);
      setPositionOptions([]);
    } finally {
      setLoadingPositions(false);
    }
  };

  const handleSearchOrganizationalUnits = async (searchValue: string) => {
    try {
      setLoadingOrganizationalUnits(true);
      const response = await GetOrganizationalUnitPaginationService({
        page: 1,
        perPage: 20,
        search: searchValue,
      });

      if (response.status === 200) {
        const data = response.data || [];
        // Función para aplanar el árbol de unidades organizacionales
        const flattenUnits = (units: any[]): any[] => {
          const result: any[] = [];
          units.forEach((unit) => {
            result.push({ id: unit.id, name: unit.name });
            if (unit.children && unit.children.length > 0) {
              result.push(...flattenUnits(unit.children));
            }
          });
          return result;
        };
        const options = flattenUnits(data);
        setOrganizationalUnitOptions(options);
      }
    } catch (error) {
      console.error('Error loading organizational units:', error);
      setOrganizationalUnitOptions([]);
    } finally {
      setLoadingOrganizationalUnits(false);
    }
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      // Transformar los datos antes de enviar
      const dataToSend = {
        ...data,
        superiorJob: data.superiorJob || undefined, // Enviar undefined si es null
        organizationalUnitId: data.organizationalUnitId || undefined, // Enviar undefined si es null
      };

      const response = await SaveOrUpdatePositionService(
        dataToSend,
        currentPosition?.id
      );

      if (response.data.statusCode === 200 || response.data.statusCode === 201) {
        reset();
        toast.success(currentPosition ? t('position.messages.updateSuccess') : t('position.messages.createSuccess'));
        router.push(paths.dashboard.organizations.positions); // Ruta de retorno
      }
    } catch (error) {
      console.error('Error saving position:', error);
      toast.error(t('position.messages.saveError'));
    }
  });

  const renderDetails = () => (
    <Card>
      <Stack spacing={3} sx={{ p: 3 }}>
        <Typography variant="h6">{t('position.form.sections.details')}</Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          <Field.Text
            name="name"
            label={t('position.form.fields.name.label')}
            helperText={t('position.form.fields.name.helperText')}
          />

          <Field.Text
            name="code"
            label={t('position.form.fields.code.label')}
            helperText={t('position.form.fields.code.helperText')}
          />
        </Box>

        <Field.Autocomplete
          name="superiorJob"
          label={t('position.form.fields.superiorJob.label')}
          helperText={t('position.form.fields.superiorJob.helperText')}
          options={positionOptions}
          loading={loadingPositions}
          onOpen={() => {
            // Cargar opciones iniciales cuando se abre el autocomplete
            if (positionOptions.length === 0 || (positionOptions.length === 1 && currentPosition?.superiorJob)) {
              handleSearchPositions('');
            }
          }}
          onInputChange={(event, value, reason) => {
            // Solo buscar cuando el usuario escribe manualmente
            if (reason === 'input' && value) {
              handleSearchPositions(value);
            }
          }}
          getOptionLabel={(option) => {
            if (typeof option === 'number') {
              // Cuando es el valor inicial (id del cargo superior)
              const found = positionOptions.find((p) => p.id === option);
              if (found) return found.name;
              // Si aún no está en las opciones pero existe en currentPosition
              if (currentPosition?.superiorJob?.id === option) {
                return currentPosition.superiorJob.name;
              }
              return '';
            }
            return option?.name || '';
          }}
          isOptionEqualToValue={(option, value) => {
            if (typeof value === 'number') {
              return option.id === value;
            }
            return option.id === value?.id;
          }}
          onChange={(event, newValue) => {
            const selectedId = newValue?.id || null;
            methods.setValue('superiorJob', selectedId);
          }}
          slotProps={{
            textField: {
              placeholder: t('position.form.fields.superiorJob.placeholder'),
            },
          }}
        />

        <Field.Autocomplete
          name="organizationalUnitId"
          label={t('position.form.fields.organizationalUnit.label')}
          helperText={t('position.form.fields.organizationalUnit.helperText')}
          options={organizationalUnitOptions}
          loading={loadingOrganizationalUnits}
          onOpen={() => {
            // Cargar opciones iniciales cuando se abre el autocomplete
            if (organizationalUnitOptions.length === 0 || (organizationalUnitOptions.length === 1 && currentPosition?.organizationalUnit)) {
              handleSearchOrganizationalUnits('');
            }
          }}
          onInputChange={(event, value, reason) => {
            // Solo buscar cuando el usuario escribe manualmente
            if (reason === 'input' && value) {
              handleSearchOrganizationalUnits(value);
            }
          }}
          getOptionLabel={(option) => {
            if (typeof option === 'string') {
              // Cuando es el valor inicial (id de la unidad organizacional)
              const found = organizationalUnitOptions.find((u) => u.id === option);
              if (found) return found.name;
              // Si aún no está en las opciones pero existe en currentPosition
              if (currentPosition?.organizationalUnit?.id === option) {
                return currentPosition.organizationalUnit.name;
              }
              return '';
            }
            return option?.name || '';
          }}
          isOptionEqualToValue={(option, value) => {
            if (typeof value === 'string') {
              return option.id === value;
            }
            return option.id === value?.id;
          }}
          onChange={(event, newValue) => {
            const selectedId = newValue?.id || null;
            methods.setValue('organizationalUnitId', selectedId);
          }}
          slotProps={{
            textField: {
              placeholder: t('position.form.fields.organizationalUnit.placeholder'),
            },
          }}
        />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          <Field.Text
            name="objectives"
            label={t('position.form.fields.objectives.label')}
            helperText={t('position.form.fields.objectives.helperText')}
            multiline
            minRows={3}
          />

          <Field.Text
            name="expectedResults"
            label={t('position.form.fields.expectedResults.label')}
            helperText={t('position.form.fields.expectedResults.helperText')}
            multiline
            minRows={3}
          />

          <Field.Text
            name="requirements"
            label={t('position.form.fields.requirements.label')}
            helperText={t('position.form.fields.requirements.helperText')}
            multiline
            minRows={3}
          />

          <Field.Text
            name="otherFunctions"
            label={t('position.form.fields.otherFunctions.label')}
            helperText={t('position.form.fields.otherFunctions.helperText')}
            multiline
            minRows={3}
          />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          <Field.Text
            name="minimumAcademicLevel"
            label={t('position.form.fields.minimumAcademicLevel.label')}
            helperText={t('position.form.fields.minimumAcademicLevel.helperText')}
            multiline
            minRows={2}
          />

          <Field.Text
            name="desiredAcademicLevel"
            label={t('position.form.fields.desiredAcademicLevel.label')}
            helperText={t('position.form.fields.desiredAcademicLevel.helperText')}
            multiline
            minRows={2}
          />

          <Field.Text
            name="minimumExperience"
            label={t('position.form.fields.minimumExperience.label')}
            helperText={t('position.form.fields.minimumExperience.helperText')}
            multiline
            minRows={2}
          />

          <Field.Text
            name="desiredExperience"
            label={t('position.form.fields.desiredExperience.label')}
            helperText={t('position.form.fields.desiredExperience.helperText')}
            multiline
            minRows={2}
          />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          <Field.Text
            name="supervises"
            label={t('position.form.fields.supervises.label')}
            helperText={t('position.form.fields.supervises.helperText')}
          />

          <Field.Text
            name="regionalLocation"
            label={t('position.form.fields.regionalLocation.label')}
            helperText={t('position.form.fields.regionalLocation.helperText')}
          />

          <Field.Text
            name="headquarters"
            label={t('position.form.fields.headquarters.label')}
            helperText={t('position.form.fields.headquarters.helperText')}
          />

          <Field.Text
            name="version"
            label={t('position.form.fields.version.label')}
            helperText={t('position.form.fields.version.helperText')}
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
        onClick={() => router.back()}
      >
        {t('position.actions.cancel')}
      </Button>

      <Button
        size="medium"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator={t('position.actions.saving')}
      >
        {currentPosition ? t('position.actions.update') : t('position.actions.create')}
      </Button>
    </Box>
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={3}>
        {renderDetails()}
        {renderActions()}
      </Stack>
    </Form>
  );
}