import type { UserModule } from 'src/auth/types';
import type { NavSectionProps } from 'src/components/nav-section';

import { CONFIG } from 'src/global-config';

import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name: string) => (
  <SvgColor src={`${CONFIG.assetsDir}/assets/icons/navbar/${name}.svg`} />
);

// Mapa de iconos disponibles
const ICONS_MAP: Record<string, any> = {
  // Iconos de empleados
  'briefcase': icon('ic-job'),
  'user': icon('ic-user'),
  'user-check': icon('ic-user'),

  // Iconos generales
  'dashboard': icon('ic-dashboard'),
  'analytics': icon('ic-analytics'),
  'ecommerce': icon('ic-ecommerce'),
  'banking': icon('ic-banking'),
  'booking': icon('ic-booking'),
  'file': icon('ic-file'),
  'course': icon('ic-course'),
  'product': icon('ic-product'),
  'order': icon('ic-order'),
  'invoice': icon('ic-invoice'),
  'blog': icon('ic-blog'),
  'chat': icon('ic-chat'),
  'mail': icon('ic-mail'),
  'calendar': icon('ic-calendar'),
  'kanban': icon('ic-kanban'),
  'folder': icon('ic-folder'),
  'tour': icon('ic-tour'),
  'lock': icon('ic-lock'),
  'params': icon('ic-params'),
  'external': icon('ic-external'),
  'blank': icon('ic-blank'),
  'skills': icon('ic-skills'),
  'pay': icon('ic-pay'),
  'type-users': icon('ic-type-users'),
  'company': icon('ic-company'),
  'positions': icon('ic-positions'),
  'roles': icon('ic-roles'),
  'coin': icon('ic-coin'),
  'language': icon('ic-language'),
  'tags': icon('ic-tags'),
  'integrations': icon('ic-integrations'),
  'learning-objects': icon('ic-learning-objects'),
  'learning-categories': icon('ic-learning-categories'),
  'learning-paths': icon('ic-learning-paths'),
  'platforms': icon('ic-platforms'),
  'inventories': icon('ic-inventories'),
  'rewards': icon('ic-rewards'),
  'rewards-categories': icon('ic-rewards-categories'),
  'history': icon('ic-history'),
  'rules': icon('ic-rules'),
  'type-rules': icon('ic-type-rules'),
  'report': icon('ic-report'),
  'tracking': icon('ic-tracking'),
  'employee-assignment': icon('ic-employee-assignment'),
  'courses': icon('ic-courses'),
  'infrastructure-map': icon('ic-infrastructure-map'),
  'applications-map': icon('ic-applications-map'),
  'table': icon('ic-table'),
  'map': icon('ic-map'),
  'processes': icon('ic-processes'),
  'data': icon('ic-data'),
  'flow': icon('ic-flow'),
  'tools': icon('ic-tools'),
  'objectives': icon('ic-objectives'),
  'data-map': icon('ic-data-map'),
  'matrix': icon('ic-matrix'),
  'organization': icon('ic-organization'),
  'infrastructure': icon('ic-infrastructure'),
  'applications': icon('ic-applications'),
  'actions': icon('ic-actions'),
  'risks': icon('ic-risks'),
  'business': icon('ic-business'),
  'management': icon('ic-management'),
  'scales': icon('ic-scales'),
  'cogs': icon('ic-cogs'),
  'layers': icon('ic-layers'),
  'evaluate': icon('ic-evaluate'),
  'ai-course-generator': icon('ic-ai-course-generator'),
  'nine-box': icon('ic-nine-box'),

  // Iconos por defecto
  'default': icon('ic-menu-item'),
};

// ----------------------------------------------------------------------

// Re-exportar tipos para conveniencia
export type { UserModule as ModuleData } from 'src/auth/types';

// ----------------------------------------------------------------------

/**
 * Convierte un item del módulo (con posibles children) en el formato NavItemDataProps
 */
const convertItemToNavItem = (
  item: UserModule['items'][0],
  t: (key: string) => string
): NavSectionProps['data'][0]['items'][0] => {
  const navItem: NavSectionProps['data'][0]['items'][0] = {
    title: t(item.name),
    path: item.path,
    icon: ICONS_MAP[item.icon] || ICONS_MAP.default,
  };

  // Si tiene children, los convertimos recursivamente
  if (item.children && item.children.length > 0) {
    navItem.children = item.children.map((child) => convertItemToNavItem(child, t));
  }

  return navItem;
};

/**
 * Convierte los módulos del backend en la estructura navData requerida por el componente nav
 */
export const convertModulesToNavData = (
  modules: UserModule[], 
  t: (key: string) => string
): NavSectionProps['data'] => {
  if (!modules || modules.length === 0) {
    return [];
  }

  return modules.map((module) => ({
    subheader: t(module.subheader),
    items: module.items.map((item) => convertItemToNavItem(item, t)),
  }));
};

/**
 * Función para obtener un icono específico
 */
export const getNavIcon = (iconName: string) => ICONS_MAP[iconName] || ICONS_MAP.default;

/**
 * Verifica si el usuario tiene permisos para ver un elemento del menú
 */
export const hasPermission = (item: UserModule['items'][0], requiredPermission: string = 'view'): boolean =>
  item.permissions.includes(requiredPermission);