export interface IUser {
  id: string;
  email: string;
  names: string;
  lastnames: string;
  isActive: boolean;
  roles: Array<{
    id: string;
    name: string;
  }>;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface IUserTableFilters {
  name: string;
  status: string;
  role: string[];
}

export interface IUserCreateInput {
  id?: string;
  email: string;
  names: string;
  lastnames: string;
  password: string;
  roleIds: string[];
  isActive?: boolean;
}

export interface IUserUpdateInput extends Partial<IUserCreateInput> {
  id: string;
}

export interface IUserOption {
  id: string;
  names: string;
  lastnames?: string;
  email: string;
  isActive: boolean;
}

export interface IUserClarity {
  idusuario: number;
  nombres: string;
  apellidos: string;
  apellido2: string | null;
  usuario: string;
  clave: string;
  correoElectronico: string;
  fechaCreacion: string;
  fechaSuspension: string | null;
  imagen: string | null;
  tipo: string;
  fechaultimologin: string | null;
  intentoslogin: number;
  tipousuario: number;
  zonahoraria: string;
  identificacion: string;
  avatarusuario: string | null;
  direccioncasa: string;
  direccionoficina: string;
  telefonocasa: string;
  telefonooficina: string;
  telefonocelular: string;
  correoelectronico2: string | null;
  alias: string;
  fechamodificacion: string | null;
  estadousuario: number;
  lenguaje: number;
  empresa: string;
  nitempresa: string;
  actividadeconomica: string;
  tipopersona: number;
  tipoautenticacion: number;
  indcambiopwd: number;
  tokenpwd: string | null;
  descripcionPerfil: string;
  template: string;
  templateTheme: string;
  templateLayout: string;
  templateMenuMode: string;
  templateOrientationRtl: string;
  templateHorizontal: string;
  templateDarkMenu: string;
  templateDarkMode: string;
  templateLayoutPrimaryColor: string;
  templateComponentTheme: string;
  templateMenuTheme: string;
  templateMenuColor: string;
}

export type IUserClarityCreatePayload = Omit<IUserClarity, 'idusuario'>;
