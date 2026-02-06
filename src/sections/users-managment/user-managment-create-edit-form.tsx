import type { IPositionOption } from 'src/types/organization';
import type {
  IRegionOption,
  ICountryOption,
  IMunicipalityOption
} from 'src/types/locations';
import type {
  IUserManagement,
  IUserManagementFormData,
  IUserManagementFormSchema,
} from 'src/types/employees';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { SaveOrUpdateUserManagmentService } from 'src/services/employees/user-managment.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CountryAutocompleteSimple } from 'src/components/hook-form/rhf-country-autocomplete-simple';
import { UserAutocompleteStandalone } from 'src/components/hook-form/rhf-user-autocomplete-standalone';
import { RegionAutocompleteStandalone } from 'src/components/hook-form/rhf-region-autocomplete-standalone';
import { MunicipalityAutocompleteStandalone } from 'src/components/hook-form/rhf-municipality-autocomplete-standalone';
import { Form, Field, SkillAutocomplete, PositionAutocomplete, EmploymentTypeAutocomplete, } from 'src/components/hook-form';
import { OrganizationalUnitAutocompleteStandalone } from 'src/components/hook-form/rhf-organizational-unit-autocomplete-standalone';

import { LearningPathsManagementModal } from './learning-paths-management-modal';

// ----------------------------------------------------------------------

export type UserManagementCreateSchemaType = IUserManagementFormSchema;

// ----------------------------------------------------------------------

type Props = {
  currentUser?: IUserManagement;
};

export function UserManagementCreateEditForm({ currentUser }: Props) {
  const router = useRouter();
  const { t: tUsers } = useTranslate('employees');
  const { t: tCommon } = useTranslate('common');

  // Estados para manejar los autocompletes y dependencias
  const [selectedCountry, setSelectedCountry] = useState<ICountryOption | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<IRegionOption | null>(null);

  // Estado para el modal de rutas de aprendizaje
  const [openLearningPathsModal, setOpenLearningPathsModal] = useState(false);

  // Estados para precargar datos al editar
  const [preloadCountryId, setPreloadCountryId] = useState<string | undefined>(undefined);
  const [preloadRegionId, setPreloadRegionId] = useState<string | undefined>(undefined);
  const [preloadMunicipalityId, setPreloadMunicipalityId] = useState<string | undefined>(undefined);
  const [preloadPositionId, setPreloadPositionId] = useState<string | undefined>(undefined);
  const [preloadEmploymentTypeId, setPreloadEmploymentTypeId] = useState<string | undefined>(undefined);
  const [preloadSkillIds, setPreloadSkillIds] = useState<string[]>([]);
  const [preloadOrganizationalUnitId, setPreloadOrganizationalUnitId] = useState<string | undefined>(undefined);
  const [preloadUserId, setPreloadUserId] = useState<string | undefined>(undefined);

  const UserManagementCreateSchema = z.object({
    firstName: z.string().min(1, { message: tUsers('user-management.form.fields.firstName.required') }),
    secondName: z.string().min(1, { message: tUsers('user-management.form.fields.secondName.required') }),
    firstLastName: z.string().min(1, { message: tUsers('user-management.form.fields.firstLastName.required') }),
    secondLastName: z.string().min(1, { message: tUsers('user-management.form.fields.secondLastName.required') }),
    address: z.string().min(1, { message: tUsers('user-management.form.fields.address.required') }),
    countrySelect: z.object({
      id: z.string(),
      name: z.string(),
    }).nullable().optional(),
    regionSelect: z.object({
      id: z.string(),
      name: z.string(),
    }).nullable().optional(),
    municipalityId: z.object({
      id: z.string(),
      name: z.string(),
    }).nullable().refine((val) => val && val.id, { message: tUsers('user-management.form.fields.municipalityId.required') }),
    postalCode: z.string().min(1, { message: tUsers('user-management.form.fields.postalCode.required') }),
    startedWorkOn: z.string().min(1, { message: tUsers('user-management.form.fields.startedWorkOn.required') }),
    paymentPeriodId: z.number().min(1, { message: tUsers('user-management.form.fields.paymentPeriodId.required') }),
    coindId: z.number().min(1, { message: tUsers('user-management.form.fields.coindId.required') }),
    billingRatePerHour: z.string().min(1, { message: tUsers('user-management.form.fields.billingRatePerHour.required') }),
    minimunBllingRatePerHour: z.string().min(1, { message: tUsers('user-management.form.fields.minimunBllingRatePerHour.required') }),
    recurringWeeklyLimitHours: z.string().min(1, { message: tUsers('user-management.form.fields.recurringWeeklyLimitHours.required') }),
    organizationalUnitId: z.object({
      id: z.string(),
      name: z.string(),
    }).nullable().refine((val) => val && val.id, { message: tUsers('user-management.form.fields.organizationalUnitId.required') }),
    employmentTypeId: z.object({
      id: z.string(),
      name: z.string(),
    }).nullable().refine((val) => val && val.id, { message: tUsers('user-management.form.fields.employmentTypeId.required') }),
    skillId: z.array(z.object({
      id: z.string(),
      name: z.string(),
    })).min(1, { message: tUsers('user-management.form.fields.skillId.required') }),
    positionId: z.object({
      id: z.string(),
      name: z.string(),
    }).nullable().refine((val) => val && val.id, { message: tUsers('user-management.form.fields.positionId.required') }),
    userId: z.object({
      id: z.string(),
      names: z.string(),
    }).nullable().refine((val) => val && val.id, { message: tUsers('user-management.form.fields.userId.required') }),
  });

  const defaultValues: UserManagementCreateSchemaType = currentUser ? {
    // Mapeo de campos de la nueva estructura de API
    firstName: currentUser.firstName || '', // No viene en la respuesta actual
    secondName: currentUser.secondName || '', // No viene en la respuesta actual  
    firstLastName: currentUser.firstLastName || '', // No viene en la respuesta actual
    secondLastName: currentUser.secondLastName || '', // No viene en la respuesta actual
    address: currentUser.address || '',
    countrySelect: null, // Se cargará con el autocomplete
    regionSelect: null, // Se cargará con el autocomplete
    municipalityId: null, // Se cargará con el autocomplete
    postalCode: currentUser.postalCode || '', // No viene en la respuesta actual
    startedWorkOn: currentUser.startedWorkOn ? new Date(currentUser.startedWorkOn).toISOString().split('T')[0] : '',
    paymentPeriodId: currentUser.paymentPeriod ? parseInt(currentUser.paymentPeriod.id, 10) : 0,
    coindId: currentUser.coin ? parseInt(currentUser.coin.id, 10) : 0,
    billingRatePerHour: currentUser.billingRatePerHour || '', // No viene en la respuesta actual
    minimunBllingRatePerHour: currentUser.minimumBillingRatePerHour || '',
    recurringWeeklyLimitHours: currentUser.recurringWeeklyLimitHours || '',
    organizationalUnitId: null, // Se cargará con el autocomplete (no viene en respuesta)
    employmentTypeId: null, // Se cargará con el autocomplete
    skillId: [], // Se cargará con el autocomplete
    positionId: null, // Se cargará con el autocomplete
    userId: null, // Se cargará con el autocomplete
  } : {
    firstName: '',
    secondName: '',
    firstLastName: '',
    secondLastName: '',
    address: '',
    countrySelect: null,
    regionSelect: null,
    municipalityId: null,
    postalCode: '',
    startedWorkOn: '',
    paymentPeriodId: 0,
    coindId: 0,
    billingRatePerHour: '',
    minimunBllingRatePerHour: '',
    recurringWeeklyLimitHours: '',
    organizationalUnitId: null,
    employmentTypeId: null,
    skillId: [],
    positionId: null,
    userId: null,
  };

  const methods = useForm<UserManagementCreateSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(UserManagementCreateSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = methods;

  // Lógica de precarga para editar - actualizada para nueva estructura de respuesta
  useEffect(() => {
    const loadDataForEdit = async () => {
      if (!currentUser) return;

      try {
        // 1. Precargar datos de ubicación si existen
        if (currentUser.location?.municipality) {
          const { municipality, region, country } = currentUser.location;
          
          // Establecer el municipio
          if (municipality) {
            setPreloadMunicipalityId(municipality.id);
            const municipalityOption: IMunicipalityOption = {
              id: municipality.id,
              name: municipality.name,
              regionId: region?.id || '',
              regionName: region?.name || '',
              countryId: country?.id || '',
              countryName: country?.name || '',
            };
            setValue('municipalityId', municipalityOption);
          }

          // Establecer la región
          if (region) {
            setPreloadRegionId(region.id);
            const regionOption: IRegionOption = {
              id: region.id,
              name: region.name,
              code: region.name, // Asumiendo que no viene code
              countryId: country?.id || '',
            };
            setSelectedRegion(regionOption);
            setValue('regionSelect', regionOption);
          }

          // Establecer el país
          if (country) {
            setPreloadCountryId(country.id);
            const countryOption: ICountryOption = {
              id: country.id,
              name: country.name,
              code: country.name, // Asumiendo que no viene code
            };
            setSelectedCountry(countryOption);
            setValue('countrySelect', countryOption);
          }
        }

        // 2. Precargar posición
        if (currentUser.position) {
          setPreloadPositionId(currentUser.position.id);
        }

        // 3. Precargar tipo de empleo
        if (currentUser.employmentType) {
          setPreloadEmploymentTypeId(currentUser.employmentType.id);
        }

        // 4. Precargar skills (ahora es un array)
        if (currentUser.skills && Array.isArray(currentUser.skills)) {
          const skillIds = currentUser.skills.map(skill => skill.id);
          setPreloadSkillIds(skillIds);
        }

        // 5. Precargar unidad organizacional
        if (currentUser.organizationalUnitId) {
          setPreloadOrganizationalUnitId(currentUser.organizationalUnitId.toString());
        }

        // 6. Precargar usuario (userId ya viene como string)
        if (currentUser.userId) {
          setPreloadUserId(currentUser.userId.toString());
        }

        // 7. Otros campos que pueden venir directamente
        // Nota: firstName, secondName, etc. ahora sí vienen en la respuesta
        // También se agregó la precarga de organizationalUnitId

      } catch (error) {
        console.error('Error loading data for edit:', error);
      }
    };

    loadDataForEdit();
  }, [currentUser, setValue]);

  // Funciones de manejo simplificadas - solo actualizar el estado local sin callbacks complejos
  const handleCountryChange = (country: ICountryOption | null) => {
    setSelectedCountry(country);

    // Si el usuario limpia el país (country es null), limpiar región y municipio
    if (country === null) {
      setSelectedRegion(null);
      setValue('regionSelect', null);
      setValue('municipalityId', null);
    }
    // No limpiar otros campos aquí para cambios - dejar que cada componente maneje su propia lógica
  };

  const handleRegionChange = (region: IRegionOption | null) => {
    setSelectedRegion(region);

    // Si el usuario limpia la región (region es null), limpiar municipio
    if (region === null) {
      setValue('municipalityId', null);
    }
    // No limpiar municipio aquí para cambios - dejar que el componente de municipio maneje su propia lógica
  };

  const handleMunicipalityChange = (municipality: IMunicipalityOption | null) => {
    // No hacer nada - el municipio se maneja directamente por el autocomplete
  };

  const handlePositionChange = (position: IPositionOption | null) => {
    // No hacer nada - la posición se maneja directamente por el autocomplete
  };



  const onSubmit = handleSubmit(async (data) => {
    try {
      const userId = currentUser?.id;

      // Convertir los datos del formulario al formato esperado por el servicio
      // Excluir countrySelect, regionSelect y skillId que solo son para el formulario
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { countrySelect, regionSelect, skillId, ...formDataWithoutLocation } = data;

      const formDataForService: IUserManagementFormData = {
        ...formDataWithoutLocation,
        municipalityId: data.municipalityId ? parseInt(data.municipalityId.id, 10) : 0,
        positionId: data.positionId ? parseInt(data.positionId.id, 10) : 0,
        employmentTypeId: data.employmentTypeId ? parseInt(data.employmentTypeId.id, 10) : 0,
        skillIds: data.skillId ? data.skillId.map(skill => parseInt(skill.id, 10)) : [],
        organizationalUnitId: data.organizationalUnitId ? parseInt(data.organizationalUnitId.id, 10) : 0,
        userId: data.userId ? parseInt(data.userId.id, 10) : 0,
      };

      // Llamar al servicio SaveOrUpdateUserManagmentService
      const response = await SaveOrUpdateUserManagmentService(formDataForService, userId);

      // Verificar si la respuesta fue exitosa
      if (response?.status === 200 || response?.status === 201) {
        toast.success(
          currentUser
            ? tUsers('user-management.messages.updateSuccess')
            : tUsers('user-management.messages.createSuccess')
        );

        router.push(paths.dashboard.employees.userManagment);
      } else {
        throw new Error('Unexpected response status');
      }
    } catch (error: any) {
      console.error('Error saving user:', error);

      // Manejar diferentes tipos de errores
      let errorMessage = tUsers('user-management.messages.error.saving');

      // Error de validación del servidor (400)
      if (error?.response?.status === 400) {
        errorMessage = error?.response?.data?.message || 'Datos de entrada inválidos';
      }
      // Error de autorización (401/403)
      else if (error?.response?.status === 401 || error?.response?.status === 403) {
        errorMessage = 'No tienes permisos para realizar esta acción';
      }
      // Error de recurso no encontrado (404)
      else if (error?.response?.status === 404) {
        errorMessage = tUsers('user-management.messages.error.notFound');
      }
      // Error del servidor (500)
      else if (error?.response?.status >= 500) {
        errorMessage = 'Error interno del servidor. Por favor, contacta al administrador.';
      }
      // Error de red
      else if (error?.code === 'NETWORK_ERROR' || !error?.response) {
        errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
      }
      // Mensaje personalizado del servidor
      else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      // Mensaje genérico del error
      else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    }
  });

  const renderPersonalInfo = () => (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        {tUsers('user-management.form.sections.personalInfo')}
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Field.Text
            name="firstName"
            label={tUsers('user-management.form.fields.firstName.label')}
            placeholder={tUsers('user-management.form.fields.firstName.placeholder')}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Field.Text
            name="secondName"
            label={tUsers('user-management.form.fields.secondName.label')}
            placeholder={tUsers('user-management.form.fields.secondName.placeholder')}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Field.Text
            name="firstLastName"
            label={tUsers('user-management.form.fields.firstLastName.label')}
            placeholder={tUsers('user-management.form.fields.firstLastName.placeholder')}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Field.Text
            name="secondLastName"
            label={tUsers('user-management.form.fields.secondLastName.label')}
            placeholder={tUsers('user-management.form.fields.secondLastName.placeholder')}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Field.Text
            name="address"
            label={tUsers('user-management.form.fields.address.label')}
            placeholder={tUsers('user-management.form.fields.address.placeholder')}
            multiline
            rows={3}
          />
        </Grid>
      </Grid>
    </Card>
  );

  const renderLocationInfo = () => (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        {tUsers('user-management.form.sections.locationInfo')}
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <CountryAutocompleteSimple
            name="countrySelect"
            label="País"
            placeholder="Buscar país..."
            onCountryChange={handleCountryChange}
            preloadCountryId={preloadCountryId}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <RegionAutocompleteStandalone
            name="regionSelect"
            label="Región/Departamento"
            placeholder="Buscar región..."
            countryId={selectedCountry?.id}
            onRegionChange={handleRegionChange}
            preloadRegionId={preloadRegionId}
            disabled={!selectedCountry}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <MunicipalityAutocompleteStandalone
            name="municipalityId"
            label={tUsers('user-management.form.fields.municipalityId.label')}
            placeholder="Buscar municipio..."
            regionId={selectedRegion?.id}
            onMunicipalityChange={handleMunicipalityChange}
            preloadMunicipalityId={preloadMunicipalityId}
            disabled={!selectedRegion}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Field.Text
            name="postalCode"
            label={tUsers('user-management.form.fields.postalCode.label')}
            placeholder={tUsers('user-management.form.fields.postalCode.placeholder')}
          />
        </Grid>
      </Grid>
    </Card>
  );

  const renderWorkInfo = () => (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        {tUsers('user-management.form.sections.workDetails')}
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <PositionAutocomplete
            name="positionId"
            label={tUsers('user-management.form.fields.positionId.label')}
            placeholder="Buscar posición..."
            onPositionChange={handlePositionChange}
            preloadPositionId={preloadPositionId}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <EmploymentTypeAutocomplete
            name="employmentTypeId"
            label={tUsers('user-management.form.fields.employmentTypeId.label')}
            placeholder={tUsers('user-management.form.fields.employmentTypeId.placeholder')}
            preloadEmploymentTypeId={preloadEmploymentTypeId}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <SkillAutocomplete
            name="skillId"
            label={tUsers('user-management.form.fields.skillId.label')}
            placeholder={tUsers('user-management.form.fields.skillId.placeholder')}
            preloadSkillIds={preloadSkillIds}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <OrganizationalUnitAutocompleteStandalone
            name="organizationalUnitId"
            label={tUsers('user-management.form.fields.organizationalUnitId.label')}
            placeholder={tUsers('user-management.form.fields.organizationalUnitId.placeholder')}
            preloadOrganizationalUnitId={preloadOrganizationalUnitId}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Field.Text
            name="startedWorkOn"
            label={tUsers('user-management.form.fields.startedWorkOn.label')}
            type="date"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <UserAutocompleteStandalone
            name="userId"
            label={tUsers('user-management.form.fields.userId.label')}
            placeholder={tUsers('user-management.form.fields.userId.placeholder')}
            preloadUserId={preloadUserId}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Field.Text
            name="recurringWeeklyLimitHours"
            label={tUsers('user-management.form.fields.recurringWeeklyLimitHours.label')}
            placeholder={tUsers('user-management.form.fields.recurringWeeklyLimitHours.placeholder')}
          />
        </Grid>
      </Grid>
    </Card>
  );

  const renderPaymentInfo = () => (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        {tUsers('user-management.form.sections.paymentInfo')}
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Field.Text
            name="billingRatePerHour"
            label={tUsers('user-management.form.fields.billingRatePerHour.label')}
            placeholder={tUsers('user-management.form.fields.billingRatePerHour.placeholder')}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Field.Text
            name="minimunBllingRatePerHour"
            label={tUsers('user-management.form.fields.minimunBllingRatePerHour.label')}
            placeholder={tUsers('user-management.form.fields.minimunBllingRatePerHour.placeholder')}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Field.Text
            name="coindId"
            label={tUsers('user-management.form.fields.coindId.label')}
            placeholder={tUsers('user-management.form.fields.coindId.placeholder')}
            type="number"
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Field.Text
            name="paymentPeriodId"
            label={tUsers('user-management.form.fields.paymentPeriodId.label')}
            placeholder={tUsers('user-management.form.fields.paymentPeriodId.placeholder')}
            type="number"
          />
        </Grid>
      </Grid>
    </Card>
  );

  const renderActions = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: 'flex-start', flexWrap: 'wrap' }}>
      <Button
        size="medium"
        variant="soft"
        color="inherit"
        onClick={() => router.back()}
      >
        {tCommon('actions.cancel')}
      </Button>

      <Button
        size="medium"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator={tCommon('actions.saving')}
      >
        {currentUser ? tCommon('actions.update') : tCommon('actions.create')}
      </Button>

      {/* Botón para gestionar rutas de aprendizaje - solo visible al editar */}
      {currentUser && (
        <Button
          size="medium"
          variant="outlined"
          color="primary"
          onClick={() => setOpenLearningPathsModal(true)}
          startIcon={<Iconify icon="solar:notebook-bold-duotone" />}
        >
          {tUsers('user-management.learning-paths.manageButton')}
        </Button>
      )}
    </Box>
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={3}>
        {renderPersonalInfo()}
        {renderLocationInfo()}
        {renderWorkInfo()}
        {renderPaymentInfo()}
        {renderActions()}
      </Stack>

      {/* Modal de gestión de rutas de aprendizaje */}
      {currentUser && (
        <LearningPathsManagementModal
          open={openLearningPathsModal}
          onClose={() => setOpenLearningPathsModal(false)}
          userId={currentUser.id}
        />
      )}
    </Form>
  );
}