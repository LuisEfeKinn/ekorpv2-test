import type { UserType } from '../types';

import { paths } from 'src/routes/paths';

// ----------------------------------------------------------------------

/**
 * Mapa de rutas de dashboard por ID de rol (más estable que por nombre)
 * Incluye prioridad: menor número = mayor prioridad
 */
const DASHBOARD_ROUTES_BY_ID = {
  '1': { route: paths.dashboard.root, priority: 1 },                          // Super Admin (máxima prioridad)
  '2': { route: paths.dashboard.root, priority: 2 },                          // Admin
  '6': { route: paths.dashboard.collaborator, priority: 3 },                  // Collaborator/Employee
  // Agregar más IDs según necesites
} as const;

/**
 * Ruta por defecto si no se encuentra el rol o dashboard
 */
const DEFAULT_DASHBOARD_ROUTE = paths.dashboard.collaborator;

/**
 * Determina la ruta de redirección apropiada según el usuario
 * Prioridad: 
 * 1. Dashboard específico del rol
 * 2. Primer módulo disponible
 * 3. Dashboard colaborador por defecto
 * 4. Si no hay módulos ni acceso, ir a página de acceso denegado
 */
export const getDashboardRoute = (user: UserType): string => {
  if (!user) {
    return paths.dashboard.root;
  }

  // 1. Intentar obtener dashboard específico por rol
  const dashboardByRole = getDashboardByRole(user);
  if (dashboardByRole) {
    return dashboardByRole;
  }

  // 2. Intentar usar el primer módulo disponible
  const firstModuleRoute = getFirstAvailableModule(user);
  if (firstModuleRoute) {
    return firstModuleRoute;
  }

  // 3. Si no tiene módulos, verificar si al menos tiene rol con dashboard
  if (user.roles && user.roles.length > 0) {
    return DEFAULT_DASHBOARD_ROUTE;
  }

  // 4. Si no tiene módulos NI roles, ir a página de sin acceso
  // console.warn('Usuario sin módulos ni roles válidos:', user.email);
  // return paths.noAccess; // Página personalizada para usuarios sin módulos
  return  DEFAULT_DASHBOARD_ROUTE;
};

/**
 * Obtiene el dashboard específico evaluando TODOS los roles del usuario
 * Retorna el dashboard del rol con mayor prioridad (menor número)
 */
export const getDashboardByRole = (user: UserType): string | null => {
  if (!user?.roles || user.roles.length === 0) {
    return null;
  }

  let bestRoute: string | null = null;
  let bestPriority = Infinity;

  // Evaluar todos los roles del usuario
  for (const role of user.roles) {
    // 1. Intentar por ID del rol (más confiable)
    if (role?.id) {
      const routeConfig = DASHBOARD_ROUTES_BY_ID[role.id as keyof typeof DASHBOARD_ROUTES_BY_ID];
      if (routeConfig && routeConfig.priority < bestPriority) {
        bestRoute = routeConfig.route;
        bestPriority = routeConfig.priority;
      }
    }
  }

  return bestRoute;
};

/**
 * Obtiene la ruta del primer módulo disponible para el usuario
 * Prioriza módulos de dashboard, luego cualquier otro módulo
 */
export const getFirstAvailableModule = (user: UserType): string | null => {
  if (!user?.modules || user.modules.length === 0) {
    return null;
  }

  // 1. Buscar primero un módulo de dashboard
  const dashboardModule = user.modules.find(module => 
    module.moduleId.toLowerCase().includes('dashboard')
  );
  
  if (dashboardModule?.items?.[0]?.path) {
    return dashboardModule.items[0].path;
  }

  // 2. Si no hay módulo dashboard, usar el primer módulo disponible
  const firstModule = user.modules[0];
  const firstItem = firstModule?.items?.[0];
  
  if (firstItem?.path) {
    return firstItem.path;
  }

  return null;
};

/**
 * Verifica si el usuario tiene un rol específico por ID
 */
export const hasRoleById = (user: UserType, roleId: string): boolean => {
  if (!user?.roles) return false;
  
  return user.roles.some(role => role.id === roleId);
};

/**
 * Verifica si el usuario es super admin (ID: '1')
 */
export const isSuperAdmin = (user: UserType): boolean => 
  hasRoleById(user, '1');

/**
 * Verifica si el usuario es admin (ID: '2') o super admin
 */
export const isAdmin = (user: UserType): boolean => 
  hasRoleById(user, '2') || isSuperAdmin(user);

