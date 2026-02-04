import { kebabCase } from 'es-toolkit';

import { _id, _postTitles } from 'src/_mock/assets';

// ----------------------------------------------------------------------

const MOCK_ID = _id[1];
const MOCK_TITLE = _postTitles[2];

const ROOTS = {
  AUTH: '/auth',
  AUTH_DEMO: '/auth-demo',
  DASHBOARD: '/dashboard',
};

// ----------------------------------------------------------------------

export const paths = {
  comingSoon: '/coming-soon',
  maintenance: '/maintenance',
  pricing: '/pricing',
  payment: '/payment',
  about: '/about-us',
  contact: '/contact-us',
  faqs: '/faqs',
  page403: '/error/403',
  page404: '/error/404',
  page500: '/error/500',
  components: '/components',
  docs: 'https://docs.minimals.cc/',
  changelog: 'https://docs.minimals.cc/changelog/',
  zoneStore: 'https://mui.com/store/items/zone-landing-page/',
  minimalStore: 'https://mui.com/store/items/minimal-dashboard/',
  freeUI: 'https://mui.com/store/items/minimal-dashboard-free/',
  figmaUrl: 'https://www.figma.com/design/WadcoP3CSejUDj7YZc87xj/%5BPreview%5D-Minimal-Web.v7.3.0',
  product: {
    root: `/product`,
    checkout: `/product/checkout`,
    details: (id: string) => `/product/${id}`,
    demo: { details: `/product/${MOCK_ID}` },
  },
  post: {
    root: `/post`,
    details: (title: string) => `/post/${kebabCase(title)}`,
    demo: { details: `/post/${kebabCase(MOCK_TITLE)}` },
  },
  // AUTH
  auth: {
    amplify: {
      signIn: `${ROOTS.AUTH}/amplify/sign-in`,
      verify: `${ROOTS.AUTH}/amplify/verify`,
      signUp: `${ROOTS.AUTH}/amplify/sign-up`,
      updatePassword: `${ROOTS.AUTH}/amplify/update-password`,
      resetPassword: `${ROOTS.AUTH}/amplify/reset-password`,
    },
    jwt: {
      signIn: `${ROOTS.AUTH}/jwt/sign-in`,
      receiptBiometricSignIn: `${ROOTS.AUTH}/jwt/biometric-sign-in`,
      biometricSignIn: (id: string) => `${ROOTS.AUTH}/jwt/biometric-sign-in/${id}/validation`,
      signUp: `${ROOTS.AUTH}/jwt/sign-up`,
      register: `${ROOTS.AUTH}/jwt/register`,
      receiptBiometricIdDocument: `${ROOTS.AUTH}/jwt/reset-biometric-user`,
      resetBiometricUser: (id: string) => `${ROOTS.AUTH}/jwt/reset-biometric-user/${id}/validation`
    },
    firebase: {
      signIn: `${ROOTS.AUTH}/firebase/sign-in`,
      verify: `${ROOTS.AUTH}/firebase/verify`,
      signUp: `${ROOTS.AUTH}/firebase/sign-up`,
      resetPassword: `${ROOTS.AUTH}/firebase/reset-password`,
    },
    auth0: { signIn: `${ROOTS.AUTH}/auth0/sign-in` },
    supabase: {
      signIn: `${ROOTS.AUTH}/supabase/sign-in`,
      verify: `${ROOTS.AUTH}/supabase/verify`,
      signUp: `${ROOTS.AUTH}/supabase/sign-up`,
      updatePassword: `${ROOTS.AUTH}/supabase/update-password`,
      resetPassword: `${ROOTS.AUTH}/supabase/reset-password`,
    },
  },
  authDemo: {
    split: {
      signIn: `${ROOTS.AUTH_DEMO}/split/sign-in`,
      signUp: `${ROOTS.AUTH_DEMO}/split/sign-up`,
      resetPassword: `${ROOTS.AUTH_DEMO}/split/reset-password`,
      updatePassword: `${ROOTS.AUTH_DEMO}/split/update-password`,
      verify: `${ROOTS.AUTH_DEMO}/split/verify`,
    },
    centered: {
      signIn: `${ROOTS.AUTH_DEMO}/centered/sign-in`,
      signUp: `${ROOTS.AUTH_DEMO}/centered/sign-up`,
      resetPassword: `${ROOTS.AUTH_DEMO}/centered/reset-password`,
      updatePassword: `${ROOTS.AUTH_DEMO}/centered/update-password`,
      verify: `${ROOTS.AUTH_DEMO}/centered/verify`,
    },
  },
  // DASHBOARD
  dashboard: {
    root: ROOTS.DASHBOARD,
    mail: `${ROOTS.DASHBOARD}/mail`,
    chat: `${ROOTS.DASHBOARD}/chat`,
    blank: `${ROOTS.DASHBOARD}/blank`,
    kanban: `${ROOTS.DASHBOARD}/kanban`,
    calendar: `${ROOTS.DASHBOARD}/calendar`,
    fileManager: `${ROOTS.DASHBOARD}/file-manager`,
    permission: `${ROOTS.DASHBOARD}/permission`,
    general: {
      app: `${ROOTS.DASHBOARD}/app`,
      ecommerce: `${ROOTS.DASHBOARD}/ecommerce`,
      analytics: `${ROOTS.DASHBOARD}/analytics`,
      banking: `${ROOTS.DASHBOARD}/banking`,
      booking: `${ROOTS.DASHBOARD}/booking`,
      file: `${ROOTS.DASHBOARD}/file`,
      course: `${ROOTS.DASHBOARD}/course`,
    },
    user: {
      root: `${ROOTS.DASHBOARD}/user`,
      new: `${ROOTS.DASHBOARD}/user/new`,
      list: `${ROOTS.DASHBOARD}/user/list`,
      cards: `${ROOTS.DASHBOARD}/user/cards`,
      profile: `${ROOTS.DASHBOARD}/user/profile`,
      account: `${ROOTS.DASHBOARD}/user/account`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/user/${id}/edit`,
      demo: { edit: `${ROOTS.DASHBOARD}/user/${MOCK_ID}/edit` },
      biometricActivation: `${ROOTS.DASHBOARD}/user/biometric-activation`,
    },
    product: {
      root: `${ROOTS.DASHBOARD}/product`,
      new: `${ROOTS.DASHBOARD}/product/new`,
      details: (id: string) => `${ROOTS.DASHBOARD}/product/${id}`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/product/${id}/edit`,
      demo: {
        details: `${ROOTS.DASHBOARD}/product/${MOCK_ID}`,
        edit: `${ROOTS.DASHBOARD}/product/${MOCK_ID}/edit`,
      },
    },
    invoice: {
      root: `${ROOTS.DASHBOARD}/invoice`,
      new: `${ROOTS.DASHBOARD}/invoice/new`,
      details: (id: string) => `${ROOTS.DASHBOARD}/invoice/${id}`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/invoice/${id}/edit`,
      demo: {
        details: `${ROOTS.DASHBOARD}/invoice/${MOCK_ID}`,
        edit: `${ROOTS.DASHBOARD}/invoice/${MOCK_ID}/edit`,
      },
    },
    post: {
      root: `${ROOTS.DASHBOARD}/post`,
      new: `${ROOTS.DASHBOARD}/post/new`,
      details: (title: string) => `${ROOTS.DASHBOARD}/post/${kebabCase(title)}`,
      edit: (title: string) => `${ROOTS.DASHBOARD}/post/${kebabCase(title)}/edit`,
      demo: {
        details: `${ROOTS.DASHBOARD}/post/${kebabCase(MOCK_TITLE)}`,
        edit: `${ROOTS.DASHBOARD}/post/${kebabCase(MOCK_TITLE)}/edit`,
      },
    },
    order: {
      root: `${ROOTS.DASHBOARD}/order`,
      details: (id: string) => `${ROOTS.DASHBOARD}/order/${id}`,
      demo: { details: `${ROOTS.DASHBOARD}/order/${MOCK_ID}` },
    },
    job: {
      root: `${ROOTS.DASHBOARD}/job`,
      new: `${ROOTS.DASHBOARD}/job/new`,
      details: (id: string) => `${ROOTS.DASHBOARD}/job/${id}`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/job/${id}/edit`,
      demo: {
        details: `${ROOTS.DASHBOARD}/job/${MOCK_ID}`,
        edit: `${ROOTS.DASHBOARD}/job/${MOCK_ID}/edit`,
      },
    },
    tour: {
      root: `${ROOTS.DASHBOARD}/tour`,
      new: `${ROOTS.DASHBOARD}/tour/new`,
      details: (id: string) => `${ROOTS.DASHBOARD}/tour/${id}`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/tour/${id}/edit`,
      demo: {
        details: `${ROOTS.DASHBOARD}/tour/${MOCK_ID}`,
        edit: `${ROOTS.DASHBOARD}/tour/${MOCK_ID}/edit`,
      },
    },

    // Ekorp
    // Dashboard Modules
    collaborator: `${ROOTS.DASHBOARD}/collaborator`,
    clarityAdmin: `${ROOTS.DASHBOARD}/admin-panel`,


    // Employees Modules
    employees: {
      // Type Employment
      typeEmployment: `${ROOTS.DASHBOARD}/employees/employment-type`,
      typeEmploymentEdit: (id: string) => `${ROOTS.DASHBOARD}/employees/employment-type/edit/${id}`,
      typeEmploymentCreate: `${ROOTS.DASHBOARD}/employees/employment-type/create`,

      // User Managment
      userManagment: `${ROOTS.DASHBOARD}/employees/users-managment`,
      userManagmentEdit: (id: string) => `${ROOTS.DASHBOARD}/employees/users-managment/edit/${id}`,
      userManagmentCreate: `${ROOTS.DASHBOARD}/employees/users-managment/create`,

      // Payment period
      paymentPeriod: `${ROOTS.DASHBOARD}/employees/payment-period`,
      paymentPeriodEdit: (id: string) => `${ROOTS.DASHBOARD}/employees/payment-period/edit/${id}`,
      paymentPeriodCreate: `${ROOTS.DASHBOARD}/employees/payment-period/create`,

      // Skills
      skills: `${ROOTS.DASHBOARD}/employees/skills`,
      skillsEdit: (id: string) => `${ROOTS.DASHBOARD}/employees/skills/edit/${id}`,
      skillsCreate: `${ROOTS.DASHBOARD}/employees/skills/create`,
    },

    // Organizations Modules
    organizations: {
      // Company
      company: `${ROOTS.DASHBOARD}/organization/company`,

      // Organizational Unit
      organizationalUnit: `${ROOTS.DASHBOARD}/organization/organizational-unit`,
      organizationalUnitTable: `${ROOTS.DASHBOARD}/organization/organizational-unit/table`,
      organizationalUnitCreate: `${ROOTS.DASHBOARD}/organization/organizational-unit/create`,
      organizationalUnitEdit: (id: string) =>
        `${ROOTS.DASHBOARD}/organization/organizational-unit/edit/${id}`,

      // Organizations
      organizations: `${ROOTS.DASHBOARD}/organization/organizations`,
      organizationsEdit: (id: string) => `${ROOTS.DASHBOARD}/organization/organizations/edit/${id}`,
      organizationsCreate: `${ROOTS.DASHBOARD}/organization/organizations/create`,

      // Positions
      positions: `${ROOTS.DASHBOARD}/organization/positions`,
      positionsEdit: (id: string) => `${ROOTS.DASHBOARD}/organization/positions/edit/${id}`,
      positionsCreate: `${ROOTS.DASHBOARD}/organization/positions/create`,

      // Vigencies
      vigencies: `${ROOTS.DASHBOARD}/organization/vigency`,
      vigenciesEdit: (id: string) => `${ROOTS.DASHBOARD}/organization/vigency/edit/${id}`,
      vigenciesCreate: `${ROOTS.DASHBOARD}/organization/vigency/create`,

      // Vigencies | Periods
      vigenciesPeriods: (id: string) => `${ROOTS.DASHBOARD}/organization/vigency/${id}/periods`,
      vigenciesPeriodsEdit: (id: string, periodId: string) => `${ROOTS.DASHBOARD}/organization/vigency/${id}/periods/edit/${periodId}`,
      vigenciesPeriodsCreate: (id: string) => `${ROOTS.DASHBOARD}/organization/vigency/${id}/periods/create`,
    },

    // Security Modules
    security: {
      // Roles
      roles: `${ROOTS.DASHBOARD}/security/roles`,
      rolesCreate: `${ROOTS.DASHBOARD}/security/roles/create`,
      rolesEdit: (id: string) => `${ROOTS.DASHBOARD}/security/roles/edit/${id}`,

      // Role Permissions
      rolePermissions: (id: string) => `${ROOTS.DASHBOARD}/security/permissions/${id}`,

      // Users
      users: `${ROOTS.DASHBOARD}/security/users`,
      usersCreate: `${ROOTS.DASHBOARD}/security/users/create`,
      usersEdit: (id: string) => `${ROOTS.DASHBOARD}/security/users/edit/${id}`,
    },

    // Assets Modules
    assets: {
      inventory: `${ROOTS.DASHBOARD}/assets/list`,
      inventoryCreate: `${ROOTS.DASHBOARD}/assets/list/create`,
      inventoryEdit: (id: string) => `${ROOTS.DASHBOARD}/assets/list/edit/${id}`,

      // Inventory Categories
      inventoryCategories: `${ROOTS.DASHBOARD}/assets/categories`,
      inventoryCategoriesCreate: `${ROOTS.DASHBOARD}/assets/categories/create`,
      inventoryCategoriesEdit: (id: string) => `${ROOTS.DASHBOARD}/assets/categories/edit/${id}`,

      // History
      inventoryHistoryById: (id: string) => `${ROOTS.DASHBOARD}/assets/list/${id}/record`,
      inventoryHistory: `${ROOTS.DASHBOARD}/assets/record`,
    },


    // Settings Modules
    settings: {
      // Coins
      coins: `${ROOTS.DASHBOARD}/settings/coins`,
      coinsEdit: (id: string) => `${ROOTS.DASHBOARD}/settings/coins/edit/${id}`,
      coinsCreate: `${ROOTS.DASHBOARD}/settings/coins/create`,

      // Languages
      languages: `${ROOTS.DASHBOARD}/settings/languages`,
      languagesEdit: (id: string) => `${ROOTS.DASHBOARD}/settings/languages/edit/${id}`,
      languagesCreate: `${ROOTS.DASHBOARD}/settings/languages/create`,

      // Tags
      tags: `${ROOTS.DASHBOARD}/settings/tags`,
      tagsEdit: (id: string) => `${ROOTS.DASHBOARD}/settings/tags/edit/${id}`,
      tagsCreate: `${ROOTS.DASHBOARD}/settings/tags/create`,

      // Integrations
      integrations: `${ROOTS.DASHBOARD}/settings/integrations`,
      integrationsEdit: (id: string) => `${ROOTS.DASHBOARD}/settings/integrations/edit/${id}`,
      integrationsCreate: `${ROOTS.DASHBOARD}/settings/integrations/create`,
      categoryList: (instanceId: string) => `${ROOTS.DASHBOARD}/settings/integrations/categories/${instanceId}`,
      courseListing: (instanceId: string, categoryLmsId: string) => `${ROOTS.DASHBOARD}/settings/integrations/categories/${instanceId}/course/${categoryLmsId}`,
    },

    // Learning Modules
    learning: {
      // Learning Objects
      learningObjects: `${ROOTS.DASHBOARD}/learning/objects`,
      learningObjectsEdit: (id: string) => `${ROOTS.DASHBOARD}/learning/objects/edit/${id}`,
      learningObjectsCreate: `${ROOTS.DASHBOARD}/learning/objects/create`,
      learningObjectsDetails: (id: string) => `${ROOTS.DASHBOARD}/learning/objects/${id}`,

      // Learning Paths
      learningPaths: `${ROOTS.DASHBOARD}/learning/paths`,
      learningPathsEdit: (id: string) => `${ROOTS.DASHBOARD}/learning/paths/edit/${id}`,
      learningPathsCreate: `${ROOTS.DASHBOARD}/learning/paths/create`,
      learningPathsDetails: (id: string) => `${ROOTS.DASHBOARD}/learning/paths/${id}`,

      // Learning Categories
      learningCategories: `${ROOTS.DASHBOARD}/learning/categories`,
      learningCategoriesEdit: (id: string) => `${ROOTS.DASHBOARD}/learning/categories/edit/${id}`,
      learningCategoriesCreate: `${ROOTS.DASHBOARD}/learning/categories/create`,

      // Learning Tracking
      learningTracking: `${ROOTS.DASHBOARD}/learning/tracking`,
      learningTrackingDetails: (id: string) => `${ROOTS.DASHBOARD}/learning/tracking/${id}`,

      // Learning Reports
      learningReports: `${ROOTS.DASHBOARD}/learning/reports`,

      // Courses
      productCourses: `${ROOTS.DASHBOARD}/corporate-university/course`,
      productCoursesEdit: (id: string) => `${ROOTS.DASHBOARD}/corporate-university/course/edit/${id}`,
      productCoursesCreate: `${ROOTS.DASHBOARD}/corporate-university/course/create`,
      productCoursesDetails: (id: string) => `${ROOTS.DASHBOARD}/corporate-university/course/${id}`,
    },

    // REWARDS MODULES
    rewards: {
      // Rewards
      rewards: `${ROOTS.DASHBOARD}/rewards`,
      rewardsEdit: (id: string) => `${ROOTS.DASHBOARD}/rewards/edit/${id}`,
      rewardsCreate: `${ROOTS.DASHBOARD}/rewards/create`,

      // Rewards Categories
      rewardsCategories: `${ROOTS.DASHBOARD}/rewards/categories`,
      rewardsCategoriesEdit: (id: string) => `${ROOTS.DASHBOARD}/rewards/categories/edit/${id}`,
      rewardsCategoriesCreate: `${ROOTS.DASHBOARD}/rewards/categories/create`,

      // Rewards History
      rewardsHistory: `${ROOTS.DASHBOARD}/rewards/history`,

      // Rewards Rules
      rewardsRules: `${ROOTS.DASHBOARD}/rewards/rules`,
      rewardsRulesEdit: (id: string) => `${ROOTS.DASHBOARD}/rewards/rules/edit/${id}`,
      rewardsRulesCreate: `${ROOTS.DASHBOARD}/rewards/rules/create`,

      // Rewards Type Rules
      rewardsRuleType: `${ROOTS.DASHBOARD}/rewards/rule-type`,
      rewardsRuleTypeEdit: (id: string) => `${ROOTS.DASHBOARD}/rewards/rule-type/edit/${id}`,
      rewardsRuleTypeCreate: `${ROOTS.DASHBOARD}/rewards/rule-type/create`,
    },


    // USER MODULES
    userLearning: {
      // My Learning
      myLearning: `${ROOTS.DASHBOARD}/corporate-university/learning-module`,
      myLearningDetails: (id: string) => `${ROOTS.DASHBOARD}/corporate-university/learning-module/${id}`,

      // My Learning Paths
      myLearningPaths: `${ROOTS.DASHBOARD}/corporate-university/learning-path`,
      myLearningPathsDetails: (id: string) => `${ROOTS.DASHBOARD}/corporate-university/learning-path/${id}`,

      // My Rewards
      myRewards: `${ROOTS.DASHBOARD}/corporate-university/reward`,
      myRewardsDetails: (id: string) => `${ROOTS.DASHBOARD}/corporate-university/reward/${id}`,
    },

    // Performance Modules
    performance: {
      // Scales
      scales: `${ROOTS.DASHBOARD}/performance/scales`,
      scalesEdit: (id: string) => `${ROOTS.DASHBOARD}/performance/scales/edit/${id}`,
      scalesCreate: `${ROOTS.DASHBOARD}/performance/scales/create`,

      // Configure Tests
      configureTests: `${ROOTS.DASHBOARD}/performance/test`,
      configureTestsEdit: (id: string) => `${ROOTS.DASHBOARD}/performance/test/edit/${id}`,
      configureTestsCreate: `${ROOTS.DASHBOARD}/performance/test/create`,

      // Configure Evaluations
      configureEvaluations: `${ROOTS.DASHBOARD}/performance/configure-evaluations`,
      configureEvaluationsEdit: (id: string) => `${ROOTS.DASHBOARD}/performance/configure-evaluations/edit/${id}`,
      configureEvaluationsCreate: `${ROOTS.DASHBOARD}/performance/configure-evaluations/create`,
      configureEvaluationsParticipants: (id: string) => `${ROOTS.DASHBOARD}/performance/configure-evaluations/edit/${id}/participants`,
      listParticipantsWithEvaluators: (id: string) => `${ROOTS.DASHBOARD}/performance/configure-evaluations/edit/${id}/participants-with-evaluators`,
      configureQuestions: (id: string, competenceId: string) => `${ROOTS.DASHBOARD}/performance/configure-evaluations/edit/${id}/questions/${competenceId}`,

      // Evaluation Responses
      evaluationResponses: `${ROOTS.DASHBOARD}/performance/evaluationlist`,
      evaluationResponsesView: (id: string) => `${ROOTS.DASHBOARD}/performance/evaluationlist/by-evaluator-assignment/${id}`,
      evaluationResponsesUserHistory: (assignmentId: string) => `${ROOTS.DASHBOARD}/performance/evaluationlist/response-history/${assignmentId}`,
      evaluationResponsesUserObjectives: (assignmentId: string) => `${ROOTS.DASHBOARD}/performance/evaluationlist/user-objectives/${assignmentId}`,
      evaluationMyResults: (campaingId: string) => `${ROOTS.DASHBOARD}/performance/evaluationlist/${campaingId}/results`,
      
      // Evaluate
      evaluate: `${ROOTS.DASHBOARD}/performance/evaluate`,

      // Nine Box
      nineBox: `${ROOTS.DASHBOARD}/performance/evaluate/ninebox/matrix`,
      nineBoxMatrix: (id: string) => `${ROOTS.DASHBOARD}/performance/evaluate/ninebox/matrix/${id}/nine-box`,
      nineBoxHistory:  (id: string) => `${ROOTS.DASHBOARD}/performance/evaluate/ninebox/matrix/${id}/nine-box-history`,
      
      // Nine Box Settings
      nineBoxSettings: `${ROOTS.DASHBOARD}/performance/evaluate/ninebox/settings`,
    },


    // ARQUITECTURE MODULES

    architecture: {


      // -------------------------------------------------------------------------------------------------


      // BUSINESS MODULES

      // Strategic Objectives

      // Map
      strategicObjectivesMap: `${ROOTS.DASHBOARD}/architecture/business/strategic-objectives/map`,
      strategicObjectivesTableMap: (id: string) =>
        `${ROOTS.DASHBOARD}/architecture/business/strategic-objectives/table/map/${id}`,
      strategicObjectivesTableMapExpand: (id: string, nodeId: string) =>
        `${ROOTS.DASHBOARD}/architecture/business/strategic-objectives/table/map/${id}/expand/${nodeId}`,
      // Table
      strategicObjectivesTable: `${ROOTS.DASHBOARD}/architecture/business/strategic-objectives/table`,
      strategicObjectivesTableCreate: `${ROOTS.DASHBOARD}/architecture/business/strategic-objectives/table/create`,

      // Positions

      // Map
      positionsMap: `${ROOTS.DASHBOARD}/architecture/business/positions/map`,
      positionsTableMap: (id: string) => `${ROOTS.DASHBOARD}/architecture/business/positions/map/${id}`,
      positionsTableMapExpand: (id: string, nodeId: string) =>
        `${ROOTS.DASHBOARD}/architecture/business/positions/map/${id}/expand/${nodeId}`,
      // Table
      positionsTable: `${ROOTS.DASHBOARD}/architecture/business/positions/table`,

      // Actions

      // Table
      actionsTable: `${ROOTS.DASHBOARD}/architecture/business/actions/table`,
      // Map
      actionsMap: `${ROOTS.DASHBOARD}/architecture/business/actions/map`,

      // Risks

      // Map
      risksMap: `${ROOTS.DASHBOARD}/architecture/catalogs/risk-types/map`,
      risksTableMap: (id: string) => `${ROOTS.DASHBOARD}/architecture/business/risks/table/map/${id}`,
      // Table
      risksTable: `${ROOTS.DASHBOARD}/architecture/business/risks/table`,
      // Matrix
      riskMatrix: `${ROOTS.DASHBOARD}/architecture/business/risks/matrix`,

      // Processes

      // Map
      processesMap: `${ROOTS.DASHBOARD}/architecture/business/processes/map`,
      // Flow
      processesFlow: `${ROOTS.DASHBOARD}/architecture/business/processes/flow`,
      // Table
      processesTable: `${ROOTS.DASHBOARD}/architecture/business/processes/table`,
      processesRasciMatrix: `${ROOTS.DASHBOARD}/architecture/business/processes/rasci-matrix`,
      processesTableMap: (id: string) => `${ROOTS.DASHBOARD}/architecture/business/processes/table/map/${id}`,
      processesTableEdit: (id: string) => `${ROOTS.DASHBOARD}/architecture/business/processes/table/edit/${id}`,
      processesTableCreate: `${ROOTS.DASHBOARD}/architecture/business/processes/table/create`,

      // Tools

      // Table
      toolsTable: `${ROOTS.DASHBOARD}/architecture/business/tools/table`,
      toolsTableCreate: `${ROOTS.DASHBOARD}/architecture/business/tools/table/create`,
      // Map
      toolsMap: `${ROOTS.DASHBOARD}/architecture/business/tools/map`,
      toolsTableMap: (id: string) => `${ROOTS.DASHBOARD}/architecture/business/tools/table/map/${id}`,
      toolsTableMapExpand: (id: string, nodeId: string) =>
        `${ROOTS.DASHBOARD}/architecture/business/tools/table/map/${id}/expand/${nodeId}`,

      // Organizational Structure

      // Table
      organizationalStructureTable: `${ROOTS.DASHBOARD}/architecture/business/organizational-structure/table`,
      organizationalStructureTableCreate: `${ROOTS.DASHBOARD}/architecture/business/organizational-structure/table/create`,
      // Map
      organizationalStructureMap: `${ROOTS.DASHBOARD}/architecture/business/organizational-structure/map`,
      organizationalStructureTableMap: (id: string) =>
        `${ROOTS.DASHBOARD}/architecture/business/organizational-structure/map/${id}`,
      organizationalStructureTableMapExpand: (id: string, nodeId: string) =>
        `${ROOTS.DASHBOARD}/architecture/business/organizational-structure/map/${id}/expand/${nodeId}`,


      // -------------------------------------------------------------------------------------------------


      // APPLICATION MODULES

      // Table
      applicationsTable: `${ROOTS.DASHBOARD}/architecture/applications/table`,
      // Map
      applicationsTableMap: (id: string) => `${ROOTS.DASHBOARD}/architecture/applications/table/map/${id}`,
      // Diagram
      applicationsDiagram: `${ROOTS.DASHBOARD}/architecture/applications/diagram`,
      // Timeline
      applicationsTimeline: `${ROOTS.DASHBOARD}/architecture/applications/timeline`,


      // -------------------------------------------------------------------------------------------------


      // DATA MODULES

      // Table
      dataTable: `${ROOTS.DASHBOARD}/architecture/data/table`,
      // Map
      dataTableMap: (id: string) => `${ROOTS.DASHBOARD}/architecture/data/table/map/${id}`,
      // Diagram
      dataDiagram: `${ROOTS.DASHBOARD}/architecture/data/diagram`,
      // Timeline
      dataTimeline: `${ROOTS.DASHBOARD}/architecture/data/timeline`,


      // -------------------------------------------------------------------------------------------------


      // INFRASTRUCTURE MODULES

      // Table
      infrastructureTable: `${ROOTS.DASHBOARD}/architecture/infrastructure/table`,
      // Map
      infrastructureTableMap: (id: string) => `${ROOTS.DASHBOARD}/architecture/infrastructure/table/map/${id}`,
      // Diagram
      infrastructureDiagram: `${ROOTS.DASHBOARD}/architecture/infrastructure/diagram`,
      // Timeline
      infrastructureTimeline: `${ROOTS.DASHBOARD}/architecture/infrastructure/timeline`,

      // -------------------------------------------------------------------------------------------------


      // CATALOGS MANAGEMENT

      // Main View
      catalogs: {

        root: `${ROOTS.DASHBOARD}/architecture/catalogs`,

        // Action type
        actionType: `${ROOTS.DASHBOARD}/architecture/catalogs/action-type`,
        // Competency class
        competenciesClasses: `${ROOTS.DASHBOARD}/architecture/catalogs/competencies-classes`,
        // Competencies
        competencies: `${ROOTS.DASHBOARD}/architecture/catalogs/competencies`,
        // Data types
        dataTypes: `${ROOTS.DASHBOARD}/architecture/catalogs/data-types`,
        // Job types
        jobTypes: `${ROOTS.DASHBOARD}/architecture/catalogs/job-types`,
        // Measure action types
        measureActionTypes: `${ROOTS.DASHBOARD}/architecture/catalogs/measure-action-types`,
        // Objective types
        objectiveTypes: `${ROOTS.DASHBOARD}/architecture/catalogs/objective-types`,
        // Organizational unit types
        organizationalUnitTypes: `${ROOTS.DASHBOARD}/architecture/catalogs/organizational-unit-types`,
        // Process types
        processTypes: `${ROOTS.DASHBOARD}/architecture/catalogs/process-types`,
        // Providers
        providers: `${ROOTS.DASHBOARD}/architecture/catalogs/providers`,
        // Risk types
        riskTypes: `${ROOTS.DASHBOARD}/architecture/catalogs/risk-types`,
        // Risk types map
        riskTypesMap: `${ROOTS.DASHBOARD}/architecture/catalogs/risk-types/map`,
        // Risk levels CRUD
        riskTypesProbabilityLevels: (riskTypeId: string | number) =>
          `${ROOTS.DASHBOARD}/architecture/catalogs/risk-types/probability?risktype=${riskTypeId}`,
        riskTypesImpactLevels: (riskTypeId: string | number) =>
          `${ROOTS.DASHBOARD}/architecture/catalogs/risk-types/impact?risktype=${riskTypeId}`,
        riskTypesToleranceLevels: (riskTypeId: string | number) =>
          `${ROOTS.DASHBOARD}/architecture/catalogs/risk-types/tolerance?risktype=${riskTypeId}`,
        riskTypesDeficiencyLevels: (riskTypeId: string | number) =>
          `${ROOTS.DASHBOARD}/architecture/catalogs/risk-types/deficiency?risktype=${riskTypeId}`,
        // System types
        systemTypes: `${ROOTS.DASHBOARD}/architecture/catalogs/system-types`,
        // Technology types
        technologyTypes: `${ROOTS.DASHBOARD}/architecture/catalogs/technology-types`,
        // Tool types
        toolTypes: `${ROOTS.DASHBOARD}/architecture/catalogs/tool-types`,
        // Topics
        topics: `${ROOTS.DASHBOARD}/architecture/catalogs/topics`,
        // Domains
        domains: `${ROOTS.DASHBOARD}/architecture/catalogs/domains`,
        // Date Controls
        dateControls: `${ROOTS.DASHBOARD}/architecture/catalogs/date-controls`,
      },

      actionMeasures: `${ROOTS.DASHBOARD}/architecture/action-measures`,
    },

    ai: {
      courseGenerator: {
        root: `${ROOTS.DASHBOARD}/ai/course-generator`,
        create: `${ROOTS.DASHBOARD}/ai/course-generator/create`,
        edit: (id: string) => `${ROOTS.DASHBOARD}/ai/course-generator/edit/${id}`,
        view: (id: string) => `${ROOTS.DASHBOARD}/ai/course-generator/view/${id}`
      },
      providerSettings: {
        root: `${ROOTS.DASHBOARD}/ai/provider-settings`,
        create: `${ROOTS.DASHBOARD}/ai/provider-settings/create`,
        edit: (id: string) => `${ROOTS.DASHBOARD}/ai/provider-settings/${id}/edit`,
      },
      modelsSettings: {
        root: (providerId: string) => `${ROOTS.DASHBOARD}/ai/provider-settings/${providerId}/edit/models-settings`,
        create: (providerId: string) => `${ROOTS.DASHBOARD}/ai/provider-settings/${providerId}/edit/models-settings/create`,
        edit: (providerId: string, id: string) => `${ROOTS.DASHBOARD}/ai/provider-settings/${providerId}/edit/models-settings/${id}/edit`,
      }
    },
  }
};
