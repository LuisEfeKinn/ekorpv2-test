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
import { useDebounce } from 'minimal-shared/hooks';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Accordion from '@mui/material/Accordion';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { GetSelectCoinService } from 'src/services/organization/company.service';
import { GetEmployeesPaymentPeriods } from 'src/services/employees/employment-payment-period.service';
import { SaveOrUpdateUserManagmentService, GetUserManagmentPaginationService } from 'src/services/employees/user-managment.service';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CountryAutocompleteSimple } from 'src/components/hook-form/rhf-country-autocomplete-simple';
import { RegionAutocompleteStandalone } from 'src/components/hook-form/rhf-region-autocomplete-standalone';
import { MunicipalityAutocompleteStandalone } from 'src/components/hook-form/rhf-municipality-autocomplete-standalone';
import { Form, Field, SkillAutocomplete, PositionAutocomplete, EmploymentTypeAutocomplete, } from 'src/components/hook-form';
import { OrganizationalUnitAutocompleteStandalone } from 'src/components/hook-form/rhf-organizational-unit-autocomplete-standalone';

import { Language } from 'src/types/employees';

import { LearningPathsManagementModal } from './learning-paths-management-modal';

// ----------------------------------------------------------------------

export type UserManagementCreateSchemaType = IUserManagementFormSchema;

// ----------------------------------------------------------------------

type Props = {
  currentUser?: IUserManagement;
};

type SupervisorOption = {
  id: string;
  name: string;
};

type IntlWithSupportedValuesOf = typeof Intl & {
  supportedValuesOf: (key: 'timeZone') => string[];
};

function hasSupportedValuesOf(intl: typeof Intl): intl is IntlWithSupportedValuesOf {
  const maybe = intl as unknown as { supportedValuesOf?: unknown };
  return typeof maybe.supportedValuesOf === 'function';
}

function getTimeZoneOptions(): string[] {
  if (typeof Intl !== 'undefined' && hasSupportedValuesOf(Intl)) {
    return Intl.supportedValuesOf('timeZone');
  }

  return [
    'America/Bogota',
    'America/Mexico_City',
    'America/Lima',
    'America/Caracas',
    'America/Santiago',
    'America/Argentina/Buenos_Aires',
    'America/La_Paz',
    'America/Guayaquil',
    'America/Panama',
    'America/Costa_Rica',
    'America/Guatemala',
    'America/El_Salvador',
    'America/Tegucigalpa',
    'America/Managua',
    'America/Santo_Domingo',
    'America/Puerto_Rico',
    'America/Havana',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/Madrid',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'UTC',
  ];
}

export function UserManagementCreateEditForm({ currentUser }: Props) {
  const router = useRouter();
  const { t: tUsers } = useTranslate('employees');
  const { t: tCommon } = useTranslate('common');

  // Estados para manejar los autocompletes y dependencias
  const [selectedCountry, setSelectedCountry] = useState<ICountryOption | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<IRegionOption | null>(null);

  // Estado para el modal de rutas de aprendizaje
  const [openLearningPathsModal, setOpenLearningPathsModal] = useState(false);

  // Opciones para selects de moneda y periodo de pago
  const [coinOptions, setCoinOptions] = useState<{ value: number; label: string }[]>([]);
  const [paymentPeriodOptions, setPaymentPeriodOptions] = useState<{ value: number; label: string }[]>([]);

  // Estados para visibilidad de contraseñas
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isCreating = !currentUser;

  const timeZoneOptions = useMemo(() => {
    const base = getTimeZoneOptions();
    const unique = new Set(base);
    if (currentUser?.timezone) unique.add(currentUser.timezone);
    const list = Array.from(unique);
    list.sort((a, b) => a.localeCompare(b));
    const preferred = 'America/Bogota';
    if (unique.has(preferred)) {
      return [preferred, ...list.filter((item) => item !== preferred)];
    }
    return list;
  }, [currentUser?.timezone]);

  const [supervisorInputValue, setSupervisorInputValue] = useState('');
  const [supervisorOptions, setSupervisorOptions] = useState<SupervisorOption[]>([]);
  const [supervisorLoading, setSupervisorLoading] = useState(false);
  const debouncedSupervisorSearch = useDebounce(supervisorInputValue, 400);

  // Estados para precargar datos al editar
  const [preloadCountryId, setPreloadCountryId] = useState<string | undefined>(undefined);
  const [preloadRegionId, setPreloadRegionId] = useState<string | undefined>(undefined);
  const [preloadMunicipalityId, setPreloadMunicipalityId] = useState<string | undefined>(undefined);
  const [preloadPositionId, setPreloadPositionId] = useState<string | undefined>(undefined);
  const [preloadEmploymentTypeId, setPreloadEmploymentTypeId] = useState<string | undefined>(undefined);
  const [preloadSkillIds, setPreloadSkillIds] = useState<string[]>([]);
  const [preloadOrganizationalUnitId, setPreloadOrganizationalUnitId] = useState<string | undefined>(undefined);

  const UserManagementCreateSchema = z.object({
    firstName: z.string().min(1, { message: tUsers('user-management.form.fields.firstName.required') }),
    secondName: z.string(),
    firstLastName: z.string().min(1, { message: tUsers('user-management.form.fields.firstLastName.required') }),
    secondLastName: z.string(),
    username: z.string(),
    language: z.union([z.nativeEnum(Language), z.literal(0)]),
    timezone: z.string(),
    immediateSupervisor: z
      .object({
        id: z.string(),
        name: z.string(),
      })
      .nullable(),
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
    documentId: z.string(),
    skillId: z.array(z.object({
      id: z.string(),
      name: z.string(),
    })).min(1, { message: tUsers('user-management.form.fields.skillId.required') }),
    positionId: z.object({
      id: z.string(),
      name: z.string(),
    }).nullable().refine((val) => val && val.id, { message: tUsers('user-management.form.fields.positionId.required') }),
    email: isCreating
      ? z.string().min(1, { message: tUsers('user-management.form.fields.email.required') }).email({ message: tUsers('user-management.form.fields.email.invalid') })
      : z.string().email({ message: tUsers('user-management.form.fields.email.invalid') }).or(z.literal('')),
    tel: isCreating
      ? z.string().min(1, { message: tUsers('user-management.form.fields.tel.required') })
      : z.string(),
    password: isCreating
      ? z.string().min(8, { message: tUsers('user-management.form.fields.password.minLength') })
      : z.string(),
    confirmPassword: isCreating
      ? z.string().min(1, { message: tUsers('user-management.form.fields.confirmPassword.required') })
      : z.string(),
  }).superRefine((data, ctx) => {
    // Solo validar coincidencia si se ingresó una contraseña
    if (data.password && data.password.length > 0 && data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: tUsers('user-management.form.fields.confirmPassword.mismatch'),
        path: ['confirmPassword'],
      });
    }
  });

  const defaultValues: UserManagementCreateSchemaType = currentUser ? {
    // Mapeo de campos de la nueva estructura de API
    firstName: currentUser.firstName || '', // No viene en la respuesta actual
    secondName: currentUser.secondName || '', // No viene en la respuesta actual  
    firstLastName: currentUser.firstLastName || '', // No viene en la respuesta actual
    secondLastName: currentUser.secondLastName || '', // No viene en la respuesta actual
    username: currentUser.username || '',
    language: currentUser.language ?? 0,
    timezone: currentUser.timezone || '',
    immediateSupervisor: currentUser.immediateSupervisorId
      ? { id: String(currentUser.immediateSupervisorId.id), name: currentUser.immediateSupervisorId.name }
      : null,
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
    documentId: currentUser.documentId || '',
    email: '',
    tel: '',
    password: '',
    confirmPassword: '',
  } : {
    firstName: '',
    secondName: '',
    firstLastName: '',
    secondLastName: '',
    username: '',
    language: 0,
    timezone: '',
    immediateSupervisor: null,
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
    documentId: '',
    email: '',
    tel: '',
    password: '',
    confirmPassword: '',
  };

  const methods = useForm<UserManagementCreateSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(UserManagementCreateSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    setValue,
    control,
    formState: { isSubmitting },
  } = methods;

  const fetchSupervisors = useCallback(async (search?: string) => {
    setSupervisorLoading(true);
    try {
      const response = await GetUserManagmentPaginationService({
        page: 1,
        perPage: 20,
        ...(search?.trim() ? { search: search.trim() } : {}),
      });

      const data: SupervisorOption[] = (response.data?.data ?? []).map((emp: IUserManagement) => {
        const name = [emp.firstName, emp.secondName, emp.firstLastName, emp.secondLastName]
          .filter(Boolean)
          .join(' ');

        return {
          id: String(emp.id),
          name: name || emp.email || String(emp.id),
        };
      });

      setSupervisorOptions(data);
    } catch (error) {
      console.error('Error fetching supervisors:', error);
      setSupervisorOptions([]);
    } finally {
      setSupervisorLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSupervisors(debouncedSupervisorSearch);
  }, [debouncedSupervisorSearch, fetchSupervisors]);

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
          const positionIdString = currentUser.position.id.toString();
          setPreloadPositionId(positionIdString);
          const positionOption: IPositionOption = {
            id: positionIdString,
            name: currentUser.position.name,
          };
          setValue('positionId', positionOption);
        }

        // 3. Precargar tipo de empleo
        if (currentUser.employmentType) {
          setPreloadEmploymentTypeId(currentUser.employmentType.id);
        }

        // 4. Precargar competencias
        const competencies = currentUser.competencyKm || currentUser.skills || [];
        if (competencies.length > 0) {
          setPreloadSkillIds(competencies.map(c => c.id));
        }

        // 5. Precargar unidad organizacional
        if (currentUser.organizationalUnitId) {
          setPreloadOrganizationalUnitId(currentUser.organizationalUnitId.toString());
        }

        // 6. Otros campos que pueden venir directamente
        // Nota: firstName, secondName, etc. ahora sí vienen en la respuesta
        // También se agregó la precarga de organizationalUnitId

      } catch (error) {
        console.error('Error loading data for edit:', error);
      }
    };

    loadDataForEdit();
  }, [currentUser, setValue]);

  // Carga de opciones para moneda y periodo de pago
  useEffect(() => {
    const loadSelectOptions = async () => {
      try {
        const [coinsRes, periodsRes] = await Promise.all([
          GetSelectCoinService(),
          GetEmployeesPaymentPeriods({}),
        ]);

        const coinsData: any[] = coinsRes?.data?.data || [];
        setCoinOptions(
          coinsData.map((c: any) => ({
            value: Number(c.id),
            label: c.code ? `${c.name} (${c.code})` : c.name,
          }))
        );

        const periodsData: any[] = periodsRes?.data?.data || [];
        setPaymentPeriodOptions(
          periodsData.map((p: any) => ({
            value: Number(p.id),
            label: p.name,
          }))
        );
      } catch (error) {
        console.error('Error loading select options:', error);
      }
    };
    loadSelectOptions();
  }, []);

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
      const currentUserId = currentUser?.id;

      // Convertir los datos del formulario al formato esperado por el servicio
      // Excluir los campos de autocomplete que se mapean manualmente
       
      const {
        countrySelect,
        regionSelect,
        skillId,
        positionId,
        organizationalUnitId,
        employmentTypeId,
        municipalityId,
        documentId,
        immediateSupervisor,
        username,
        language,
        timezone,
        ...formDataWithoutAutocompletes
      } = data;

      const formDataForService: IUserManagementFormData = {
        ...formDataWithoutAutocompletes,
        municipalityId: municipalityId ? parseInt(municipalityId.id, 10) : 0,
        jobPositionId: positionId ? parseInt(positionId.id, 10) : 0,
        employmentTypeId: employmentTypeId ? parseInt(employmentTypeId.id, 10) : 0,
        competencyIds: skillId ? skillId.map(skill => parseInt(skill.id, 10)) : [],
        organizationalUnitId: organizationalUnitId ? parseInt(organizationalUnitId.id, 10) : 0,
        ...(documentId && { documentId }),
      };

      if (immediateSupervisor?.id) {
        formDataForService.immediateSupervisorId = parseInt(immediateSupervisor.id, 10);
      }

      if (username.trim()) {
        formDataForService.username = username.trim();
      }

      if (timezone.trim()) {
        formDataForService.timezone = timezone.trim();
      }

      if (language !== 0) {
        formDataForService.language = language;
      }

      // Incluir campos de cuenta solo si tienen valor
      if (formDataWithoutAutocompletes.email) {
        formDataForService.email = formDataWithoutAutocompletes.email;
      }
      if (formDataWithoutAutocompletes.tel) {
        formDataForService.tel = formDataWithoutAutocompletes.tel;
      }
      if (formDataWithoutAutocompletes.password) {
        formDataForService.password = formDataWithoutAutocompletes.password;
      }
      if (formDataWithoutAutocompletes.confirmPassword) {
        formDataForService.confirmPassword = formDataWithoutAutocompletes.confirmPassword;
      }

      // Llamar al servicio SaveOrUpdateUserManagmentService
      const response = await SaveOrUpdateUserManagmentService(formDataForService, currentUserId);

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

      toast.error(error?.message || errorMessage);
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

        <Grid size={{ xs: 12, md: 6 }}>
          <Field.Text
            name="documentId"
            label={tUsers('user-management.form.fields.documentId.label')}
            placeholder={tUsers('user-management.form.fields.documentId.placeholder')}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Field.Text
            name="username"
            label={tUsers('user-management.form.fields.username.label')}
            placeholder={tUsers('user-management.form.fields.username.placeholder')}
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

        <Grid size={{ xs: 12, md: 6 }}>
          <Field.Select
            name="language"
            label={tUsers('user-management.form.fields.language.label')}
          >
            <MenuItem value={0}>
              {tUsers('user-management.form.fields.language.empty')}
            </MenuItem>
            <MenuItem value={1}>
              {tUsers('user-management.enums.language.spanish')}
            </MenuItem>
            <MenuItem value={2}>
              {tUsers('user-management.enums.language.english')}
            </MenuItem>
          </Field.Select>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="timezone"
            control={control}
            render={({ field, fieldState }) => (
              <Autocomplete<string, false, false, true>
                options={timeZoneOptions}
                value={field.value ?? ''}
                onChange={(_, newValue) => field.onChange(newValue ?? '')}
                freeSolo
                selectOnFocus
                clearOnBlur
                handleHomeEndKeys
                getOptionLabel={(option) => option}
                isOptionEqualToValue={(option, value) => option === value}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={tUsers('user-management.form.fields.timezone.label')}
                    placeholder={tUsers('user-management.form.fields.timezone.placeholder')}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message ?? tUsers('user-management.form.fields.timezone.helperText')}
                  />
                )}
              />
            )}
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
          <Field.Text
            name="recurringWeeklyLimitHours"
            label={tUsers('user-management.form.fields.recurringWeeklyLimitHours.label')}
            placeholder={tUsers('user-management.form.fields.recurringWeeklyLimitHours.placeholder')}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="immediateSupervisor"
            control={control}
            render={({ field, fieldState }) => (
              <Autocomplete<SupervisorOption, false, false, false>
                options={supervisorOptions}
                loading={supervisorLoading}
                value={field.value}
                onChange={(_, newValue) => field.onChange(newValue)}
                inputValue={supervisorInputValue}
                onInputChange={(_, newInputValue) => setSupervisorInputValue(newInputValue)}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                filterOptions={(options) => options}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={tUsers('user-management.form.fields.immediateSupervisor.label')}
                    placeholder={tUsers('user-management.form.fields.immediateSupervisor.placeholder')}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    slotProps={{
                      input: {
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {supervisorLoading && <CircularProgress size={14} />}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      },
                    }}
                  />
                )}
              />
            )}
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
          <Field.Select
            name="coindId"
            label={tUsers('user-management.form.fields.coindId.label')}
          >
            {coinOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Field.Select>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Field.Select
            name="paymentPeriodId"
            label={tUsers('user-management.form.fields.paymentPeriodId.label')}
          >
            {paymentPeriodOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Field.Select>
        </Grid>
      </Grid>
    </Card>
  );

  const renderAccountInfo = () => (
    <Accordion defaultExpanded={isCreating}>
      <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
        <Stack>
          <Typography variant="h6">
            {tUsers('user-management.form.sections.accountInfo')}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {tUsers('user-management.form.sections.accountInfoDescription')}
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Field.Text
              name="email"
              label={tUsers('user-management.form.fields.email.label')}
              placeholder={tUsers('user-management.form.fields.email.placeholder')}
              type="email"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Field.Text
              name="tel"
              label={tUsers('user-management.form.fields.tel.label')}
              placeholder={tUsers('user-management.form.fields.tel.placeholder')}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Field.Text
              name="password"
              label={tUsers('user-management.form.fields.password.label')}
              placeholder={tUsers('user-management.form.fields.password.placeholder')}
              type={showPassword ? 'text' : 'password'}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        <Iconify icon={showPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Field.Text
              name="confirmPassword"
              label={tUsers('user-management.form.fields.confirmPassword.label')}
              placeholder={tUsers('user-management.form.fields.confirmPassword.placeholder')}
              type={showConfirmPassword ? 'text' : 'password'}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                        <Iconify icon={showConfirmPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
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
        {renderAccountInfo()}
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
