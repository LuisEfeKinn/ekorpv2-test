import type { UserModule } from 'src/auth/types';
import type { NavSectionProps } from 'src/components/nav-section';
import type { NavItemDataProps } from 'src/components/nav-section/types';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { SvgColor } from 'src/components/svg-color';

import { getNavIcon, convertModulesToNavData } from './utils/nav-utils';

// ----------------------------------------------------------------------

const icon = (name: string) => (
  <SvgColor src={`${CONFIG.assetsDir}/assets/icons/navbar/${name}.svg`} />
);

const ICONS = {
  job: icon('ic-job'),
  blog: icon('ic-blog'),
  chat: icon('ic-chat'),
  mail: icon('ic-mail'),
  user: icon('ic-user'),
  file: icon('ic-file'),
  lock: icon('ic-lock'),
  tour: icon('ic-tour'),
  order: icon('ic-order'),
  label: icon('ic-label'),
  blank: icon('ic-blank'),
  kanban: icon('ic-kanban'),
  folder: icon('ic-folder'),
  course: icon('ic-course'),
  params: icon('ic-params'),
  banking: icon('ic-banking'),
  booking: icon('ic-booking'),
  invoice: icon('ic-invoice'),
  product: icon('ic-product'),
  calendar: icon('ic-calendar'),
  disabled: icon('ic-disabled'),
  external: icon('ic-external'),
  subpaths: icon('ic-subpaths'),
  menuItem: icon('ic-menu-item'),
  ecommerce: icon('ic-ecommerce'),
  analytics: icon('ic-analytics'),
  dashboard: icon('ic-dashboard'),
};

// ----------------------------------------------------------------------

/**
 * Input nav data is an array of navigation section items used to define the structure and content of a navigation bar.
 * Each section contains a subheader and an array of items, which can include nested children items.
 *
 * Each item can have the following properties:
 * - `title`: The title of the navigation item.
 * - `path`: The URL path the item links to.
 * - `icon`: An optional icon component to display alongside the title.
 * - `info`: Optional additional information to display, such as a label.
 * - `allowedRoles`: An optional array of roles that are allowed to see the item.
 * - `caption`: An optional caption to display below the title.
 * - `children`: An optional array of nested navigation items.
 * - `disabled`: An optional boolean to disable the item.
 * - `deepMatch`: An optional boolean to indicate if the item should match subpaths.
 */
export const navData: NavSectionProps['data'] = [
  /**
   * Overview
   */
  {
    subheader: 'Overview',
    items: [
      { title: 'App', path: paths.dashboard.root, icon: ICONS.dashboard },
      { title: 'Ecommerce', path: paths.dashboard.general.ecommerce, icon: ICONS.ecommerce },
      { title: 'Analytics', path: paths.dashboard.general.analytics, icon: ICONS.analytics },
      { title: 'Banking', path: paths.dashboard.general.banking, icon: ICONS.banking },
      { title: 'Booking', path: paths.dashboard.general.booking, icon: ICONS.booking },
      { title: 'File', path: paths.dashboard.general.file, icon: ICONS.file },
      { title: 'Course', path: paths.dashboard.general.course, icon: ICONS.course },
    ],
  },
  /**
   * Management
   */
  {
    subheader: 'Management',
    items: [
      {
        title: 'User',
        path: paths.dashboard.user.root,
        icon: ICONS.user,
        children: [
          { title: 'Profile', path: paths.dashboard.user.root },
          { title: 'Cards', path: paths.dashboard.user.cards },
          { title: 'List', path: paths.dashboard.user.list },
          { title: 'Create', path: paths.dashboard.user.new },
          { title: 'Edit', path: paths.dashboard.user.demo.edit },
          { title: 'Account', path: paths.dashboard.user.account, deepMatch: true },
        ],
      },
      {
        title: 'Product',
        path: paths.dashboard.product.root,
        icon: ICONS.product,
        children: [
          { title: 'List', path: paths.dashboard.product.root },
          { title: 'Details', path: paths.dashboard.product.demo.details },
          { title: 'Create', path: paths.dashboard.product.new },
          { title: 'Edit', path: paths.dashboard.product.demo.edit },
        ],
      },
      {
        title: 'Order',
        path: paths.dashboard.order.root,
        icon: ICONS.order,
        children: [
          { title: 'List', path: paths.dashboard.order.root },
          { title: 'Details', path: paths.dashboard.order.demo.details },
        ],
      },
      {
        title: 'Invoice',
        path: paths.dashboard.invoice.root,
        icon: ICONS.invoice,
        children: [
          { title: 'List', path: paths.dashboard.invoice.root },
          { title: 'Details', path: paths.dashboard.invoice.demo.details },
          { title: 'Create', path: paths.dashboard.invoice.new },
          { title: 'Edit', path: paths.dashboard.invoice.demo.edit },
        ],
      },
      {
        title: 'Blog',
        path: paths.dashboard.post.root,
        icon: ICONS.blog,
        children: [
          { title: 'List', path: paths.dashboard.post.root },
          { title: 'Details', path: paths.dashboard.post.demo.details },
          { title: 'Create', path: paths.dashboard.post.new },
          { title: 'Edit', path: paths.dashboard.post.demo.edit },
        ],
      },
      {
        title: 'Job',
        path: paths.dashboard.job.root,
        icon: ICONS.job,
        children: [
          { title: 'List', path: paths.dashboard.job.root },
          { title: 'Details', path: paths.dashboard.job.demo.details },
          { title: 'Create', path: paths.dashboard.job.new },
          { title: 'Edit', path: paths.dashboard.job.demo.edit },
        ],
      },
      {
        title: 'Tour',
        path: paths.dashboard.tour.root,
        icon: ICONS.tour,
        children: [
          { title: 'List', path: paths.dashboard.tour.root },
          { title: 'Details', path: paths.dashboard.tour.demo.details },
          { title: 'Create', path: paths.dashboard.tour.new },
          { title: 'Edit', path: paths.dashboard.tour.demo.edit },
        ],
      },
      { title: 'File manager', path: paths.dashboard.fileManager, icon: ICONS.folder },
      {
        title: 'Mail',
        path: paths.dashboard.mail,
        icon: ICONS.mail,
        info: (
          <Label color="error" variant="inverted">
            +32
          </Label>
        ),
      },
      { title: 'Chat', path: paths.dashboard.chat, icon: ICONS.chat },
      { title: 'Calendar', path: paths.dashboard.calendar, icon: ICONS.calendar },
      { title: 'Kanban', path: paths.dashboard.kanban, icon: ICONS.kanban },
    ],
  },
  /**
   * AI Tools
   */
  {
    subheader: 'AI Tools',
    items: [
      {
        title: 'Course Generator',
        path: paths.dashboard.ai.courseGenerator.root,
        icon: <Iconify icon="tabler:robot" width={24} />,
        children: [
          { title: 'List', path: paths.dashboard.ai.courseGenerator.root },
          { title: 'Create', path: paths.dashboard.ai.courseGenerator.create },
        ],
      },
    ],
  },
  /**
   * Item state
   */
  {
    subheader: 'Misc',
    items: [
      {
        /**
         * Permissions can be set for each item by using the `allowedRoles` property.
         * - If `allowedRoles` is not set (default), all roles can see the item.
         * - If `allowedRoles` is an empty array `[]`, no one can see the item.
         * - If `allowedRoles` contains specific roles, only those roles can see the item.
         *
         * Examples:
         * - `allowedRoles: ['user']` - only users with the 'user' role can see this item.
         * - `allowedRoles: ['admin']` - only users with the 'admin' role can see this item.
         * - `allowedRoles: ['admin', 'manager']` - only users with the 'admin' or 'manager' roles can see this item.
         *
         * Combine with the `checkPermissions` prop to build conditional expressions.
         * Example usage can be found in: src/sections/_examples/extra/navigation-bar-view/nav-vertical.{jsx | tsx}
         */
        title: 'Permission',
        path: paths.dashboard.permission,
        icon: ICONS.lock,
        allowedRoles: ['admin', 'manager'],
        caption: 'Only admin can see this item.',
      },
      {
        title: 'Level',
        path: '#/dashboard/menu-level',
        icon: ICONS.menuItem,
        children: [
          {
            title: 'Level 1a',
            path: '#/dashboard/menu-level/1a',
            children: [
              { title: 'Level 2a', path: '#/dashboard/menu-level/1a/2a' },
              {
                title: 'Level 2b',
                path: '#/dashboard/menu-level/1a/2b',
                children: [
                  {
                    title: 'Level 3a',
                    path: '#/dashboard/menu-level/1a/2b/3a',
                  },
                  {
                    title: 'Level 3b',
                    path: '#/dashboard/menu-level/1a/2b/3b',
                  },
                ],
              },
            ],
          },
          { title: 'Level 1b', path: '#/dashboard/menu-level/1b' },
        ],
      },
      {
        title: 'Disabled',
        path: '#disabled',
        icon: ICONS.disabled,
        disabled: true,
      },
      {
        title: 'Label',
        path: '#label',
        icon: ICONS.label,
        info: (
          <Label
            color="info"
            variant="inverted"
            startIcon={<Iconify icon="solar:bell-bing-bold-duotone" />}
          >
            NEW
          </Label>
        ),
      },
      {
        title: 'Caption',
        path: '#caption',
        icon: ICONS.menuItem,
        caption:
          'Quisque malesuada placerat nisl. In hac habitasse platea dictumst. Cras id dui. Pellentesque commodo eros a enim. Morbi mollis tellus ac sapien.',
      },
      {
        title: 'Params',
        path: '/dashboard/params?id=e99f09a7-dd88-49d5-b1c8-1daf80c2d7b1',
        icon: ICONS.params,
      },
      {
        title: 'Subpaths',
        path: '/dashboard/subpaths',
        icon: ICONS.subpaths,
        deepMatch: true,
      },
      {
        title: 'External link',
        path: 'https://www.google.com/',
        icon: ICONS.external,
        info: <Iconify width={18} icon="eva:external-link-fill" />,
      },
      { title: 'Blank', path: paths.dashboard.blank, icon: ICONS.blank },
    ],
  },
];

// ----------------------------------------------------------------------

/**
 * Custom hook para obtener el menú de navegación dinámico basado en los módulos del usuario
 * Si no hay módulos, retorna un array vacío (sin menú)
 */
export const useNavData = (modules?: UserModule[]): NavSectionProps['data'] => {
  const { t } = useTranslate('navbar');
  
  // Si no hay módulos, retornar array vacío (sin menú)
  if (!modules || modules.length === 0) {
    return [];
  }

  // Convertir módulos dinámicos a estructura de navegación
  const dynamicNavData = convertModulesToNavData(modules, t);

  try {
    const archIdx = dynamicNavData.findIndex((s) => s.subheader === t('architecture.title'));
    if (archIdx >= 0) {
      const businessTitle = t('business.business');
      const risksTitle = t('business.items.risks.title');
      const matrixTitle = t('business.items.risks.matrix');
      const mapTitle = t('business.items.risks.map');
      const section = dynamicNavData[archIdx];
      let bizItem = section.items.find((it) => it.title === businessTitle);
      if (!bizItem) {
        const createdBizItem: NavItemDataProps = {
          title: businessTitle,
          path: paths.dashboard.architecture.risksTable,
          icon: getNavIcon('business'),
          children: [],
        };
        section.items.push(createdBizItem);
        bizItem = createdBizItem;
      }
      bizItem.children = bizItem.children ?? [];
      let risksItem = bizItem.children.find((it) => it.title === risksTitle);
      if (!risksItem) {
        const createdRisksItem: NavItemDataProps = {
          title: risksTitle,
          path: paths.dashboard.architecture.risksTable,
          icon: getNavIcon('risks'),
          children: [],
        };
        bizItem.children!.push(createdRisksItem);
        risksItem = createdRisksItem;
      }
      risksItem.children = risksItem.children ?? [];
      const already = risksItem.children.some((it) => it.path === paths.dashboard.architecture.riskMatrix || it.title === matrixTitle);
      if (!already) {
        risksItem.children.push({
          title: matrixTitle,
          path: paths.dashboard.architecture.riskMatrix,
          icon: getNavIcon('matrix'),
        });
      }

      const mapChildIdx = risksItem.children.findIndex((it) => it.title === mapTitle);
      if (mapChildIdx >= 0) {
        risksItem.children[mapChildIdx].path = paths.dashboard.architecture.catalogs.riskTypesMap;
      }

      // Add Strategic Objectives
      const strategicObjectivesTitle = t('business.items.strategicObjectives.title');
      const strategicObjectivesTableTitle = t('business.items.strategicObjectives.table');

      let strategicObjectivesItem = bizItem.children.find((it) => it.title === strategicObjectivesTitle);
      if (!strategicObjectivesItem) {
        strategicObjectivesItem = {
          title: strategicObjectivesTitle,
          path: paths.dashboard.architecture.strategicObjectivesTable,
          icon: getNavIcon('modules'),
          children: [],
        };
        bizItem.children.push(strategicObjectivesItem);
      } else {
        strategicObjectivesItem.path = paths.dashboard.architecture.strategicObjectivesTable;
      }
      
      strategicObjectivesItem.children = strategicObjectivesItem.children ?? [];
      const hasTable = strategicObjectivesItem.children.some((it) => it.title === strategicObjectivesTableTitle);
      if (!hasTable) {
        strategicObjectivesItem.children.push({
          title: strategicObjectivesTableTitle,
          path: paths.dashboard.architecture.strategicObjectivesTable,
          icon: getNavIcon('table'),
        });
      }

      // Ensure Positions (Cargos) Table path is correct
      const positionsTitle = t('business.items.positions.title');
      const positionsTableTitle = t('business.items.positions.table');
      
      const positionsItem = bizItem.children.find((it) => it.title === positionsTitle);
      if (positionsItem) {
        positionsItem.path = paths.dashboard.architecture.positionsTable;
        positionsItem.children = positionsItem.children ?? [];
        const positionsTableItem = positionsItem.children.find((it) => it.title === positionsTableTitle);
        if (positionsTableItem) {
          positionsTableItem.path = paths.dashboard.architecture.positionsTable;
        } else {
           positionsItem.children.push({
            title: positionsTableTitle,
            path: paths.dashboard.architecture.positionsTable,
            icon: getNavIcon('table'),
          });
        }
      }

      // Organizational Structure
      const organizationalStructureTitle = t('business.items.organizationalStructure.title');
      const organizationalStructureTableTitle = t('business.items.organizationalStructure.table');
      const organizationalStructureMapTitle = t('business.items.organizationalStructure.map');

      let organizationalStructureItem = bizItem.children.find((it) => it.title === organizationalStructureTitle);
      if (!organizationalStructureItem) {
        organizationalStructureItem = {
          title: organizationalStructureTitle,
          path: paths.dashboard.architecture.organizationalStructureTable,
          icon: getNavIcon('organization'),
          children: [],
        };
        bizItem.children.push(organizationalStructureItem);
      } else {
        organizationalStructureItem.path = paths.dashboard.architecture.organizationalStructureTable;
      }

      organizationalStructureItem.children = organizationalStructureItem.children ?? [];

      const organizationalStructureTableItem = organizationalStructureItem.children.find(
        (it) => it.title === organizationalStructureTableTitle
      );
      if (organizationalStructureTableItem) {
        organizationalStructureTableItem.path = paths.dashboard.architecture.organizationalStructureTable;
      } else {
        organizationalStructureItem.children.push({
          title: organizationalStructureTableTitle,
          path: paths.dashboard.architecture.organizationalStructureTable,
          icon: getNavIcon('table'),
        });
      }

      const organizationalStructureMapItem = organizationalStructureItem.children.find(
        (it) => it.title === organizationalStructureMapTitle
      );
      if (organizationalStructureMapItem) {
        organizationalStructureMapItem.path = paths.dashboard.architecture.organizationalStructureMap;
      } else {
        organizationalStructureItem.children.push({
          title: organizationalStructureMapTitle,
          path: paths.dashboard.architecture.organizationalStructureMap,
          icon: getNavIcon('chart'),
        });
      }
    }
  } catch {
    void 0;
  }

  // Agregar sección de Overview como primera sección (opcional)
  // const overviewSection = {
  //   subheader: 'Overview',
  //   items: [
  //     { title: 'Dashboard', path: paths.dashboard.root, icon: ICONS.dashboard },
  //   ],
  // };

  // return [overviewSection, ...dynamicNavData];
  return dynamicNavData;
};

/**
 * Función para obtener el menú de navegación dinámico basado en los módulos del usuario
 * Si no hay módulos, retorna un array vacío (sin menú)
 * @deprecated Use useNavData instead
 */
export const getNavData = (modules?: UserModule[]): NavSectionProps['data'] => {
  // Si no hay módulos, retornar array vacío (sin menú)
  if (!modules || modules.length === 0) {
    return [];
  }

  // Función de traducción temporal (fallback)
  const tempTranslate = (key: string) => key;

  // Convertir módulos dinámicos a estructura de navegación
  const dynamicNavData = convertModulesToNavData(modules, tempTranslate);

  // Agregar sección de Overview como primera sección (opcional)
  // const overviewSection = {
  //   subheader: 'Overview',
  //   items: [
  //     { title: 'Dashboard', path: paths.dashboard.root, icon: ICONS.dashboard },
  //   ],
  // };

  // return [overviewSection, ...dynamicNavData];
  return dynamicNavData;
};

/**
 * Función para obtener el menú estático (para compatibilidad)
 */
export const getStaticNavData = (): NavSectionProps['data'] => navData;
