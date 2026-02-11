// Tipos para los módulos del menú
export interface UserRole {
  id: string;
  name: string;
}

export interface ModulePermission {
  id: string;
  name: string;
  icon: string;
  path: string;
  order: number;
  itemparentId: string | null;
  permissions: string[];
  moduleId: string;
  children?: ModulePermission[];
}

export interface UserModule {
  moduleId: string;
  subheader: string;
  order: number;
  items: ModulePermission[];
}

// Extender UserType para incluir los nuevos campos
export type UserType = {
  id?: string;
  names?: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  accessToken?: string;
  role?: string;
  roles?: UserRole[];
  modules?: UserModule[];
} | null;

export type AuthState = {
  user: UserType;
  loading: boolean;
};

export type AuthContextValue = {
  user: UserType;
  loading: boolean;
  authenticated: boolean;
  unauthenticated: boolean;
  checkUserSession?: () => Promise<void>;
};
